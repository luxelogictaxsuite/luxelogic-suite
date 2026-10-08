import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SOFTWARE = ['TaxSlayer Pro', 'OLT Pro', 'Both'];

export default function DemoRequestForm() {
  const [f, setF] = useState({ full_name: '', email: '', phone: '', software: 'TaxSlayer Pro', efin: '', office_size: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ready = f.full_name.trim() && f.email.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    setSaving(true); setError('');
    try {
      await base44.entities.DemoRequest.create({ ...f, status: 'New' });
      setDone(true);
    } catch (err) { setError(err.message || 'Something went wrong. Please try again.'); }
    setSaving(false);
  };

  if (done) return (
    <div className="border border-border p-8 md:p-10">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-highlight-foreground"><Check /></div>
      <h3 className="font-display text-3xl">Request received.</h3>
      <p className="mt-3 text-muted-foreground">Thanks, {f.full_name}. Our team will reach out at {f.email} to schedule your {f.software} demo.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6 border border-border p-6 md:p-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="dr_name" className="eyebrow">Full name *</Label>
          <Input id="dr_name" value={f.full_name} onChange={set('full_name')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
        <div>
          <Label htmlFor="dr_email" className="eyebrow">Email *</Label>
          <Input id="dr_email" type="email" value={f.email} onChange={set('email')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
        <div>
          <Label htmlFor="dr_phone" className="eyebrow">Phone</Label>
          <Input id="dr_phone" type="tel" value={f.phone} onChange={set('phone')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
        <div>
          <Label htmlFor="dr_efin" className="eyebrow">EFIN (if held)</Label>
          <Input id="dr_efin" value={f.efin} onChange={set('efin')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
      </div>
      <div>
        <Label className="eyebrow">Which software?</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {SOFTWARE.map((s) => (
            <button key={s} type="button" onClick={() => setF({ ...f, software: s })} className={`border px-4 py-2 text-sm transition ${f.software === s ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="dr_office" className="eyebrow">Office size / expected volume (optional)</Label>
        <Input id="dr_office" value={f.office_size} onChange={set('office_size')} className="mt-3 h-12 rounded-none bg-transparent" />
      </div>
      <div>
        <Label htmlFor="dr_notes" className="eyebrow">Anything specific you'd like to see? (optional)</Label>
        <Textarea id="dr_notes" value={f.notes} onChange={set('notes')} className="mt-3 rounded-none bg-transparent" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={!ready || saving} className="inline-flex h-12 items-center gap-2 bg-primary px-6 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground disabled:opacity-40">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Request demo
      </button>
    </form>
  );
}