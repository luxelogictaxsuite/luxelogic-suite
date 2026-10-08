import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Routes a completed Client Intake submission to the preparer the client selected.
// Creates a ClientAssignment (visible only to that preparer + admins via RLS) and
// emails the preparer so they are notified the moment a client chooses them.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const submissionId = String(body?.submissionId || '').slice(0, 60);
    const formName = String(body?.formName || '').slice(0, 120);
    const preparerName = String(body?.preparerName || '').slice(0, 120);
    const clientName = String(body?.clientName || '').slice(0, 160);
    const clientEmail = String(body?.clientEmail || '').slice(0, 160);
    const clientPhone = String(body?.clientPhone || '').slice(0, 40);

    // "No preference" selections are not routed to a specific preparer.
    if (!preparerName || preparerName.toLowerCase().startsWith('no preference')) {
      return Response.json({ ok: true, routed: false, reason: 'no preference selected' });
    }

    const preparers = await base44.asServiceRole.entities.Preparer.filter({ name: preparerName, active: true });
    const preparer = preparers[0];
    if (!preparer) {
      return Response.json({ ok: true, routed: false, reason: 'no preparer matched' });
    }

    await base44.asServiceRole.entities.ClientAssignment.create({
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      preparer_name: preparer.name,
      preparer_email: preparer.email,
      form_submission_id: submissionId,
      status: 'Awaiting Documents',
    });

    const subject = `New client assigned: ${clientName}`;
    const text = `A new client has selected you as their preparer.\n\nClient: ${clientName}\nForm: ${formName}\n\nReview the intake in your Preparer Suite → Return Queue.`;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: preparer.email, subject, text });
    } catch (e) { /* delivery to the preparer is best-effort */ }

    return Response.json({ ok: true, routed: true, preparer: preparer.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}