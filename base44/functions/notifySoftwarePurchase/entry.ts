import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Triggered when a visitor submits the software onboarding form on the public site.
// Sends a SANITIZED notification — only name, email, phone, and software selection.
// EFIN, PTIN, and other details are never included in the email; admins review them
// in the Admin Suite. Also best-effort emails the customer their CRM registration link.
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const ADMIN_URL = 'https://luxelogictaxsuite.com/admin';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const name = esc(String(body?.full_name || 'there').slice(0, 120));
    const email = String(body?.email || '').slice(0, 160);
    const phone = esc(String(body?.phone || '').slice(0, 40));
    const software = esc(String(body?.software || 'software').slice(0, 60));

    // Resolve the CRM software-registration form link (admin-editable in Links Manager).
    let registrationLink = '';
    try {
      const regKey = body?.software === 'OLT Pro' ? 'registration_olt' : 'registration_taxslayer';
      const links = await base44.asServiceRole.entities.SiteLink.filter({ key: regKey });
      registrationLink = String(links?.[0]?.url || '');
    } catch (e) { /* link not configured yet */ }
    if (!registrationLink) {
      try {
        const links = await base44.asServiceRole.entities.SiteLink.filter({ key: 'crm_software_registration' });
        registrationLink = String(links?.[0]?.url || '');
      } catch (e) { /* fallback not configured either */ }
    }

    // Sanitized admin notification — no EFIN, PTIN, or sensitive details.
    const subject = `New software purchase — ${software}`;
    const text =
      `LuxeLogic software registration has been submitted. Log in to the LuxeLogic Admin Suite to review the complete registration and private documents.\n\n` +
      `Name: ${name}\nEmail: ${email || '—'}\nPhone: ${phone || '—'}\n` +
      `Software: ${software}\n\n` +
      `Review Secure Submission: ${ADMIN_URL}`;

    const html = `<html><body style="font-family:Georgia,serif;color:#1a1a1a;max-width:560px;">
<p>LuxeLogic software registration has been submitted. Log in to the LuxeLogic Admin Suite to review the complete registration and private documents.</p>
<table style="border-collapse:collapse;font-size:15px;margin-bottom:24px;">
<tr><td style="padding:4px 12px;color:#666;">Name:</td><td style="padding:4px 0;">${name}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Email:</td><td style="padding:4px 0;">${email || '—'}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Phone:</td><td style="padding:4px 0;">${phone || '—'}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Software:</td><td style="padding:4px 0;">${software}</td></tr>
</table>
<a href="${ADMIN_URL}" style="display:inline-block;background:#9C7945;color:#ffffff;padding:12px 28px;text-decoration:none;font-weight:bold;font-size:15px;">Review Secure Submission</a>
</body></html>`;

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const sent = [];
    for (const a of admins) {
      if (!a.email) continue;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: a.email, subject, text, html });
        sent.push(a.email);
      } catch (e) { /* individual send failure should not abort others */ }
    }

    // Best-effort: also notify the office business_email if set.
    let officeTried = false;
    try {
      const settings = await base44.asServiceRole.entities.SiteSetting.filter({ key: 'business_email' });
      const officeEmail = settings?.[0]?.value;
      if (officeEmail && !admins.some(a => a.email === officeEmail)) {
        officeTried = true;
        await base44.asServiceRole.integrations.Core.SendEmail({ to: officeEmail, subject, text, html });
        sent.push(officeEmail);
      }
    } catch (e) { /* office email needs a verified custom domain — captured, not delivered */ }

    // Best-effort: email the customer their registration link.
    let customerTried = false;
    if (email && registrationLink) {
      try {
        customerTried = true;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `Welcome to LuxeLogic — next step: your ${software} registration`,
          text: `Hi ${name},\n\nThanks for choosing ${software} with LuxeLogic! Your onboarding has started.\n\nComplete your software registration here:\n${registrationLink}\n\nOur team has been notified and will begin your build process right away.\n\n— The LuxeLogic Team`
        });
      } catch (e) { /* customer email needs a verified custom domain — captured, not delivered */ }
    }

    return Response.json({ ok: true, registrationLink, notified: sent, officeTried, customerTried });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}