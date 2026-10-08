import React, { useState } from 'react';
import { Loader2, X, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Dialog for admins to email a client about missing documents.
// The email comes from the app's no-reply address and never includes
// sensitive information from the submission.
export default function MissingDocsDialog({ submission, onClose }) {
  const [message, setMessage] = useState('Thank you for submitting your registration. To complete your onboarding, we still need the following documents:\n\n• \n• \n\nPlease upload these at your earliest convenience. If you have questions, reply to this email or call our office.\n\n— The LuxeLogic Team');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const send = async () => {
    setSending(true); setResult('');
    try {
      const res = await base44.functions.invoke('sendMissingDocsEmail', {
        submissionId: submission.id,
        message,
      });
      setResult(res?.ok ? `Email sent to ${res.email || 'client'}.` : 'Failed to send.');
    } catch (e) {
      setResult(e.message || 'Failed to send email.');
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg border border-border bg-background p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl">Request Missing Documents</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">An email will be sent from LuxeLogic (no-reply) to the address on file for this submission. Sensitive information is never included in the email.</p>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={8} className="w-full rounded-none border border-input bg-transparent p-3 text-sm" />
        {result && <p className="mt-3 text-sm text-muted-foreground">{result}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="h-10 px-4 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={send} disabled={sending || !message.trim()} className="inline-flex h-10 items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-highlight hover:text-highlight-foreground disabled:opacity-40">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Email
          </button>
        </div>
      </div>
    </div>
  );
}