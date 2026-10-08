import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Sends a SANITIZED notification email to admins when a form is submitted.
// Only safe, non-sensitive fields are included — never SSN, DOB, address,
// photo ID, PTIN, W-9, EFIN, signature, file URLs, or document contents.
// The email contains a "Review Secure Submission" button linking to the Admin Suite.

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const ADMIN_URL = 'https://luxelogictaxsuite.com/admin';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Only accept safe fields from the caller — never trust arbitrary field data.
    const formName = esc(String(body?.formName || 'Form').slice(0, 120));
    const submissionId = esc(String(body?.submissionId || '').slice(0, 60));
    const firstName = esc(String(body?.firstName || '').slice(0, 80));
    const lastName = esc(String(body?.lastName || '').slice(0, 80));
    const preferredName = esc(String(body?.preferredName || '').slice(0, 80));
    const email = esc(String(body?.email || '').slice(0, 160));
    const phone = esc(String(body?.phone || '').slice(0, 40));
    const software = esc(String(body?.software || '').slice(0, 60));
    const submittedAt = esc(String(body?.submittedAt || new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })).slice(0, 80));

    const nameDisplay = [firstName, lastName].filter(Boolean).join(' ') || '—';

    const subject = `New ${formName} submission`;
    const text =
      `LuxeLogic software registration has been submitted. Log in to the LuxeLogic Admin Suite to review the complete registration and private documents.\n\n` +
      `Form: ${formName}\n` +
      `Submission ID: ${submissionId}\n` +
      `Name: ${nameDisplay}\n` +
      (preferredName ? `Preferred name: ${preferredName}\n` : '') +
      `Email: ${email || '—'}\n` +
      `Phone: ${phone || '—'}\n` +
      (software ? `Software: ${software}\n` : '') +
      `Submitted: ${submittedAt}\n\n` +
      `Review Secure Submission: ${ADMIN_URL}`;

    const preferredRow = preferredName ? `<tr><td style="padding:4px 12px;color:#666;">Preferred name:</td><td style="padding:4px 0;">${preferredName}</td></tr>` : '';
    const softwareRow = software ? `<tr><td style="padding:4px 12px;color:#666;">Software:</td><td style="padding:4px 0;">${software}</td></tr>` : '';

    const html = `<html><body style="font-family:Georgia,serif;color:#1a1a1a;max-width:560px;">
<p style="margin:0 0 20px;">LuxeLogic software registration has been submitted. Log in to the LuxeLogic Admin Suite to review the complete registration and private documents.</p>
<table style="border-collapse:collapse;font-size:15px;margin-bottom:24px;">
<tr><td style="padding:4px 12px 4px 0;color:#666;">Form:</td><td style="padding:4px 0;">${formName}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Submission ID:</td><td style="padding:4px 0;font-mono:monospace;">${submissionId}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Name:</td><td style="padding:4px 0;">${nameDisplay}</td></tr>
${preferredRow}
<tr><td style="padding:4px 12px;color:#666;">Email:</td><td style="padding:4px 0;">${email || '—'}</td></tr>
<tr><td style="padding:4px 12px;color:#666;">Phone:</td><td style="padding:4px 0;">${phone || '—'}</td></tr>
${softwareRow}
<tr><td style="padding:4px 12px;color:#666;">Submitted:</td><td style="padding:4px 0;">${submittedAt}</td></tr>
</table>
<a href="${ADMIN_URL}" style="display:inline-block;background:#9C7945;color:#ffffff;padding:12px 28px;text-decoration:none;font-weight:bold;font-size:15px;">Review Secure Submission</a>
<p style="margin:20px 0 0;font-size:12px;color:#999;">This link requires administrator authentication. Sensitive documents are stored securely and cannot be accessed from this email.</p>
</body></html>`;

    // Notify all registered admin users.
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const sent = [];
    for (const a of admins) {
      if (!a.email) continue;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: a.email, subject, text, html });
        sent.push(a.email);
      } catch (e) { /* individual send failure should not abort others */ }
    }

    // Best-effort: also try the office business_email if set.
    let officeTried = false;
    try {
      const settings = await base44.asServiceRole.entities.SiteSetting.filter({ key: 'business_email' });
      const office = settings[0]?.value;
      if (office && !admins.some(a => a.email === office)) {
        officeTried = true;
        await base44.asServiceRole.integrations.Core.SendEmail({ to: office, subject, text, html });
        sent.push(office);
      }
    } catch (e) { /* office email needs a verified custom domain — captured, not delivered */ }

    return Response.json({ ok: true, notified: sent, officeTried });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}