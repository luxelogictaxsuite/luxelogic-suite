import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSiteData';
import useCountdown from '@/hooks/useCountdown';

export default function DeadlineTicker() {
  const { settings } = useSettings();
  const c = useCountdown(settings.extension_deadline);
  if (!c.valid) return null;
  const dateLabel = new Date(settings.extension_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const text = c.passed
    ? `Extension deadline of ${dateLabel} has passed — we can still help you file`
    : `Extension deadline ${dateLabel} — ${c.days}d ${String(c.hours).padStart(2, '0')}h ${String(c.minutes).padStart(2, '0')}m ${String(c.seconds).padStart(2, '0')}s remaining`;
  const items = Array.from({ length: 6 }, (_, i) => (
    <span key={i} className="flex items-center gap-6 px-6">
      <span className="h-1.5 w-1.5 rounded-full bg-highlight" />
      <span>{text}</span>
      <span className="text-highlight">File now →</span>
    </span>
  ));
  return (
    <Link to="/tax-clients#deadline" className="block overflow-hidden border-b border-border bg-background py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary hover:text-highlight">
      <div className="flex w-max animate-ticker">{items}{items}</div>
    </Link>
  );
}