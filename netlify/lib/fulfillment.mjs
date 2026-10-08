// Software purchase fulfillment — shared by the Stripe webhook and the
// admin "Mark paid / Free" buttons. Replaces base44/shared/softwareFulfillment.ts.
// The old Base44 CRM push is replaced by GoHighLevel (pushToGHL).
import { admin, adminEmails, emailLayout, likeLiteral, pushToGHL, sendEmail, siteLink, SITE_URL, formatTime } from './server.mjs';

const DEFAULT_LOCKED = JSON.stringify(['comp_tier', 'ce_hours_completed', 'ce_hours_required', 'training_seat_key']);

function registrationKey(software) {
  if (software === 'OLT Pro') return 'registration_olt';
  if (software === '70/30 Membership') return 'registration_7030_specialist';
  return 'registration_taxslayer';
}

// 70/30 Membership buyers get a Preparer profile + a login invite to the Suite.
async function ensurePreparerProfile(lead) {
  if (lead.software !== '70/30 Membership') return { skipped: true };
  const { data: existing } = await admin.from('preparers').select('id').ilike('email', likeLiteral(lead.email)).maybeSingle();
  if (existing) return { skipped: true, reason: 'already_exists', id: existing.id };

  const { data: preparer, error } = await admin.from('preparers').insert({
    name: lead.full_name || lead.email,
    email: lead.email.toLowerCase(),
    phone: lead.phone || '',
    comp_tier: '70/30',
    active: true,
    locked_fields: DEFAULT_LOCKED,
  }).select('*').single();
  if (error) return { error: error.message };

  const invite = await admin.auth.admin.inviteUserByEmail(lead.email, {
    redirectTo: `${SITE_URL}/reset-password?token=invite`,
  });
  return { created: true, id: preparer.id, invited: !invite.error };
}

// amountDollars: number in dollars (Stripe cents are converted by the caller).
export async function fulfillPurchase(lead, { paymentMethod, amountDollars }) {
  if (lead.paid) return { skipped: true, reason: 'already_paid', leadId: lead.id };

  // 1. Mark paid. The ".eq('paid', false)" makes this safe against a double
  //    click or a Stripe retry arriving at the same moment.
  const update = {
    paid: true,
    payment_method: paymentMethod,
    status: 'Registration Sent',
    ...(amountDollars != null ? { amount_paid: amountDollars } : {}),
  };
  const { data: marked, error } = await admin.from('software_purchases')
    .update(update).eq('id', lead.id).eq('paid', false).select('*');
  if (error) return { error: `Failed to mark paid: ${error.message}` };
  if (!marked?.length) return { skipped: true, reason: 'already_paid', leadId: lead.id };

  // 2. CRM (GoHighLevel) + 3. Suite access for 70/30 members.
  const ghl = await pushToGHL('software_payment_received', {
    name: lead.full_name, email: lead.email, phone: lead.phone,
    software: lead.software, payment_method: paymentMethod, amount: amountDollars ?? lead.price ?? null,
  });  // EFIN and other sensitive details are never sent to the CRM
  const preparer = await ensurePreparerProfile(lead);

  // 4. Registration link (editable in Admin → Links Manager).
  const regLink = (await siteLink(registrationKey(lead.software))) || (await siteLink('crm_software_registration'));
  const software = lead.software || 'TaxSlayer Pro';
  const methodLabel = paymentMethod === 'Free' ? 'Gifted (free)' : paymentMethod;

  // 5. Admin notice.
  const adminMail = emailLayout({
    heading: `Payment received: ${software}`,
    intro: 'A software purchase was marked as paid. Registration has been sent to the customer.',
    rows: [
      ['Customer', lead.full_name], ['Email', lead.email], ['Phone', lead.phone],
      ['Software', software], ['Method', methodLabel],
      ['Amount', amountDollars != null ? `$${Number(amountDollars).toFixed(2)}` : ''],
      ['When', formatTime()],
    ],
    button: { label: 'Open Software Purchases', url: `${SITE_URL}/admin?tab=purchases` },
  });
  await sendEmail({ to: await adminEmails(), subject: `Payment received — ${software}`, ...adminMail });

  // 6. Customer welcome + registration link.
  let customer = { ok: false, reason: 'no registration link configured' };
  if (regLink) {
    const mail = emailLayout({
      heading: `Welcome to LuxeLogic, ${lead.full_name || 'there'}`,
      intro: `Your ${software} payment is confirmed and your onboarding has started. Complete your software registration using the button below. Our team has been notified and will begin your build right away.`,
      button: { label: 'Complete My Registration', url: regLink },
    });
    customer = await sendEmail({ to: lead.email, subject: `Next step: your ${software} registration`, ...mail });
  }

  return { fulfilled: true, leadId: lead.id, crmMember: { ok: ghl.status === 'ok', action: 'synced', ...ghl }, preparer, customerEmail: customer.ok };
}
