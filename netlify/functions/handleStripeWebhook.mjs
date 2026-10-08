// STRIPE. Receives payment events from your Stripe Payment Links.
// Register in Stripe → Developers → Webhooks:
//   https://luxelogictaxsuite.com/.netlify/functions/handleStripeWebhook
//   events: checkout.session.completed
// and put the signing secret in Netlify as STRIPE_WEBHOOK_SECRET.
//
// Improvements over Base44: rejects events older than 5 minutes (replays),
// compares signatures in constant time, records the amount in DOLLARS
// (Base44 stored cents, so $149 showed as "$14900"), and is safe if Stripe
// delivers the same event twice.
import crypto from 'node:crypto';
import { admin, json, likeLiteral } from '../lib/server.mjs';
import { fulfillPurchase } from '../lib/fulfillment.mjs';

const TOLERANCE_SECONDS = 300;

function verify(rawBody, header, secret) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => {
    const i = p.indexOf('=');
    return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
  }));
  const t = Number(parts.t);
  const signatures = header.split(',').filter((p) => p.trim().startsWith('v1=')).map((p) => p.trim().slice(3));
  if (!t || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const exp = Buffer.from(expected, 'hex');
  return signatures.some((s) => {
    const got = Buffer.from(s, 'hex');
    return got.length === exp.length && crypto.timingSafeEqual(got, exp);
  });
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.SUPABASE_SECRET_KEY) return json({ error: 'Webhook not configured' }, 500);

  const raw = await req.text();
  if (!verify(raw, req.headers.get('stripe-signature'), secret)) return json({ error: 'invalid signature' }, 400);

  let event;
  try { event = JSON.parse(raw); } catch { return json({ error: 'bad payload' }, 400); }
  if (event.type !== 'checkout.session.completed' && event.type !== 'payment_intent.succeeded') {
    return json({ received: true, ignored: event.type });
  }

  try {
    // Process each Stripe event only once, even if Stripe retries it.
    const { error: dupe } = await admin.from('function_events').insert({ key: `stripe:${event.id}` });
    if (dupe?.code === '23505') return json({ received: true, duplicate: true });

    const obj = event.data?.object || {};
    const email = obj.customer_details?.email || obj.customer_email || obj.receipt_email || '';
    const name = obj.customer_details?.name || '';
    const phone = obj.customer_details?.phone || '';
    const cents = obj.amount_total ?? obj.amount_received ?? obj.amount ?? 0;
    const amountDollars = Math.round(cents) / 100;
    let software = obj.metadata?.software || '';
    if (!software && cents === 14900) software = '70/30 Membership';
    if (!email) return json({ received: true, ignored: 'no customer email' });

    // Match the most recent unpaid lead for this email, else create one.
    let { data: lead } = await admin.from('software_purchases').select('*')
      .ilike('email', likeLiteral(email)).eq('paid', false)
      .order('created_date', { ascending: false }).limit(1).maybeSingle();

    if (!lead) {
      const { data: created, error } = await admin.from('software_purchases').insert({
        full_name: name || email, email: email.toLowerCase(), phone,
        software: software || 'TaxSlayer Pro', status: 'New', price: amountDollars,
      }).select('*').single();
      if (error) throw error;
      lead = created;
    } else if (software && lead.software !== software) {
      await admin.from('software_purchases').update({ software }).eq('id', lead.id);
      lead.software = software;
    }

    const fulfillment = await fulfillPurchase(lead, { paymentMethod: 'Stripe', amountDollars });
    return json({ ok: true, received: true, leadId: lead.id, fulfillment });
  } catch (e) {
    console.error('Stripe webhook error', e);
    // Let Stripe retry later: remove the "processed" marker.
    await admin.from('function_events').delete().eq('key', `stripe:${event.id}`);
    return json({ error: 'processing failed' }, 500);
  }
};
