// Return-workflow notifications.
//   document_requested  (preparer/admin) → emails the CLIENT
//   document_received   (preparer/admin) → emails the preparer (+ admins)
//   needs_correction    (admin)          → emails the preparer (+ admins)
//   ready_for_review    (preparer/admin) → emails admins
//   return_filed        (admin)          → emails the preparer        [NEW]
//   waitlist_join       (public)         → emails the chosen preparer
//
// Hardened vs. Base44: every event checks the caller is allowed to act on
// that record, and the public waitlist event only fires for a waitlist
// entry created moments ago, once.
import {
  admin, adminEmails, activePreparer, clip, emailLayout, formatTime, getCaller, handler, HttpError,
  isFresh, json, once, readJson, sameEmail, sendEmail, SITE_URL,
} from '../lib/server.mjs';

async function loadAssignment(id) {
  const { data } = await admin.from('client_assignments').select('*').eq('id', clip(id, 60)).maybeSingle();
  if (!data) throw new HttpError(404, 'Return not found');
  return data;
}

async function loadDocRequest(id) {
  const { data } = await admin.from('document_requests').select('*').eq('id', clip(id, 60)).maybeSingle();
  if (!data) throw new HttpError(404, 'Document request not found');
  return data;
}

// Caller must be an admin, or the active preparer who owns the record.
async function assertOwnerOrAdmin(caller, preparerEmail) {
  if (!caller) throw new HttpError(401, 'Please log in');
  if (caller.role === 'admin') return;
  if (sameEmail(caller.email, preparerEmail) && (await activePreparer(caller.email))) return;
  throw new HttpError(403, 'Not allowed');
}

const withoutCaller = (emails, caller) => emails.filter((e) => !sameEmail(e, caller?.email));

export default handler(async (req) => {
  const body = await readJson(req);
  const event = clip(body.event, 40);
  const caller = await getCaller(req);
  const sent = [];
  const send = async (to, subject, mail) => {
    const r = await sendEmail({ to, subject, ...mail });
    sent.push(...(r.sent || []));
  };

  switch (event) {
    case 'document_requested': {
      const doc = await loadDocRequest(body.document_request_id);
      await assertOwnerOrAdmin(caller, doc.preparer_email);
      if (!doc.client_email) return json({ ok: true, skipped: true, reason: 'client has no email on file' });
      if (!(await once(`docreq:${doc.id}`))) return json({ ok: true, duplicate: true });
      const portal = (await admin.from('site_links').select('url').eq('key', 'client_portal').maybeSingle()).data?.url;
      const mail = emailLayout({
        heading: 'A document is needed for your tax return',
        intro: `Hello ${doc.client_name},\n\nYour tax preparer needs the following document to complete your return. For your security, please upload it ONLY through your Tax Client Portal. Do not email or text tax documents.`,
        rows: [['Document', doc.document_name], ['Note', doc.notes]],
        button: portal ? { label: 'Open My Client Portal', url: portal } : undefined,
        footer: 'This is an automated message from LuxeLogic Tax Suite. Please do not reply to this email.',
      });
      await send(doc.client_email, `Document needed for your tax return: ${doc.document_name}`, mail);
      break;
    }

    case 'document_received': {
      const doc = await loadDocRequest(body.document_request_id);
      await assertOwnerOrAdmin(caller, doc.preparer_email);
      const mail = emailLayout({
        heading: `Document received: ${doc.document_name}`,
        intro: 'A requested document was marked received.',
        rows: [['Client', doc.client_name], ['Document', doc.document_name], ['Note', doc.notes], ['When', formatTime()]],
        button: { label: 'Open Doc Requests', url: `${SITE_URL}/suite/docs` },
      });
      await send(withoutCaller([doc.preparer_email, ...(await adminEmails())], caller), `Document received — ${doc.client_name}`, mail);
      break;
    }

    case 'needs_correction': {
      const a = await loadAssignment(body.assignment_id);
      await assertOwnerOrAdmin(caller, a.preparer_email);
      const mail = emailLayout({
        heading: `Return needs correction: ${a.client_name}`,
        intro: 'A return was moved to Needs Correction. Open it in your Return Queue to see what needs attention.',
        rows: [['Client', a.client_name], ['Preparer', a.preparer_name || a.preparer_email], ['When', formatTime()]],
        button: { label: 'Open in Return Queue', url: `${SITE_URL}/suite/queue?client=${a.id}` },
      });
      await send(withoutCaller([a.preparer_email, ...(await adminEmails())], caller), `Needs correction — ${a.client_name}`, mail);
      break;
    }

    case 'ready_for_review': {
      const a = await loadAssignment(body.assignment_id);
      await assertOwnerOrAdmin(caller, a.preparer_email);
      const mail = emailLayout({
        heading: `Ready for review: ${a.client_name}`,
        intro: 'A preparer marked this return ready for your review.',
        rows: [['Client', a.client_name], ['Preparer', a.preparer_name || a.preparer_email], ['Fee', a.return_fee ? `$${a.return_fee}` : ''], ['When', formatTime()]],
        button: { label: 'Review in Firm Returns', url: `${SITE_URL}/admin?client=${a.id}` },
      });
      await send(withoutCaller(await adminEmails(), caller), `Ready for review — ${a.client_name}`, mail);
      break;
    }

    case 'return_filed': {
      if (caller?.role !== 'admin') throw new HttpError(403, 'Admins only');
      const a = await loadAssignment(body.assignment_id);
      if (!(await once(`filed:${a.id}:${a.status}`))) return json({ ok: true, duplicate: true });
      const mail = emailLayout({
        heading: `Transmitted: ${a.client_name}`,
        intro: `Your client's return has been ${a.status === 'Funded' ? 'funded' : 'transmitted'}. Your Return Queue is already updated.`,
        rows: [['Client', a.client_name], ['Status', a.status], ['When', formatTime()]],
        button: { label: 'Open Return Queue', url: `${SITE_URL}/suite/queue?client=${a.id}` },
      });
      await send(a.preparer_email, `${a.status === 'Funded' ? 'Funded' : 'Transmitted'} — ${a.client_name}`, mail);
      break;
    }

    case 'waitlist_join': {
      const name = clip(body.client_name, 160);
      const phone = clip(body.client_phone, 40);
      const { data: entry } = await admin.from('client_waitlist').select('*')
        .eq('full_name', name).eq('phone', phone)
        .order('created_date', { ascending: false }).limit(1).maybeSingle();
      if (!entry || !isFresh(entry.created_date, 15)) throw new HttpError(404, 'Waitlist entry not found');
      if (!entry.preparer_name || /^no preference/i.test(entry.preparer_name)) return json({ ok: true, skipped: true });
      if (!(await once(`waitlist:${entry.id}`))) return json({ ok: true, duplicate: true });
      const { data: p } = await admin.from('preparers').select('email').eq('name', entry.preparer_name).eq('active', true).maybeSingle();
      if (!p) return json({ ok: true, skipped: true, reason: 'no active preparer matched' });
      const mail = emailLayout({
        heading: `New waitlist signup: ${entry.full_name}`,
        intro: 'A client joined the season waitlist and chose you as their preparer. Reach out when intake opens.',
        rows: [['Client', entry.full_name], ['Phone', entry.phone], ['Email', entry.email], ['Prefers', entry.preferred_contact]],
      });
      await send(p.email, `New waitlist signup — ${entry.full_name}`, mail);
      break;
    }

    // CE tracking was retired; these Base44 events no longer exist.
    case 'compliance_deadline':
    case 'compliance_deadline_all':
      return json({ ok: true, skipped: true, reason: 'CE reminders retired' });

    default:
      throw new HttpError(400, 'Unknown event');
  }

  return json({ ok: true, event, notified: sent });
});
