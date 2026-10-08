// ADMIN. Sends a "set your password" email so a preparer can log in.
// New users get an invite; existing users get a password-reset link.
import { admin, clip, handler, HttpError, json, readJson, requireAdmin, SITE_URL } from '../lib/server.mjs';

export default handler(async (req) => {
  await requireAdmin(req);
  const { email } = await readJson(req);
  const addr = clip(email, 160).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) throw new HttpError(400, 'A valid email is required');

  const redirectTo = `${SITE_URL}/reset-password?token=invite`;
  const invite = await admin.auth.admin.inviteUserByEmail(addr, { redirectTo });
  if (!invite.error) return json({ ok: true, invited: true });

  // Already has an account → send a password reset instead.
  if (/already|registered|exists/i.test(invite.error.message)) {
    const reset = await admin.auth.resetPasswordForEmail(addr, { redirectTo });
    if (reset.error) throw new HttpError(502, reset.error.message);
    return json({ ok: true, invited: false, passwordReset: true });
  }
  throw new HttpError(502, invite.error.message);
});
