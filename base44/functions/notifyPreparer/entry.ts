import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Notifies a preparer (and admins) about a status change or deadline.
// event: 'document_received' | 'document_requested' | 'needs_correction' | 'compliance_deadline'
//   document_received   -> document_request_id
//   document_requested  -> document_request_id  (emails the CLIENT)
//   needs_correction    -> assignment_id
//   compliance_deadline -> preparer_email
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const event = String(body?.event || '').slice(0, 40);
    const assignmentId = String(body?.assignment_id || '').slice(0, 60);
    const documentRequestId = String(body?.document_request_id || '').slice(0, 60);
    const preparerEmail = String(body?.preparer_email || '').slice(0, 160);

    let to = '';
    let subject = '';
    let text = '';

    if (event === 'document_received') {
      const reqs = await base44.asServiceRole.entities.DocumentRequest.filter({ id: documentRequestId });
      const doc = reqs[0];
      if (!doc) return Response.json({ ok: true, skipped: true, reason: 'no document request found' });
      to = doc.preparer_email;
      subject = `Document received: ${doc.document_name} — ${doc.client_name}`;
      text = `A client has returned a requested document.\n\nClient: ${doc.client_name}\nDocument: ${doc.document_name}${doc.notes ? `\nNote: ${doc.notes}` : ''}\n\nReview it in your Preparer Suite → Doc Requests.`;
    } else if (event === 'document_requested') {
      // Outbound notice to the CLIENT that their preparer needs a document.
      const reqs = await base44.asServiceRole.entities.DocumentRequest.filter({ id: documentRequestId });
      const doc = reqs[0];
      if (!doc) return Response.json({ ok: true, skipped: true, reason: 'no document request found' });
      if (!doc.client_email) return Response.json({ ok: true, skipped: true, reason: 'client has no email on file' });
      to = doc.client_email;
      subject = `Document needed for your tax return — ${doc.document_name}`;
      text = `Hello ${doc.client_name},\n\nYour tax preparer needs the following document to complete your return:\n\nDocument: ${doc.document_name}${doc.notes ? `\nNote: ${doc.notes}` : ''}\n\nIMPORTANT: For a smoother and more secure process, please upload your documents ONLY through the TaxesToGo app. Do not email or text documents — the TaxesToGo app is the only accepted method.\n\n— LuxeLogic Tax Suite`;
    } else if (event === 'needs_correction') {
      const assigns = await base44.asServiceRole.entities.ClientAssignment.filter({ id: assignmentId });
      const a = assigns[0];
      if (!a) return Response.json({ ok: true, skipped: true, reason: 'no assignment found' });
      to = a.preparer_email;
      subject = `Return needs correction: ${a.client_name}`;
      text = `A return has been moved to Needs Correction.\n\nClient: ${a.client_name}\nPreparer: ${a.preparer_name || a.preparer_email}\n\nReview and resolve it in your Preparer Suite → Return Queue.`;
    } else if (event === 'waitlist_join') {
      const preparerName = String(body?.preparer_name || '').slice(0, 120);
      const clientName = String(body?.client_name || '').slice(0, 160);
      const clientEmail = String(body?.client_email || '').slice(0, 160);
      const clientPhone = String(body?.client_phone || '').slice(0, 40);
      const preparers = await base44.asServiceRole.entities.Preparer.filter({ name: preparerName, active: true });
      const p = preparers[0];
      if (!p) return Response.json({ ok: true, skipped: true, reason: 'no active preparer matched' });
      to = p.email;
      subject = `New waitlist signup: ${clientName}`;
      text = `A client has joined the season waitlist and chose you as their preparer.\n\nClient: ${clientName}\nPhone: ${clientPhone}\nEmail: ${clientEmail || '—'}\n\nReach out when intake opens so they can start their return.`;
    } else if (event === 'ready_for_review') {
      let a;
      try { a = await base44.asServiceRole.entities.ClientAssignment.get(assignmentId); } catch (e) { a = null; }
      if (!a) return Response.json({ ok: true, skipped: true, reason: 'no assignment found' });
      // Admin-only notification: the preparer initiated this, so don't email them.
      subject = `Return ready for review: ${a.client_name}`;
      text = `A return has been marked ready for review.\n\nClient: ${a.client_name}\nPreparer: ${a.preparer_name || a.preparer_email}\n\nReview it in Admin → Firm Returns.`;
      to = '';
    } else if (event === 'compliance_deadline') {
      const preparers = await base44.asServiceRole.entities.Preparer.filter({ email: preparerEmail, active: true });
      const p = preparers[0];
      if (!p) return Response.json({ ok: true, skipped: true, reason: 'no active preparer matched' });
      const remaining = Math.max(0, (p.ce_hours_required || 0) - (p.ce_hours_completed || 0));
      to = p.email;
      subject = `CE compliance reminder — ${remaining} hours remaining`;
      text = `This is a reminder to complete your continuing education.\n\nPreparer: ${p.name}\nRequired: ${p.ce_hours_required || 0} hours\nCompleted: ${p.ce_hours_completed || 0} hours\nRemaining: ${remaining} hours\n\nLog your sessions in your Preparer Suite → Training.`;
    } else if (event === 'compliance_deadline_all') {
      // Scheduled reminder: email every active preparer who is behind on CE hours.
      const preparers = await base44.asServiceRole.entities.Preparer.filter({ active: true });
      const behind = preparers.filter(p => (p.ce_hours_completed || 0) < (p.ce_hours_required || 0));
      const sent = [];
      for (const p of behind) {
        if (!p.email) continue;
        const remaining = Math.max(0, (p.ce_hours_required || 0) - (p.ce_hours_completed || 0));
        const pSubject = `CE compliance reminder — ${remaining} hours remaining`;
        const pText = `This is a reminder to complete your continuing education.\n\nPreparer: ${p.name}\nRequired: ${p.ce_hours_required || 0} hours\nCompleted: ${p.ce_hours_completed || 0} hours\nRemaining: ${remaining} hours\n\nLog your sessions in your Preparer Suite → Training.`;
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: p.email, subject: pSubject, text: pText });
          sent.push(p.email);
        } catch (e) { /* individual send failure should not abort others */ }
      }
      return Response.json({ ok: true, event, reminded: behind.length, notified: sent });
    } else {
      return Response.json({ error: 'Unknown event' }, { status: 400 });
    }

    const sent = [];
    // Send to the primary recipient (skipped for admin-only events where to is empty).
    if (to) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, text });
        sent.push(to);
      } catch (e) { /* preparer email delivery is best-effort */ }
    }

    // Mirror the notice to admins so the office has visibility.
    try {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      for (const a of admins) {
        if (!a.email || a.email === to) continue;
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({ to: a.email, subject, text });
          sent.push(a.email);
        } catch (e) { /* individual send failure should not abort others */ }
      }
    } catch (e) { /* admin lookup failure should not abort the response */ }

    if (!sent.length) return Response.json({ ok: true, skipped: true, reason: 'no recipient resolved' });

    return Response.json({ ok: true, event, notified: sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}