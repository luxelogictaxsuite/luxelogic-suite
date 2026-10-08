import React from 'react';
import { useSettings } from '@/hooks/useSiteData';
import { Clock, AlertTriangle } from 'lucide-react';

export default function BusinessHours() {
  const { settings } = useSettings();
  const isInSeason = settings.season_mode === 'in_season';
  const hoursText = isInSeason ? (settings.in_season_hours || '') : (settings.off_season_hours || '');
  const closureActive = settings.closure_active === 'true';
  const closureMessage = settings.closure_message || '';

  return (
    <div>
      {closureActive && closureMessage && (
        <div className="border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Closure Notice</p>
              <p className="mt-1 text-sm text-muted-foreground">{closureMessage}</p>
            </div>
          </div>
        </div>
      )}
      <div className="mt-6 border border-border p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="eyebrow">Business Hours</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {isInSeason ? 'In Season' : 'Off Season'}
          </span>
        </div>
        <div className="mt-4 whitespace-pre-line text-sm text-muted-foreground">
          {hoursText || 'Contact the office for current hours.'}
        </div>
      </div>
    </div>
  );
}