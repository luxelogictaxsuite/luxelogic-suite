// Shared server-side helpers for LuxeLogic Netlify Functions.
// Runs ONLY on Netlify's servers — the secret key never reaches a browser.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

// Full-access client. Bypasses Row Level Security, so every function must
// check who is calling (requireAdmin / requireUser) before using it.
export const admin = createClient(SUPABASE_URL, SECRET_KEY || 'missing-secret-key', {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const SITE_URL = (process.env.SITE_URL || process.env.URL || 'https://luxelogictaxsuite.com').replace(/\/$/, '');
export const LOGO_URL = process.env.EMAIL_LOGO_URL || `${SITE_URL}/images/luxelogic-logo.png`;
const TIME_ZONE = 'America/New_York';

// ---------- responses ----------
export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Wraps a handler: method check, config check, consistent error JSON.
export function handler(fn) {
  return async (req, context) => {
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (!SECRET_KEY) return json({ error: 'Server is missing SUPABASE_SECRET_KEY' }, 500);
    try {
      return await fn(req, context);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: 'Something went wrong' }, 500);
    }
  };
}

export async function readJson(req) {
  try { return await req.json(); } catch { return {}; }
}

// ---------- who is calling ----------
// Returns { id, email, role } for the logged-in caller, or null.
export async function getCaller(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: profile } = await admin.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return { id: data.user.id, email: (data.user.email || '').toLowerCase(), role: profile?.role || 'user' };
}

export async function requireUser(req) {
  const caller = await getCaller(req);
  if (!caller) throw new HttpError(401, 'Please log in');
  return caller;
}

export async function requireAdmin(req) {
  const caller = await requireUser(req);
  if (caller.role !== 'admin') throw new HttpError(403, 'Admins only');
  return caller;
}

// Is this caller an ACTIVE preparer? (Deactivated preparers are refused.)
export async function activePreparer(email) {
  const { data } = await admin.from('preparers').select('*').ilike('email', likeLiteral(email)).eq('active', true).maybeSingle();
  return data || null;
}

// ---------- small utils ----------
export const likeLiteral = (v) => String(v || '').replace(/[\\%_]/g, (c) => `\\${c}`);
export const clip = (v, n) => String(v ?? '').slice(0, n);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const sameEmail = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

export const formatTime = (date = new Date()) =>
  new Date(date).toLocaleString('en-US', {
    timeZone: TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });

// Public endpoints only act on records created moments ago, so they can't be
// replayed later to spam clients or preparers.
export const isFresh = (createdDate, minutes = 30) =>
  createdDate && Date.now() - new Date(createdDate).getTime() < minutes * 60 * 1000;

// Pulls name / email / phone out of a form submission's answers.
const CONTACT_LABELS = {
  firstName: ['Full Legal First Name', 'First Name', 'First name', 'Legal First Name'],
  lastName: ['Full Legal Last Name', 'Last Name', 'Last name', 'Legal Last Name'],
  preferredName: ['Preferred Name', 'Preferred name'],
  email: ['Email', 'Email Address', 'Email address'],
  phone: ['Phone', 'Phone Number', 'Phone number', 'Mobile', 'Mobile Number'],
  software: ['Software', 'Which software did you purchase?', 'Software Preference', 'Software preference'],
  preparer: ['Choose Your Preparer'],
};

export function parseSubmission(submission) {
  let data = {};
  try { data = JSON.parse(submission?.submission_data || '{}'); } catch { /* keep {} */ }
  const pick = (labels) => {
    for (const l of labels) if (data[l] && typeof data[l] === 'string') return data[l].trim();
    return '';
  };
  const out = Object.fromEntries(Object.entries(CONTACT_LABELS).map(([k, labels]) => [k, pick(labels)]));
  // Fallback: any field whose label mentions name/email/phone.
  const find = (re) => {
    const key = Object.keys(data).find((k) => re.test(k) && typeof data[k] === 'string' && data[k].trim());
    return key ? data[key].trim() : '';
  };
  if (!out.email) out.email = find(/e-?mail/i);
  if (!out.phone) out.phone = find(/phone|mobile|cell/i);
  out.fullName = [out.firstName, out.lastName].filter(Boolean).join(' ') || find(/full name|^name$/i);
  out.data = data;
  return out;
}

export async function adminEmails() {
  const { data } = await admin.from('profiles').select('email').eq('role', 'admin');
  const emails = new Set((data || []).map((r) => r.email).filter(Boolean));
  const { data: office } = await admin.from('site_settings').select('value').eq('key', 'business_email').maybeSingle();
  if (office?.value) emails.add(office.value.trim());
  return [...emails];
}

export async function siteLink(key) {
  const { data } = await admin.from('site_links').select('url').eq('key', key).maybeSingle();
  return data?.url || '';
}

// ---------- email ----------
// Sends through Resend (https://resend.com). Set RESEND_API_KEY and
// EMAIL_FROM (e.g. "LuxeLogic Tax Suite <noreply@luxelogictaxsuite.com>").
// Without a key, emails are logged instead of sent, so nothing crashes.
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return { ok: false, reason: 'no recipient' };
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'LuxeLogic Tax Suite <noreply@luxelogictaxsuite.com>';
  if (!key) {
    console.warn(`[email not sent: RESEND_API_KEY missing] to=${recipients.join(',')} subject=${subject}`);
    return { ok: false, reason: 'email not configured' };
  }
  const results = [];
  // One email per recipient so clients never see each other's addresses.
  for (const r of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [r], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    results.push({ to: r, ok: res.ok, status: res.status });
    if (!res.ok) console.error('Email failed', r, res.status, await res.text().catch(() => ''));
  }
  return { ok: results.every((x) => x.ok), sent: results.filter((x) => x.ok).map((x) => x.to), results };
}

// Branded email shell: logo, gold accent, optional details table + button.
export function emailLayout({ heading, intro, rows = [], button, footer }) {
  const rowHtml = rows
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([k, v]) => `<tr><td style="padding:6px 16px 6px 0;color:#7a7a7a;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;color:#1a1a1a;">${esc(v)}</td></tr>`)
    .join('');
  const html = `<!doctype html><html><body style="margin:0;background:#f7f4ef;">
<div style="max-width:580px;margin:0 auto;padding:32px 20px;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <div style="text-align:center;margin-bottom:24px;"><img src="${esc(LOGO_URL)}" alt="LuxeLogic Tax Suite" width="180" style="max-width:180px;height:auto;"></div>
  <div style="background:#ffffff;border-top:3px solid #9C7945;padding:32px 28px;">
    ${heading ? `<h1 style="font-size:22px;font-weight:normal;margin:0 0 16px;color:#1a1a1a;">${esc(heading)}</h1>` : ''}
    ${intro ? `<p style="font-size:15px;line-height:1.65;margin:0 0 20px;">${esc(intro).replace(/\n/g, '<br>')}</p>` : ''}
    ${rowHtml ? `<table style="border-collapse:collapse;font-size:15px;margin:0 0 24px;">${rowHtml}</table>` : ''}
    ${button ? `<a href="${esc(button.url)}" style="display:inline-block;background:#9C7945;color:#ffffff;padding:13px 28px;text-decoration:none;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;letter-spacing:.5px;">${esc(button.label)}</a>` : ''}
  </div>
  <p style="font-size:12px;color:#9a9a9a;text-align:center;margin:20px 0 0;line-height:1.6;">${esc(footer || 'LuxeLogic Tax Suite · 470 W Broad Street, Columbus, Ohio')}</p>
</div></body></html>`;
  const text = [heading, intro, ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), button ? `${button.label}: ${button.url}` : '']
    .filter(Boolean).join('\n\n');
  return { html, text };
}

// ---------- GoHighLevel ----------
// Posts a contact event to a GHL "Inbound Webhook" workflow trigger.
// Set GHL_WEBHOOK_URL in Netlify. Best-effort: never blocks the main action.
export async function pushToGHL(event, contact) {
  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) return { status: 'skipped', reason: 'GHL_WEBHOOK_URL not set' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, source: 'luxelogictaxsuite.com', ...contact }),
    });
    return res.ok ? { status: 'ok' } : { status: 'failed', reason: `GHL ${res.status}` };
  } catch (e) {
    return { status: 'failed', reason: e.message };
  }
}

// Returns true the FIRST time a key is seen, false after that. Used so each
// notification is sent once, no matter how many times an endpoint is hit.
export async function once(key) {
  const { error } = await admin.from('function_events').insert({ key: clip(key, 300) });
  if (!error) return true;
  if (error.code === '23505') return false; // already recorded
  throw error;
}
