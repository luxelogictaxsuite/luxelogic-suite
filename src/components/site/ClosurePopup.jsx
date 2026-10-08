import React, { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSiteData';
import { AlertCircle, X } from 'lucide-react';

const STORAGE_KEY = 'luxelogic_closure_seen';

// Site-wide closure popup — shows once per session (or when the
// closure message changes) when the admin enables a closure announcement.
export default function ClosurePopup() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);

  const closureActive = settings.closure_active === 'true';
  const closureMessage = settings.closure_message || '';

  useEffect(() => {
    if (closureActive && closureMessage) {
      const seen = sessionStorage.getItem(STORAGE_KEY);
      if (seen !== closureMessage) {
        setOpen(true);
      }
    }
  }, [closureActive, closureMessage]);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, closureMessage);
    setOpen(false);
  };

  if (!open || !closureActive || !closureMessage) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5" onClick={dismiss} role="dialog" aria-modal="true" aria-label="Office closure announcement">
      <div className="relative w-full max-w-md border border-destructive/40 bg-background p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={dismiss} className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground" aria-label="Close announcement">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <h2 className="font-display text-2xl">Office Closure</h2>
        </div>
        <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{closureMessage}</p>
        <button onClick={dismiss} className="mt-6 h-10 w-full bg-primary text-sm font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">
          Got it
        </button>
      </div>
    </div>
  );
}