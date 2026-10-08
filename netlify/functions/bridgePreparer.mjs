// ADMIN ONLY.
//   create: { full_name, email, ptin, phone } → after you APPROVE an
//           application: creates the Preparer, invites them to log in, and
//           adds them to GoHighLevel.
//   sync:   { mode: 'sync', preparer_id } → after you edit a preparer:
//           pushes the updated profile to GoHighLevel.
//
// Security fix: on Base44 the public Join Team page called this when someone
// APPLIED, which could create an active preparer before approval. Now only
// an admin can create preparers.
import { admin, clip, handler, HttpError, json, likeLiteral, pushToGHL, readJson, requireAdmin, SITE_URL } from '../lib/server.mjs';

const DEFAULT_LOCKED = JSON.stringify(['comp_tier', 'ce_hours_completed', 'ce_hours_required', 'training_seat_key']);

const ghlProfile = (p) => ({
  name: p.name, email: p.email, phone: p.phone || '', ptin: p.ptin || '',
  comp_tier: p.comp_tier, seat_key: p.training_seat_key || '',
  status: p.active === false ? 'Inactive' : 'Active', member_type: 'Tax Preparer',
});

export default handler(async (req) => {
  await requireAdmin(req);
  const body = await readJson(req);

  if (body.mode === 'sync') {
    const { data: p } = await admin.from('preparers').select('*').eq('id', clip(body.preparer_id, 60)).maybeSingle();
    if (!p) throw new HttpError(404, 'Preparer not found');
    const ghl = await pushToGHL('preparer_updated', ghlProfile(p));
    return json({ synced: true, crm_push: ghl.status, crm_error: ghl.reason });
  }

  const email = clip(body.email, 160).trim().toLowerCase();
  const name = clip(body.full_name, 160).trim();
  if (!email || !name) throw new HttpError(400, 'Missing full_name or email');

  const { data: existing } = await admin.from('preparers').select('id').ilike('email', likeLiteral(email)).maybeSingle();
  if (existing) return json({ bridged: false, reason: 'already_exists', preparer_id: existing.id });

  const { data: p, error } = await admin.from('preparers').insert({
    name, email, ptin: clip(body.ptin, 20), phone: clip(body.phone, 40),
    active: true, locked_fields: DEFAULT_LOCKED,
  }).select('*').single();
  if (error) throw error;

  const invite = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${SITE_URL}/reset-password?token=invite` });
  const ghl = await pushToGHL('preparer_approved', ghlProfile(p));
  return json({ bridged: true, preparer_id: p.id, invited: !invite.error, crm_push: ghl.status, crm_error: ghl.reason });
});
