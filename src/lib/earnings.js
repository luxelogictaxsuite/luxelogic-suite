// Earnings are now calculated by the database (supabase/migrations —
// sync_earning trigger) whenever a return's status or fee changes, using the
// preparer's comp tier from their record. The browser no longer writes them,
// so a preparer can't create or inflate an earning. Kept as a no-op so
// existing callers don't need to change.
// eslint-disable-next-line no-unused-vars
export async function syncEarningForAssignment(assignment, compTier) {}

// Parses a FormSubmission's submission_data JSON and extracts common contact fields.
export function parseSubmissionContact(submissionData) {
  let data = {};
  try { data = JSON.parse(submissionData || '{}'); } catch { /* empty */ }
  const findKey = (match) => Object.keys(data).find((k) => k.toLowerCase().includes(match));
  const nameKey = findKey('name') || findKey('full');
  const emailKey = findKey('email') || findKey('mail');
  const phoneKey = findKey('phone') || findKey('mobile') || findKey('cell');
  return {
    name: (nameKey ? data[nameKey] : '') || '',
    email: (emailKey ? data[emailKey] : '') || '',
    phone: (phoneKey ? data[phoneKey] : '') || '',
  };
}