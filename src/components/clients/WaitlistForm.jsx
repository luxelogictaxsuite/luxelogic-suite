import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MobileSelect from '@/components/ui/mobile-select';

const STATUSES = [
  ['Single', 'Single'],
  ['Married Filing Jointly', 'Married Filing Jointly'],
  ['Married Filing Separately', 'Married Filing Separately'],
  ['Head of Household', 'Head of Household'],
  ['Qualifying Surviving Spouse', 'Qualifying Surviving Spouse'],
];
const CONTACTS = ['Phone', 'Email', 'Text'];

export default function WaitlistForm() {
  const { data: preparers = [] } = useQuery({
    queryKey: ['waitlistPreparers'],
    queryFn: () => base44.entities.Preparer.filter({ active: true }),
  });
  const [f, setF] = useState({ full_name: '', phone: '', email: '', dependents: '0', filing_status: 'Single', preferred_contact: 'Phone', preparer_name: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ready = f.full_name.trim() && f.phone.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setSaving(true); setError('');
    try {
      await base44.entities.ClientWaitlist.create({ ...f, dependents: f.dependents ? +f.dependents : 0 });
      if (f.preparer_name && !f.preparer_name.toLowerCase().startsWith('no preference')) {
        try {
          await base44.functions.invoke('notifyPreparer', {
            event: 'waitlist_join',
            preparer_name: f.preparer_name,
            client_name: f.full_name,
            client_email: f.email,
            client_phone: f.phone,
          });
        } catch (e) {}
      }
      setDone(true);
    } catch (err) { setError(err.message || 'Something went wrong. Please try again.'); }
    setSaving(false);
  };

  if (done) return (
    <div className="flex flex-col justify-center border border-border p-8 md:p-12">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-highlight-foreground"><Check /></div>
      <h3 className="font-display text-4xl">You're on the list.</h3>
      <p className="mt-3 text-muted-foreground">Thanks, {f.full_name}. We'll reach out {f.preferred_contact === 'Email' ? `at ${f.email || 'your email'}` : f.preferred_contact === 'Text' ? `by text at ${f.phone}` : `by phone at ${f.phone}`} when the season opens{f.preparer_name && f.preparer_name !== 'No preference' ? ` — ${f.preparer_name} will be your preparer.` : '.'}</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6 border border-border p-6 md:p-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="wl_name" className="eyebrow">Full name *</Label>
          <Input id="wl_name" value={f.full_name} onChange={set('full_name')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
        <div>
          <Label htmlFor="wl_phone" className="eyebrow">Phone *</Label>
          <Input id="wl_phone" type="tel" value={f.phone} onChange={set('phone')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
        <div>
          <Label htmlFor="wl_email" className="eyebrow">Email</Label>
          <Input id="wl_email" type="email" value={f.email} onChange={set('email')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
        <div>
          <Label htmlFor="wl_dep" className="eyebrow">Dependents</Label>
          <Input id="wl_dep" type="number" min="0" max="15" value={f.dependents} onChange={set('dependents')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
      </div>
      <div>
        <Label className="eyebrow">Choose your preparer</Label>
        <MobileSelect
          value={f.preparer_name}
          onChange={(v) => setF({ ...f, preparer_name: v })}
          options={[{ value: 'No preference', label: 'No preference' }, ...preparers.map((p) => ({ value: p.name, label: p.name }))]}
          placeholder="Select a preparer…"
          label="Choose your preparer"
        />
      </div>
      <div>
        <Label className="eyebrow">Filing status</Label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {STATUSES.map(([v, l]) => (
            <button key={v} type="button" onClick={() => setF({ ...f, filing_status: v })} className={`border px-3 py-3 text-left text-sm transition ${f.filing_status === v ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>{l}</button>
          ))}
        </div>
      </div>
      <div>
        <Label className="eyebrow">Preferred contact</Label>
        <div className="mt-3 flex gap-2">
          {CONTACTS.map((c) => (
            <button key={c} type="button" onClick={() => setF({ ...f, preferred_contact: c })} className={`border px-4 py-2 text-sm transition ${f.preferred_contact === c ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="wl_notes" className="eyebrow">Anything else? (optional)</Label>
        <Textarea id="wl_notes" value={f.notes} onChange={set('notes')} className="mt-3 rounded-none bg-transparent" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={!ready || saving} className="inline-flex h-12 items-center gap-2 bg-primary px-6 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground disabled:opacity-40">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Join the waitlist
      </button>
    </form>
  );
}