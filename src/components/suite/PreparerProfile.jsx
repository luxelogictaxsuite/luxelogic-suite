import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';

const PROFILE_FIELDS = [
  { key: 'name', label: 'Full Name' },
  { key: 'email', label: 'Email (Login)', alwaysReadOnly: true },
  { key: 'ptin', label: 'PTIN' },
  { key: 'phone', label: 'Phone' },
  { key: 'comp_tier', label: 'Comp Tier' },
  { key: 'ce_hours_completed', label: 'CE Hours Completed', type: 'number' },
  { key: 'ce_hours_required', label: 'CE Hours Required', type: 'number' },
  { key: 'training_seat_key', label: 'Boot Camp Seat Key' },
];

export default function PreparerProfile() {
  const { me } = useOutletContext();
  const qc = useQueryClient();
  const { data: prep, isLoading } = useQuery({
    queryKey: ['myPreparerRecord', me?.email],
    queryFn: () => base44.entities.Preparer.filter({ email: me.email }),
    enabled: !!me,
  });
  const record = prep?.[0];
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  let locked = [];
  try { locked = JSON.parse(record?.locked_fields || '[]'); } catch { /* empty */ }
  const isLocked = (key) => locked.includes(key);

  const value = (key) => draft[key] !== undefined ? draft[key] : (record?.[key] ?? '');
  const dirty = PROFILE_FIELDS.some(f => draft[f.key] !== undefined && draft[f.key] !== record?.[f.key]);

  const save = async () => {
    if (!record) return;
    setSaving(true);
    const updates = {};
    PROFILE_FIELDS.forEach(f => {
      if (f.alwaysReadOnly) return;
      if (isLocked(f.key)) return;
      if (draft[f.key] !== undefined && draft[f.key] !== record[f.key]) {
        updates[f.key] = draft[f.key];
      }
    });
    await base44.entities.Preparer.update(record.id, updates);
    setDraft({});
    setSaving(false);
    setDone(true);
    qc.invalidateQueries({ queryKey: ['myPreparerRecord', me.email] });
    setTimeout(() => setDone(false), 3000);
  };

  if (isLoading) return <div className="h-40 animate-pulse bg-card" />;
  if (!record) return (
    <div className="border border-border p-6">
      <h4 className="font-display text-2xl">No preparer profile found</h4>
      <p className="mt-2 text-sm text-muted-foreground">Contact the office to set up your preparer profile.</p>
    </div>
  );

  return (
    <div className="border border-border p-6 md:p-8">
      <h4 className="font-display text-2xl">My Preparer Profile</h4>
      <p className="mt-2 text-sm text-muted-foreground">Update your contact info. Fields with a lock are managed by the office and cannot be changed here.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {PROFILE_FIELDS.map(f => {
          const lockedHere = f.alwaysReadOnly || isLocked(f.key);
          return (
            <label key={f.key}>
              <span className="eyebrow mb-1.5 flex items-center gap-1.5">
                {f.label}
                {lockedHere && <Lock className="h-3 w-3 text-muted-foreground" />}
              </span>
              <Input
                type={f.type || 'text'}
                value={value(f.key)}
                readOnly={lockedHere}
                onChange={e => setDraft({ ...draft, [f.key]: f.type === 'number' ? (e.target.value === '' ? '' : +e.target.value) : e.target.value })}
                className={`rounded-none ${lockedHere ? 'bg-secondary/50 text-muted-foreground' : 'bg-transparent'}`}
              />
            </label>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={!dirty || saving} className="inline-flex h-11 items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-30">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
        {done && <span className="text-sm text-success">Saved — the office can see your updates.</span>}
      </div>
    </div>
  );
}