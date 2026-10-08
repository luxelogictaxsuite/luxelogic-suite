// Shared fulfillment logic for software purchases.
// Used by both handleStripeWebhook (Stripe payment) and markSoftwarePaid (manual/free).
//
// What "fulfill" means:
//   1. Marks the SoftwarePurchase lead as paid (paid=true, payment_method, amount_paid, status=Registration Sent)
//   2. Creates/upserts a CRM Member profile so the ERO exists in the CRM
//   3. For 70/30 Membership: also creates a Preparer profile so they can access the Suite
//   4. Emails the customer their registration form link
//   5. Notifies all admins that payment was received
//
// Idempotent: if the lead is already paid, returns early without re-sending.

const CRM_APP_ID = '6ab68a3df4840f6449286050';
const CRM_BASE = 'https://app.base44.com/api';
const DEFAULT_LOCKED = JSON.stringify(['comp_tier', 'ce_hours_completed', 'ce_hours_required', 'training_seat_key']);

function splitName(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: 'Customer', last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') || parts[0] };
}

// Upsert a Member profile in the LuxeLogic CRM by email.
// Creates if missing; merges into existing so CRM-specific metadata is preserved.
async function upsertCrmMember(lead, paymentMethod, crmToken) {
  if (!crmToken || !lead.email) return { ok: false, reason: 'no token or email' };

  const profileNote = [
    `Software: ${lead.software || 'TaxSlayer Pro'}`,
    lead.efin ? `EFIN: ${lead.efin}` : '',
    `Payment: ${paymentMethod}`,
    lead.office_size ? `Office: ${lead.office_size}` : '',
  ].filter(Boolean).join(' · ');

  const payload = {
    name: lead.full_name || lead.email,
    email: lead.email,
    phone: lead.phone || '',
    notes: profileNote,
  };

  try {
    const baseUrl = `${CRM_BASE}/apps/${CRM_APP_ID}/entities/Member`;
    const filterRes = await fetch(`${baseUrl}?limit=500`, {
      headers: { Authorization: `Bearer ${crmToken}` }
    });
    if (!filterRes.ok) return { ok: false, reason: `filter ${filterRes.status}` };
    const members = await filterRes.json();
    const match = members.find(m => m.email?.toLowerCase() === lead.email?.toLowerCase());

    if (match) {
      // Merge our fields into the existing member — preserve CRM metadata.
      const merged = { ...match, ...payload };
      delete merged.id;
      delete merged.created_date;
      delete merged.updated_date;
      delete merged.created_by_id;
      merged.status = match.status || 'Active';
      merged.member_type = match.member_type || 'ERO';
      merged.onboarding_stage = 'Payment Received';
      const res = await fetch(`${baseUrl}/${match.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${crmToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (!res.ok) return { ok: false, reason: `update ${res.status}` };
      return { ok: true, id: match.id, action: 'updated' };
    }

    // No existing member — create one.
    const memberType = lead.software === '70/30 Membership' ? 'PTIN Member' : 'ERO';
    const createPayload = {
      ...payload,
      status: 'Active',
      member_type: memberType,
      onboarding_stage: 'Payment Received',
    };
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${crmToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload),
    });
    if (!res.ok) return { ok: false, reason: `create ${res.status}` };
    const created = await res.json();
    return { ok: true, id: created.id || created._id, action: 'created' };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// For 70/30 Membership purchases: create a Preparer profile so the purchaser
// can log into the Preparer Suite. Also pushes the profile to the CRM.
async function ensurePreparerProfile(base44, lead, crmToken) {
  if (lead.software !== '70/30 Membership') return { skipped: true };

  try {
    const existing = await base44.asServiceRole.entities.Preparer.filter({ email: lead.email });
    if (existing.length > 0) {
      return { skipped: true, reason: 'already_exists', id: existing[0].id };
    }

    const preparer = await base44.asServiceRole.entities.Preparer.create({
      name: lead.full_name || lead.email,
      email: lead.email,
      phone: lead.phone || '',
      comp_tier: '70/30',
      active: true,
      locked_fields: DEFAULT_LOCKED,
    });

    // Best-effort: push the new preparer profile to CRM as a Tax Preparer member.
    let crmPush = null;
    if (crmToken) {
      try {
        crmPush = await upsertPreparerToCRM(preparer, crmToken);
      } catch (e) { /* best-effort */ }
    }

    return { created: true, id: preparer.id, crm: crmPush };
  } catch (e) {
    return { error: e.message };
  }
}

// Pushes a preparer profile to the CRM Member entity (used by ensurePreparerProfile).
async function upsertPreparerToCRM(preparer, crmToken) {
  const profileNote = [
    preparer.training_seat_key ? `Seat Key: ${preparer.training_seat_key}` : '',
    `Comp Tier: ${preparer.comp_tier}`,
  ].filter(Boolean).join(' · ');

  const payload = {
    name: preparer.name,
    email: preparer.email,
    phone: preparer.phone || '',
    notes: profileNote,
  };

  try {
    const baseUrl = `${CRM_BASE}/apps/${CRM_APP_ID}/entities/Member`;
    const filterRes = await fetch(`${baseUrl}?limit=500`, {
      headers: { Authorization: `Bearer ${crmToken}` }
    });
    if (!filterRes.ok) return { ok: false, reason: `filter ${filterRes.status}` };
    const members = await filterRes.json();
    const match = members.find(m => m.email?.toLowerCase() === preparer.email?.toLowerCase());

    if (match) {
      const merged = { ...match, ...payload };
      delete merged.id;
      delete merged.created_date;
      delete merged.updated_date;
      delete merged.created_by_id;
      merged.member_type = 'PTIN Member';
      merged.onboarding_stage = match.onboarding_stage || 'Payment Received';
      const res = await fetch(`${baseUrl}/${match.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${crmToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
      if (!res.ok) return { ok: false, reason: `update ${res.status}` };
      return { ok: true, action: 'updated' };
    }

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${crmToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, status: 'Active', member_type: 'PTIN Member', onboarding_stage: 'Payment Received' }),
    });
    if (!res.ok) return { ok: false, reason: `create ${res.status}` };
    return { ok: true, action: 'created' };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

export async function fulfillPurchase(base44, opts) {
  const { lead, paymentMethod, amount, crmToken } = opts;

  // Idempotent — skip if already fulfilled.
  if (lead.paid) {
    return { skipped: true, reason: 'already_paid', leadId: lead.id };
  }

  // 1. Mark the lead as paid (with amount).
  try {
    await base44.asServiceRole.entities.SoftwarePurchase.update(lead.id, {
      paid: true,
      payment_method: paymentMethod,
      amount_paid: amount || 0,
      status: 'Registration Sent',
    });
  } catch (e) {
    return { error: `Failed to mark paid: ${e.message}` };
  }

  // 2. Create/upsert CRM Member profile.
  const crm = await upsertCrmMember(lead, paymentMethod, crmToken);

  // 3. For 70/30 Membership: create a Preparer profile + push to CRM.
  const preparer = await ensurePreparerProfile(base44, lead, crmToken);

  // 4. Resolve the registration form link based on software type (admin-editable).
  let regLink = '';
  const regKey = lead.software === 'OLT Pro'
    ? 'registration_olt'
    : lead.software === '70/30 Membership'
      ? 'registration_7030_specialist'
      : 'registration_taxslayer';
  try {
    const links = await base44.asServiceRole.entities.SiteLink.filter({ key: regKey });
    regLink = String(links?.[0]?.url || '');
  } catch (e) { /* link not configured yet */ }
  if (!regLink) {
    try {
      const links = await base44.asServiceRole.entities.SiteLink.filter({ key: 'crm_software_registration' });
      regLink = String(links?.[0]?.url || '');
    } catch (e) { /* fallback not configured either */ }
  }

  const software = lead.software || 'TaxSlayer Pro';
  const amountLine = amount ? `Amount: $${(amount / 100).toFixed(2)}\n` : '';
  const methodLabel = paymentMethod === 'Free' ? 'Gifted (free)' : paymentMethod;

  // 5. Notify all admins.
  const subject = `Payment received — ${software}`;
  const adminText =
    `A software purchase was marked as paid (${methodLabel}).\n\n` +
    `Client: ${lead.full_name}\nEmail: ${lead.email}\nPhone: ${lead.phone || '—'}\n` +
    `Software: ${software}\nEFIN: ${lead.efin || '—'}\n${amountLine}` +
    `CRM Member: ${crm.ok ? `${crm.action} (ID: ${crm.id})` : `failed (${crm.reason})`}\n` +
    (preparer.created ? `Preparer profile created (ID: ${preparer.id})\n` : '') +
    `\nRegistration link sent to customer: ${regLink || '(not set — add crm_software_registration in Links Manager)'}\n\n` +
    `Review it in Admin → Software Purchases.`;

  const notified = [];
  try {
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    for (const a of admins) {
      if (!a.email) continue;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: a.email, subject, text: adminText });
        notified.push(a.email);
      } catch (e) { /* individual send failure should not abort others */ }
    }
  } catch (e) { /* admin lookup failure should not abort the response */ }

  // 6. Best-effort: email the customer their registration link.
  let customerTried = false;
  if (lead.email && regLink) {
    try {
      customerTried = true;
      const customerText = paymentMethod === 'Free'
        ? `Hi ${lead.full_name},\n\nGreat news — your ${software} software license has been activated as a courtesy. Your software registration has been started in our system.\n\nComplete your software registration here:\n${regLink}\n\nOur team will begin your build process right away.\n\n— The LuxeLogic Team`
        : `Hi ${lead.full_name},\n\nWe received your payment for ${software}. Your software registration has been started in our system.\n\nComplete your software registration here:\n${regLink}\n\nOur team will begin your build process right away.\n\n— The LuxeLogic Team`;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.email,
        subject: `Payment received — your ${software} registration is underway`,
        text: customerText,
      });
    } catch (e) { /* non-registered recipient — captured, not delivered */ }
  }

  return {
    fulfilled: true,
    leadId: lead.id,
    crmMember: crm,
    preparer,
    regLink,
    notified,
    customerTried,
  };
}