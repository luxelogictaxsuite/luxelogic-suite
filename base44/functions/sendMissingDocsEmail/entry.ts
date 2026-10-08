import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Sends a "missing documents" email to the client who submitted a registration form.
// Only callable by admins (RLS on FormSubmission blocks non-admin reads).
// The email comes from the app's no-reply address and never includes sensitive
// information from the submission — only the admin's message and the client's email.
const SAFE_EMAIL_LABELS = ['Email', 'Email Address', 'Email address'];
const SAFE_NAME_LABELS = ['Full Legal First Name', 'First Name', 'First name', 'Legal First Name'];
const SAFE_LAST_LABELS = ['Full Legal Last Name', 'Last Name', 'Last name', 'Legal Last Name'];

function getField(data, labels) {
  for (const l of labels) {
    if (data[l]) return String(data[l]).slice(0, 120);
  }
  return '';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const submissionId = String(body?.submissionId || '').slice(0, 60);
    const message = String(body?.message || '').slice(0, 2000);

    if (!submissionId || !message) {
      return Response.json({ error: 'submissionId and message are required' }, { status: 400 });
    }

    // Look up the submission using the user's own permissions (RLS blocks non-admins).
    let submission;
    try {
      submission = await base44.entities.FormSubmission.get(submissionId);
    } catch (e) {
      return Response.json({ error: 'Submission not found or access denied' }, { status: 403 });
    }

    // Parse submission data to find the client's email (safe field only).
    let data = {};
    try { data = JSON.parse(submission.submission_data || '{}'); } catch {}

    const clientEmail = getField(data, SAFE_EMAIL_LABELS);
    if (!clientEmail) {
      return Response.json({ error: 'No email address found in this submission' }, { status: 400 });
    }

    const firstName = getField(data, SAFE_NAME_LABELS);
    const lastName = getField(data, SAFE_LAST_LABELS);
    const clientName = [firstName, lastName].filter(Boolean).join(' ') || 'there';

    const subject = 'Action needed: Missing documents for your LuxeLogic registration';
    const text = `Hi ${clientName},\n\n${message}\n\nIf you have any questions, please contact our office.\n\n— The LuxeLogic Team\n\nThis is an automated message from LuxeLogic Tax Suite. Please do not reply to this email.`;

    // Send from the app's no-reply address (service role).
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: clientEmail,
      subject,
      text,
      from_name: 'LuxeLogic Tax Suite (No Reply)',
    });

    return Response.json({ ok: true, email: clientEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}