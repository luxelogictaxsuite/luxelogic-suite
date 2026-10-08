import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';
import { fulfillPurchase } from '../../shared/softwareFulfillment.ts';

// Receives Stripe webhook events for software purchases made via external
// Stripe Payment Links. On a successful payment it:
//   1. matches the payment to a SoftwarePurchase lead (by email),
//   2. marks the lead as paid + fulfills (CRM Member profile + registration email),
//   3. notifies admin + customer.
// Webhook URL to register in Stripe Dashboard → Developers → Webhooks:
//   https://luxelogic-tax-suite-software-taxes.base44.app/functions/handleStripeWebhook

// Verify the Stripe signature with Web Crypto (no Stripe SDK / no secret key needed).
async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = {};
  for (const piece of signatureHeader.split(',')) {
    const idx = piece.indexOf('=');
    if (idx > -1) parts[piece.slice(0, idx).trim()] = piece.slice(idx + 1).trim();
  }
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${rawBody}`));
  const expected = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === v1;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('stripe-signature') || '';
    const webhookSecret = secrets.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) return Response.json({ error: 'webhook secret not configured' }, { status: 500 });

    const valid = await verifyStripeSignature(rawBody, signatureHeader, webhookSecret);
    if (!valid) return Response.json({ error: 'invalid signature' }, { status: 400 });

    const event = JSON.parse(rawBody);
    const eventType = event?.type || '';

    // Only act on successful payments.
    if (eventType !== 'checkout.session.completed' && eventType !== 'payment_intent.succeeded') {
      return Response.json({ received: true, ignored: eventType });
    }

    const obj = event.data?.object || {};
    const email = obj.customer_email || obj.customer_details?.email || obj.charges?.data?.[0]?.billing_details?.email || '';
    const name = obj.customer_details?.name || obj.charges?.data?.[0]?.billing_details?.name || '';
    const metadata = obj.metadata || {};
    let software = metadata.software || '';
    const amount = obj.amount_total ?? obj.amount ?? 0;

    // Detect $149 preparer membership payment by amount (no metadata needed).
    if (!software && amount === 14900) {
      software = '70/30 Membership';
    }

    if (!email) return Response.json({ received: true, ignored: 'no customer email' });

    // Match an existing lead by email (case-insensitive).
    let leads = [];
    try { leads = await base44.asServiceRole.entities.SoftwarePurchase.filter({ email }); } catch (e) { /* proceed to create */ }
    let lead = leads.find(l => String(l.email || '').toLowerCase() === String(email).toLowerCase());
    if (!lead) lead = leads[0];

    if (!lead) {
      // No prior lead — create one from the payment data.
      lead = await base44.asServiceRole.entities.SoftwarePurchase.create({
        full_name: name || email,
        email,
        software: software || 'TaxSlayer Pro',
        status: 'New',
      });
    }

    // If metadata has a software override, apply it to the lead.
    if (software && lead.software !== software) {
      try {
        await base44.asServiceRole.entities.SoftwarePurchase.update(lead.id, { software });
        lead.software = software;
      } catch (e) { /* best-effort */ }
    }

    // Fulfill the purchase — mark paid, push CRM Member, send registration email.
    const crmToken = secrets.get('LUXELOGIC_CRM_TOKEN');
    const result = await fulfillPurchase(base44, {
      lead,
      paymentMethod: 'Stripe',
      amount,
      crmToken,
    });

    return Response.json({
      ok: true,
      received: true,
      type: eventType,
      email,
      leadId: lead.id,
      fulfillment: result,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}