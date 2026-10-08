import React from 'react';
import { useSettings } from '@/hooks/useSiteData';
import useCountdown from '@/hooks/useCountdown';

export default function Countdown() {
  const { settings } = useSettings();
  const mode = settings.countdown_mode || 'extension';
  const extDeadline = settings.extension_deadline;
  const taxStart = settings.tax_season_start_date || '2027-01-02T00:00:00';

  const ext = useCountdown(extDeadline);
  const tax = useCountdown(taxStart);

  // Auto-switch: if mode is extension but the deadline has passed, show tax season instead
  const showExtension = mode === 'extension' && ext.valid && !ext.passed;
  const target = showExtension ? ext : tax;
  const label = showExtension ? 'Extension filing deadline' : 'Tax season opens';
  const dateStr = showExtension ? extDeadline : taxStart;

  if (!target?.valid) return null;
  const date = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const units = [['Days', target.days], ['Hours', target.hours], ['Minutes', target.minutes], ['Seconds', target.seconds]];
  return (
    <div>
      <p className="eyebrow mb-3">{label}</p>
      <p className="mb-8 font-display text-2xl text-muted-foreground">{target.passed ? `The ${date} date has passed.` : date}</p>
      <div className="grid grid-cols-4 border-y border-border">
        {units.map(([label, v], i) => (
          <div key={label} className={`py-6 ${i ? 'border-l border-border pl-4 md:pl-6' : ''}`}>
            <div className="font-display text-5xl tabular-nums text-highlight md:text-7xl">{String(v).padStart(2, '0')}</div>
            <div className="eyebrow mt-2">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}