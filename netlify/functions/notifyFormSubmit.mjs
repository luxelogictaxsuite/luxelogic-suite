// Emails admins when a form is submitted.
//   PUBLIC  { submissionId }       → after any public form submission
//   LOGGED IN { formName: 'Account Deletion Request' } → from Suite settings
//
// Fixes from the Base44 version: the subject and text use the REAL form name
// (no more "software registration" on every email), the client's name, email
// and phone are filled in from the submission, the LuxeLogic logo is shown,
// times are Eastern, and the button opens that exact submission after login.
// Sensitive answers (SSN, DOB, IDs, documents) are never put in the email.
import { adminEmails, admin, clip, emailLayout, formatTime, getCaller, handler, HttpError, isFresh, json, once, parseSubmission, readJson, sendEmail, SITE_URL } from '../lib/server.mjs';

export default handler(async (req) => {
  const body = await readJson(req);

  // Account deletion request from a logged-in user.
  if (!body.submissionId) {
    const caller = await getCaller(req);
    if (!caller) throw new HttpError(401, 'Please log in');
    if (!(await once(`deletion:${caller.id}:${new Date().toISOString().slice(0, 10)}`))) return json({ ok: true, duplicate: true });
    const mail = emailLayout({
      heading: 'Account deletion request',
      intro: 'A user asked for their LuxeLogic account to be deleted.',
      rows: [['Email', caller.email], ['Role', caller.role], ['User ID', caller.id], ['Requested', formatTime()]],
      button: { label: 'Open Admin Suite', url: `${SITE_URL}/admin` },
    });
    const r = await sendEmail({ to: await adminEmails(), subject: 'Account deletion request', ...mail });
    return json({ ok: true, notified: r.sent || [] });
  }

  const id = clip(body.submissionId, 60);
  const { data: sub } = await admin.from('form_submissions').select('*').eq('id', id).maybeSingle();
  if (!sub) throw new HttpError(404, 'Submission not found');
  if (!isFresh(sub.created_date)) throw new HttpError(409, 'Submission is too old to notify');
  if (!(await once(`notify:${id}`))) return json({ ok: true, duplicate: true });

  const c = parseSubmission(sub);
  const formName = sub.form_name || 'Form';
  const mail = emailLayout({
    heading: `New ${formName} submission`,
    intro: `${c.fullName || 'A client'} just submitted the ${formName}. Log in to the Admin Suite to review the complete submission and any private documents.`,
    rows: [
      ['Client', c.fullName], ['Preferred name', c.preferredName], ['Email', c.email], ['Phone', c.phone],
      ['Software', c.software], ['Preparer chosen', c.preparer], ['Form', formName],
      ['Submitted', formatTime(sub.created_date)], ['Reference', sub.id],
    ],
    button: { label: 'Review Secure Submission', url: `${SITE_URL}/admin?submission=${sub.id}` },
    footer: 'This link requires administrator login. Sensitive information is never included in email.',
  });
  const r = await sendEmail({ to: await adminEmails(), subject: `New ${formName} — ${c.fullName || 'new submission'}`, ...mail });
  return json({ ok: true, notified: r.sent || [] });
});
