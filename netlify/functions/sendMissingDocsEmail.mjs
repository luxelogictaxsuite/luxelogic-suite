// ADMIN. Emails a submitter about missing documents (no-reply).
// Only the admin's message is sent — never any answers from the submission.
import { admin, clip, emailLayout, handler, HttpError, json, parseSubmission, readJson, requireAdmin, sendEmail } from '../lib/server.mjs';

export default handler(async (req) => {
  await requireAdmin(req);
  const body = await readJson(req);
  const id = clip(body.submissionId, 60);
  const message = clip(body.message, 2000).trim();
  if (!id || !message) throw new HttpError(400, 'submissionId and message are required');

  const { data: sub } = await admin.from('form_submissions').select('*').eq('id', id).maybeSingle();
  if (!sub) throw new HttpError(404, 'Submission not found');
  const c = parseSubmission(sub);
  if (!c.email) throw new HttpError(400, 'No email address found in this submission');

  const mail = emailLayout({
    heading: 'Action needed: missing documents',
    intro: `Hi ${c.firstName || c.fullName || 'there'},\n\n${message}\n\nIf you have any questions, please contact our office.`,
    footer: 'This is an automated message from LuxeLogic Tax Suite. Please do not reply to this email.',
  });
  const r = await sendEmail({ to: c.email, subject: 'Action needed: missing documents for your LuxeLogic file', ...mail });
  if (!r.ok) throw new HttpError(502, r.reason === 'email not configured' ? 'Email is not set up yet' : 'Email failed to send');
  return json({ ok: true, email: c.email });
});
