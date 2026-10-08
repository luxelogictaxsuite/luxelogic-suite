// PUBLIC. Called right after someone submits the software purchase form.
// Looks up the purchase they JUST saved (by email) instead of trusting the
// browser, then emails admins and sends the customer their registration link.
// EFIN/PTIN and other sensitive details are never emailed.
import { admin, adminEmails, clip, emailLayout, formatTime, handler, HttpError, isFresh, json, likeLiteral, once, readJson, sendEmail, siteLink, SITE_URL } from '../lib/server.mjs';

export default handler(async (req) => {
  const { email } = await readJson(req);
  const addr = clip(email, 160).trim();
  if (!addr) throw new HttpError(400, 'email is required');

  const { data: lead } = await admin.from('software_purchases').select('*')
    .ilike('email', likeLiteral(addr)).order('created_date', { ascending: false }).limit(1).maybeSingle();
  if (!lead || !isFresh(lead.created_date, 15)) throw new HttpError(404, 'Purchase not found');
  if (!(await once(`purchase:${lead.id}`))) return json({ ok: true, duplicate: true });

  const software = lead.software || 'software';
  const adminMail = emailLayout({
    heading: `New software purchase: ${software}`,
    intro: `${lead.full_name} started a ${software} purchase. Review the full registration in the Admin Suite.`,
    rows: [['Name', lead.full_name], ['Email', lead.email], ['Phone', lead.phone], ['Software', software], ['Submitted', formatTime(lead.created_date)]],
    button: { label: 'Review Secure Submission', url: `${SITE_URL}/admin?tab=purchases` },
  });
  const sent = (await sendEmail({ to: await adminEmails(), subject: `New software purchase — ${software}`, ...adminMail })).sent || [];

  const regKey = lead.software === 'OLT Pro' ? 'registration_olt' : 'registration_taxslayer';
  const registrationLink = (await siteLink(regKey)) || (await siteLink('crm_software_registration'));
  let customerSent = false;
  if (registrationLink) {
    const mail = emailLayout({
      heading: `Welcome to LuxeLogic, ${lead.full_name}`,
      intro: `Thanks for choosing ${software} with LuxeLogic! Your onboarding has started. Complete your software registration using the button below and our team will begin your build right away.`,
      button: { label: 'Complete My Registration', url: registrationLink },
    });
    customerSent = (await sendEmail({ to: lead.email, subject: `Next step: your ${software} registration`, ...mail })).ok;
  }
  return json({ ok: true, registrationLink, notified: sent, customerSent });
});
