import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';
import { fulfillPurchase } from '../../shared/softwareFulfillment.ts';

// Admin-only: manually mark a SoftwarePurchase lead as paid.
// Used when payment was received outside Stripe (check, cash, Zelle) or when
// the software is gifted for free. Triggers the same fulfillment as a Stripe
// payment: marks paid, creates CRM Member profile, sends registration email.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admins only' }, { status: 403 });

    const body = await req.json();
    const { purchase_id, payment_method } = body;
    if (!purchase_id) return Response.json({ error: 'Missing purchase_id' }, { status: 400 });

    const method = payment_method === 'Free' ? 'Free' : 'Manual';

    const lead = await base44.asServiceRole.entities.SoftwarePurchase.get(purchase_id);
    if (!lead) return Response.json({ error: 'Purchase not found' }, { status: 404 });

    if (lead.paid) {
      return Response.json({ skipped: true, reason: 'already_paid', leadId: lead.id, payment_method: lead.payment_method });
    }

    const crmToken = secrets.get('LUXELOGIC_CRM_TOKEN');
    const result = await fulfillPurchase(base44, {
      lead,
      paymentMethod: method,
      crmToken,
    });

    return Response.json({ ok: true, leadId: lead.id, payment_method: method, fulfillment: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}