import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSettings } from '@/hooks/useSiteData';
import { Clock, CalendarClock, AlertTriangle, Check, Timer } from 'lucide-react';

// Dedicated admin panel for business hours and closure announcements.
// Separates in-season vs off-season hours, toggles the active season,
// and controls the site-wide closure popup.
export default function BusinessHoursManager() {
  const { settings } = useSettings();
  const qc = useQueryClient();
  const [vals, setVals] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setVals({
      season_mode: settings.season_mode || 'off_season',
      in_season_hours: settings.in_season_hours || '',
      off_season_hours: settings.off_season_hours || '',
      closure_active: settings.closure_active || 'false',
      closure_message: settings.closure_message || '',
      countdown_mode: settings.countdown_mode || 'extension',
      extension_deadline: settings.extension_deadline || '',
      tax_season_start_date: settings.tax_season_start_date || '',
    });
  }, [settings.season_mode, settings.in_season_hours, settings.off_season_hours, settings.closure_active, settings.closure_message, settings.countdown_mode, settings.extension_deadline, settings.tax_season_start_date]);

  const set = (k, v) => { setSaved(false); setVals((s) => ({ ...s, [k]: v })); };

  const save = async () => {
    setSaving(true);
    try {
      const all = await base44.entities.SiteSetting.list('key', 100);
      const map = Object.fromEntries(all.map((s) => [s.key, s]));
      const updates = [
        { key: 'season_mode', label: 'Season Mode', value: vals.season_mode },
        { key: 'in_season_hours', label: 'In-Season Hours', value: vals.in_season_hours },
        { key: 'off_season_hours', label: 'Off-Season Hours', value: vals.off_season_hours },
        { key: 'closure_active', label: 'Closure Active', value: vals.closure_active },
        { key: 'closure_message', label: 'Closure Message', value: vals.closure_message },
        { key: 'countdown_mode', label: 'Countdown Mode', value: vals.countdown_mode },
        { key: 'extension_deadline', label: 'Extension Deadline', value: vals.extension_deadline },
        { key: 'tax_season_start_date', label: 'Tax Season Start Date', value: vals.tax_season_start_date },
      ];
      for (const u of updates) {
        if (map[u.key]) {
          await base44.entities.SiteSetting.update(map[u.key].id, { value: u.value });
        } else {
          await base44.entities.SiteSetting.create({ key: u.key, label: u.label, value: u.value });
        }
      }
      qc.invalidateQueries({ queryKey: ['siteSettings'] });
      setSaved(true);
    } catch (e) { /* best-effort */ }
    setSaving(false);
  };

  const isSeason = vals.season_mode === 'in_season';
  const closureOn = vals.closure_active === 'true';
  const isExtension = vals.countdown_mode !== 'tax_season';

  return (
    <div className="space-y-6">
      {/* Season toggle */}
      <div className="border border-border p-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <span className="eyebrow">Season Mode</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Toggle which hours are shown across the site. Switch to In Season during tax season (Jan–Apr) and back to Off Season the rest of the year.</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => set('season_mode', 'in_season')}
            className={`flex-1 border px-4 py-3 text-sm font-medium transition ${isSeason ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            In Season (Jan–Apr)
          </button>
          <button
            onClick={() => set('season_mode', 'off_season')}
            className={`flex-1 border px-4 py-3 text-sm font-medium transition ${!isSeason ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            Off Season (May–Dec)
          </button>
        </div>
      </div>

      {/* Hours editors */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className={`border p-6 ${isSeason ? 'border-primary' : 'border-border'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="eyebrow">In-Season Hours</span>
            </div>
            {isSeason && <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary">Active</span>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">One line per day. Shown when In Season is on.</p>
          <textarea
            value={vals.in_season_hours || ''}
            onChange={(e) => set('in_season_hours', e.target.value)}
            rows={7}
            className="mt-4 w-full border border-input bg-background p-3 font-mono text-sm"
            placeholder={'Mon–Fri: 8:00 AM – 8:00 PM ET\nSat: 9:00 AM – 5:00 PM ET\nSun: Closed'}
          />
        </div>
        <div className={`border p-6 ${!isSeason ? 'border-primary' : 'border-border'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="eyebrow">Off-Season Hours</span>
            </div>
            {!isSeason && <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary">Active</span>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">One line per day. Shown when Off Season is on.</p>
          <textarea
            value={vals.off_season_hours || ''}
            onChange={(e) => set('off_season_hours', e.target.value)}
            rows={7}
            className="mt-4 w-full border border-input bg-background p-3 font-mono text-sm"
            placeholder={'Mon–Fri: 9:00 AM – 6:00 PM ET\nSat: 10:00 AM – 2:00 PM ET\nSun: Closed'}
          />
        </div>
      </div>

      {/* Countdown mode toggle */}
      <div className="border p-6 border-border">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-primary" />
          <span className="eyebrow">Countdown Mode</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Controls which countdown appears on the homepage. Extension shows the Oct 15 filing deadline; Tax Season shows the countdown to the next season opening. If Extension is selected but its deadline has passed, the site auto-falls back to Tax Season.</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => set('countdown_mode', 'extension')}
            className={`flex-1 border px-4 py-3 text-sm font-medium transition ${isExtension ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            Extension Deadline
          </button>
          <button
            onClick={() => set('countdown_mode', 'tax_season')}
            className={`flex-1 border px-4 py-3 text-sm font-medium transition ${!isExtension ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            Tax Season Opens
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Extension deadline (Eastern time)</label>
            <input
              type="datetime-local"
              value={vals.extension_deadline || ''}
              onChange={(e) => set('extension_deadline', e.target.value)}
              className="mt-1 w-full border border-input bg-background p-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">Used when Extension Deadline is active.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tax season start date</label>
            <input
              type="datetime-local"
              value={vals.tax_season_start_date || ''}
              onChange={(e) => set('tax_season_start_date', e.target.value)}
              className="mt-1 w-full border border-input bg-background p-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">Used when Tax Season Opens is active (or as auto-fallback).</p>
          </div>
        </div>
      </div>

      {/* Closure announcement */}
      <div className={`border p-6 ${closureOn ? 'border-destructive' : 'border-border'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="eyebrow">Closure Announcement</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">When enabled, a popup appears on the site announcing your closure. Use for holidays, weather closures, or any upcoming time off. Changing the message resets the popup for all visitors.</p>
          </div>
          <button
            onClick={() => set('closure_active', closureOn ? 'false' : 'true')}
            className={`shrink-0 border px-4 py-2 text-sm font-medium transition ${closureOn ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            {closureOn ? 'Closure ON' : 'Closure OFF'}
          </button>
        </div>
        <textarea
          value={vals.closure_message || ''}
          onChange={(e) => set('closure_message', e.target.value)}
          rows={4}
          className="mt-4 w-full border border-input bg-background p-3 text-sm"
          placeholder="We are closed Nov 27–28 for Thanksgiving. We'll respond to all support tickets on our return."
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground disabled:opacity-40">
          {saving ? 'Saving…' : <><Check className="h-4 w-4" /> Save Changes</>}
        </button>
        {saved && <span className="text-sm text-success">Saved — changes are live on the site.</span>}
      </div>
    </div>
  );
}