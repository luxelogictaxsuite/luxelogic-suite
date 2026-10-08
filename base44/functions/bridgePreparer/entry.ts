import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';

const DEFAULT_LOCKED = JSON.stringify(['comp_tier', 'ce_hours_completed', 'ce_hours_required', 'training_seat_key']);
const CRM_APP_ID = '6ab68a3df4840f6449286050';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { mode } = body;

    // SYNC MODE: admin saved a preparer profile edit (e.g. added seat key) — push full profile to CRM
    if (mode === 'sync') {
      const { preparer_id } = body;
      if (!preparer_id) return Response.json({ error: 'Missing preparer_id' }, { status: 400 });

      const preparer = await base44.asServiceRole.entities.Preparer.get(preparer_id);
      const crmResult = await pushToCRM(preparer, 'upsert');
      return Response.json({ synced: true, crm_push: crmResult.status, crm_error: crmResult.error });
    }

    // CREATE MODE: application approved — create local record + push to CRM
    const { full_name, email, ptin, phone } = body;
    if (!email || !full_name) {
      return Response.json({ error: 'Missing full_name or email' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.Preparer.filter({ email });
    if (existing.length > 0) {
      return Response.json({ bridged: false, reason: 'already_exists', preparer_id: existing[0].id });
    }

    const preparer = await base44.asServiceRole.entities.Preparer.create({
      name: full_name,
      email,
      ptin: ptin || '',
      phone: phone || '',
      active: true,
      locked_fields: DEFAULT_LOCKED,
    });

    const crmResult = await pushToCRM(preparer, 'create');
    return Response.json({ bridged: true, preparer_id: preparer.id, crm_push: crmResult.status, crm_error: crmResult.error });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Pushes the full preparer profile to the CRM Member entity.
// Maps overlapping fields directly; stores seat key + comp tier in the notes field
// since the CRM Member schema doesn't have dedicated columns for them.
async function pushToCRM(preparer, action) {
  const token = secrets.get('LUXELOGIC_CRM_TOKEN');
  if (!token) return { status: 'skipped', error: 'no token' };

  const profileNote = [
    preparer.training_seat_key ? `Seat Key: ${preparer.training_seat_key}` : '',
    preparer.comp_tier ? `Comp Tier: ${preparer.comp_tier}` : '',
    preparer.active === false ? 'Inactive' : '',
  ].filter(Boolean).join(' · ');

  const payload = {
    name: preparer.name,
    email: preparer.email,
    ptin: preparer.ptin || '',
    phone: preparer.phone || '',
    ce_hours_completed: preparer.ce_hours_completed ?? 0,
    ce_hours_required: preparer.ce_hours_required ?? 15,
    notes: profileNote || null,
  };

  if (action === 'create') {
    payload.status = 'Active';
    payload.member_type = 'Tax Preparer';
    payload.onboarding_stage = 'Application Approved';
  }

  const baseUrl = `https://app.base44.com/api/apps/${CRM_APP_ID}/entities/Member`;

  try {
    if (action === 'upsert') {
      // Find existing CRM member by email
      const filterRes = await fetch(`${baseUrl}?limit=500`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!filterRes.ok) {
        return { status: 'failed', error: `filter ${filterRes.status}: ${(await filterRes.text()).substring(0, 200)}` };
      }
      const members = await filterRes.json();
      const match = members.find(m => m.email?.toLowerCase() === preparer.email?.toLowerCase());

      if (!match) {
        // Doesn't exist yet — create with full profile
        const createRes = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, status: 'Active', member_type: 'Tax Preparer', onboarding_stage: 'Profile Synced' }),
        });
        if (!createRes.ok) return { status: 'failed', error: `create ${createRes.status}: ${(await createRes.text()).substring(0, 200)}` };
        return { status: 'ok' };
      }

      // Update existing member — merge our fields into the existing record so
      // we don't clobber onboarding stage, member_type, contract status, etc.
      const mergedPayload = { ...match, ...payload };
      delete mergedPayload.id;
      delete mergedPayload.created_date;
      delete mergedPayload.updated_date;
      delete mergedPayload.created_by_id;
      const crmRes = await fetch(`${baseUrl}/${match.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedPayload),
      });
      if (!crmRes.ok) return { status: 'failed', error: `update ${crmRes.status}: ${(await crmRes.text()).substring(0, 200)}` };
      return { status: 'ok' };
    }

    // Create
    const crmRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!crmRes.ok) {
      return { status: 'failed', error: `create ${crmRes.status}: ${(await crmRes.text()).substring(0, 200)}` };
    }
    return { status: 'ok' };
  } catch (e) {
    return { status: 'failed', error: e.message };
  }
}