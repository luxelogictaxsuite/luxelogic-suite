// ADMIN. Emails everyone on the client waitlist (status Waiting) that the
// season is open, with a link to the intake form, then marks them Contacted.
import { admin, emailLayout, handler, HttpError, json, requireAdmin, sendEmail, SITE_URL } from '../lib/server.mjs';

export default handler(async (req) => {
  await requireAdmin(req);
  const { data: forms } = await admin.from('form_definitions').select('*')
    .eq('active', true).eq('category', 'Tax Clients').order('sort_order');
  const intake = (forms || []).find((f) => /intake/i.test(f.name || '')) || forms?.[0];
  if (!intake) throw new HttpError(400, 'No intake form found in the Tax Clients category.');
  const formUrl = `${SITE_URL}/form/${intake.slug || intake.id}`;
  const year = new Date().getFullYear();

  const { data: waiting } = await admin.from('client_waitlist').select('*').eq('status', 'Waiting');
  const results = { total: waiting?.length || 0, emailed: 0, skipped: 0, failed: [] };

  for (const w of waiting || []) {
    const email = (w.email || '').trim();
    if (!email) { results.skipped++; continue; }
    const mail = emailLayout({
      heading: `The ${year} tax season is open.`,
      intro: `Hi ${(w.full_name || 'there').split(' ')[0]},\n\nYou're on the LuxeLogic waitlist, and the moment has arrived. It's time to start your return. A LuxeLogic preparer will review every detail before anything is filed.`,
      button: { label: 'Start My Return', url: formUrl },
    });
    const r = await sendEmail({ to: email, subject: `The ${year} tax season is open — start your return`, ...mail });
    if (r.ok) {
      await admin.from('client_waitlist').update({ status: 'Contacted' }).eq('id', w.id);
      results.emailed++;
    } else {
      results.skipped++;
      results.failed.push({ name: w.full_name, reason: r.reason || 'send failed' });
    }
  }
  return json({ ok: true, formUrl, ...results });
});
