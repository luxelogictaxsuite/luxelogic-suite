import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, Loader2, AlertTriangle, Check } from 'lucide-react';

// Lets an authenticated Suite user request deletion of their account + data.
// Base44 User records can't be deleted by the client, so this emails the office
// via the existing notifyFormSubmit backend function to action the request.
export default function DeleteAccount() {
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const request = async () => {
    setSending(true); setError('');
    try {
      await base44.functions.invoke('notifyFormSubmit', {
        formName: 'Account Deletion Request',
        rows: [
          { label: 'User ID', value: me?.id || '' },
          { label: 'Name', value: me?.full_name || '' },
          { label: 'Email', value: me?.email || '' },
          { label: 'Role', value: me?.role || '' },
          { label: 'Requested', value: new Date().toLocaleString() },
        ],
      });
      setDone(true);
      setConfirming(false);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please contact the office.');
    }
    setSending(false);
  };

  if (done) {
    return (
      <div className="border border-border p-6 md:p-8">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success"><Check className="h-5 w-5" /></div>
        <h4 className="font-display text-2xl">Request received.</h4>
        <p className="mt-2 text-sm text-muted-foreground">The office has been notified. We'll contact you at {me?.email || 'your email'} to confirm and complete the deletion within 30 days.</p>
      </div>
    );
  }

  return (
    <div className="border border-destructive/30 bg-destructive/5 p-6 md:p-8">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 text-destructive" />
        <div>
          <h4 className="font-display text-2xl">Delete your account</h4>
          <p className="mt-2 text-sm text-muted-foreground">Request permanent deletion of your account and associated data. This is irreversible — once processed, you'll lose access to the Suite, returns, and earnings history.</p>
        </div>
      </div>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-6 inline-flex h-11 items-center gap-2 border border-destructive px-5 text-sm font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4" /> Request deletion
        </button>
      ) : (
        <div className="mt-6 border border-border bg-background p-5">
          <p className="text-sm">Are you sure? This sends a deletion request to the LuxeLogic office for <strong>{me?.email || 'your account'}</strong>.</p>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={request}
              disabled={sending}
              className="inline-flex h-11 items-center gap-2 bg-destructive px-5 text-sm font-medium text-destructive-foreground transition disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Yes, submit request
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="inline-flex h-11 items-center px-5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}