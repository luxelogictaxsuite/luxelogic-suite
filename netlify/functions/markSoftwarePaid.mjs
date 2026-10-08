// ADMIN. Mark a software purchase paid (Manual) or gifted (Free) and run
// the same fulfillment a Stripe payment would.
import { admin, clip, handler, HttpError, json, readJson, requireAdmin } from '../lib/server.mjs';
import { fulfillPurchase } from '../lib/fulfillment.mjs';

export default handler(async (req) => {
  await requireAdmin(req);
  const { purchase_id, payment_method } = await readJson(req);
  const method = payment_method === 'Free' ? 'Free' : 'Manual';
  const { data: lead } = await admin.from('software_purchases').select('*').eq('id', clip(purchase_id, 60)).maybeSingle();
  if (!lead) throw new HttpError(404, 'Purchase not found');
  if (lead.paid) return json({ skipped: true, reason: 'already_paid', leadId: lead.id, payment_method: lead.payment_method });

  // Manual payments record the list price (if set) as the amount paid; free = $0.
  const amountDollars = method === 'Free' ? 0 : (lead.price ?? null);
  const fulfillment = await fulfillPurchase(lead, { paymentMethod: method, amountDollars });
  return json({ ok: true, leadId: lead.id, payment_method: method, fulfillment });
});
