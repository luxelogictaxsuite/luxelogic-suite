// LOGGED IN. Returns a 5-minute download link for a private upload.
// Admins can open any file. A preparer can only open files that belong to
// the intake of a client currently assigned to them (and only while active).
import { activePreparer, admin, clip, handler, HttpError, json, likeLiteral, readJson, requireUser } from '../lib/server.mjs';

const BUCKET = 'private-uploads';

export default handler(async (req) => {
  const caller = await requireUser(req);
  const { file_uri } = await readJson(req);
  const uri = clip(file_uri, 500);
  const path = uri.replace(/^private-uploads\//, '');
  if (!path.startsWith('intake/') || path.includes('..')) throw new HttpError(400, 'Invalid file');

  if (caller.role !== 'admin') {
    if (!(await activePreparer(caller.email))) throw new HttpError(403, 'Not allowed');
    const { data: assignments } = await admin.from('client_assignments')
      .select('form_submission_id').ilike('preparer_email', likeLiteral(caller.email)).not('form_submission_id', 'is', null);
    const ids = (assignments || []).map((a) => a.form_submission_id);
    if (!ids.length) throw new HttpError(403, 'Not allowed');
    const { data: subs } = await admin.from('form_submissions').select('submission_data').in('id', ids);
    const owns = (subs || []).some((s) => (s.submission_data || '').includes(`"${uri}"`));
    if (!owns) throw new HttpError(403, 'Not allowed');
  }

  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error) throw new HttpError(404, 'File not found');
  return json({ signed_url: data.signedUrl });
});
