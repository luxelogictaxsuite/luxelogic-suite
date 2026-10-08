import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const SITE_BASE = 'https://screeching-luxe-logic-tax.base44.app';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Resolve the native intake form (Tax Clients category, prefer one named "intake").
    const forms = await base44.asServiceRole.entities.FormDefinition.filter({ active: true, category: 'Tax Clients' }, 'sort_order', 1);
    const intake = forms.find(f => /intake/i.test(f.name || '')) || forms[0];
    if (!intake) return Response.json({ error: 'No intake form found in the Tax Clients category.' }, { status: 400 });

    const formUrl = `${SITE_BASE}/form/${intake.id}`;

    const waiting = await base44.asServiceRole.entities.ClientWaitlist.filter({ status: 'Waiting' });
    const results = { total: waiting.length, emailed: 0, skipped: 0, failed: [] };

    for (const w of waiting) {
      const email = (w.email || '').trim();
      const first = (w.full_name || 'there').split(' ')[0];
      if (!email) { results.skipped++; continue; }
      const html = `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
          <h1 style="color:#9C7945; font-size: 28px; margin: 0 0 16px;">The 2026 tax season is open.</h1>
          <p style="font-size: 16px; line-height: 1.6;">Hi ${first},</p>
          <p style="font-size: 16px; line-height: 1.6;">You're on the LuxeLogic waitlist, and the moment has arrived. It's time to start your return.</p>
          <p style="margin: 28px 0;">
            <a href="${formUrl}" style="display: inline-block; background: #9C7945; color: #ffffff; padding: 14px 28px; text-decoration: none; font-family: Arial, sans-serif; font-weight: 600;">Start My Return →</a>
          </p>
          <p style="font-size: 16px; line-height: 1.6;">A LuxeLogic preparer will review every detail before anything is filed. We're glad to have you with us this season.</p>
          <p style="font-size: 14px; color: #888; margin-top: 32px;">LuxeLogic Tax Suite</p>
        </div>`;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: 'The 2026 tax season is open — start your return',
          html,
        });
        await base44.asServiceRole.entities.ClientWaitlist.update(w.id, { status: 'Contacted' });
        results.emailed++;
      } catch (e) {
        results.skipped++;
        results.failed.push({ name: w.full_name, reason: e.message });
      }
    }

    return Response.json({ ok: true, formUrl, ...results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}