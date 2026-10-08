// PUBLIC. Called right after a client submits the intake form.
// Routes the intake to the preparer the client picked: creates the private
// ClientAssignment and emails that preparer.
//
// Hardened vs. Base44: the browser only sends the submission id. Client and
// preparer details are read from the saved submission itself, the submission
// must be brand new, and it can only ever be routed once.
import { admin, clip, emailLayout, formatTime, handler, HttpError, isFresh, json, once, parseSubmission, readJson, sendEmail, SITE_URL } from '../lib/server.mjs';

export default handler(async (req) => {
  const { submissionId } = await readJson(req);
  const id = clip(submissionId, 60);
  if (!id) throw new HttpError(400, 'submissionId is required');

  const { data: sub } = await admin.from('form_submissions').select('*').eq('id', id).maybeSingle();
  if (!sub) throw new HttpError(404, 'Submission not found');
  if (!isFresh(sub.created_date)) throw new HttpError(409, 'Submission is too old to route');

  const c = parseSubmission(sub);
  if (!c.preparer || /^no preference/i.test(c.preparer)) return json({ ok: true, routed: false, reason: 'no preference selected' });

  const { data: preparer } = await admin.from('preparers').select('*').eq('name', c.preparer).eq('active', true).maybeSingle();
  if (!preparer) return json({ ok: true, routed: false, reason: 'no active preparer matched' });

  if (!(await once(`route:${id}`))) return json({ ok: true, routed: true, duplicate: true });

  const { data: assignment, error } = await admin.from('client_assignments').insert({
    client_name: clip(c.fullName || 'New client', 160),
    client_email: clip(c.email, 160),
    client_phone: clip(c.phone, 40),
    preparer_name: preparer.name,
    preparer_email: preparer.email.toLowerCase(),
    form_submission_id: id,
    status: 'Awaiting Documents',
  }).select('id').single();
  if (error) throw error;

  const mail = emailLayout({
    heading: `New client assigned: ${c.fullName || 'New client'}`,
    intro: 'A client completed their intake and selected you as their preparer. Their full intake is waiting in your Preparer Suite.',
    rows: [['Client', c.fullName], ['Email', c.email], ['Phone', c.phone], ['Form', sub.form_name], ['Submitted', formatTime(sub.created_date)]],
    button: { label: 'Open in Return Queue', url: `${SITE_URL}/suite/queue?client=${assignment.id}` },
  });
  await sendEmail({ to: preparer.email, subject: `New client assigned: ${c.fullName || 'New client'}`, ...mail });

  return json({ ok: true, routed: true, preparer: preparer.email });
});
