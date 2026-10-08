import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSiteLinks } from '@/hooks/useSiteData';

const SOFTWARE = ['TaxSlayer Pro', 'OLT Pro', 'Both'];

export default function SoftwarePurchaseForm() {
  const { links } = useSiteLinks();
  const [f, setF] = useState({ full_name: '', email: '', phone: '', software: 'TaxSlayer Pro', efin: '', ptin: '', office_size: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [regLink, setRegLink] = useState('');
  const [error, setError] = useState('');
  const [privacyAck, setPrivacyAck] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ready = f.full_name.trim() && f.email.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!ready) return;
    if (!privacyAck) { setError('Please review and acknowledge the Privacy Policy to continue.'); return; }
    setSaving(true); setError('');
    try {
      await base44.entities.SoftwarePurchase.create({ ...f, status: 'New' });
      try { await base44.functions.invoke('notifySoftwarePurchase', { email: f.email }); } catch (e) { /* admin notification is best-effort */ }
      const regKey = f.software === 'OLT Pro' ? 'registration_olt' : 'registration_taxslayer';
      const link = links?.[regKey]?.url;
      if (link) { window.location.href = link; return; }
      setDone(true);
    } catch (err) { setError(err.message || 'Something went wrong. Please try again.'); }
    setSaving(false);
  };

  if (done) return (
    <div className="border border-border p-8 md:p-10">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-highlight-foreground"><Check /></div>
      <h3 className="font-display text-3xl">You're in — onboarding started.</h3>
      <p className="mt-3 text-muted-foreground">Thanks, {f.full_name}. Our team has been notified to begin your {f.software} build. Complete your software registration to lock in your setup:</p>
      <div className="mt-6">
        {regLink ? (
          <a href={regLink} className="inline-flex h-12 items-center gap-2 bg-primary px-6 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">Complete registration <ArrowRight className="h-4 w-4" /></a>
        ) : (
          <p className="text-sm text-muted-foreground">We'll send your registration link by email shortly.</p>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6 border border-border p-6 md:p-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="sp_name" className="eyebrow">Full name *</Label>
          <Input id="sp_name" value={f.full_name} onChange={set('full_name')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
        <div>
          <Label htmlFor="sp_email" className="eyebrow">Email *</Label>
          <Input id="sp_email" type="email" value={f.email} onChange={set('email')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
        <div>
          <Label htmlFor="sp_phone" className="eyebrow">Phone</Label>
          <Input id="sp_phone" type="tel" value={f.phone} onChange={set('phone')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
        <div>
          <Label htmlFor="sp_efin" className="eyebrow">EFIN (required to purchase)</Label>
          <Input id="sp_efin" value={f.efin} onChange={set('efin')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
        <div>
          <Label htmlFor="sp_ptin" className="eyebrow">PTIN</Label>
          <Input id="sp_ptin" value={f.ptin} onChange={set('ptin')} className="mt-3 h-12 rounded-none bg-transparent" />
        </div>
      </div>
      <div>
        <Label className="eyebrow">Which software did you purchase?</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {SOFTWARE.map((s) => (
            <button key={s} type="button" onClick={() => setF({ ...f, software: s })} className={`border px-4 py-2 text-sm transition ${f.software === s ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="sp_office" className="eyebrow">Office size / expected volume (optional)</Label>
        <Input id="sp_office" value={f.office_size} onChange={set('office_size')} className="mt-3 h-12 rounded-none bg-transparent" />
      </div>
      <div>
        <Label htmlFor="sp_notes" className="eyebrow">Anything we should know? (optional)</Label>
        <Textarea id="sp_notes" value={f.notes} onChange={set('notes')} className="mt-3 rounded-none bg-transparent" />
      </div>
      <div className="border-t border-border pt-6">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={privacyAck} onChange={e => setPrivacyAck(e.target.checked)} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" required />
          <span className="text-muted-foreground">I acknowledge that LuxeLogic Tax Suite LLC will collect and securely store the personal information and documents provided in this registration for identity verification, tax-software enrollment, banking-product enrollment, compliance, payment, and onboarding purposes. I have reviewed and agree to the <Link to="/privacy-policy" className="text-primary underline hover:text-highlight">Privacy Policy</Link>.</span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={!ready || saving} className="inline-flex h-12 items-center gap-2 bg-primary px-6 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground disabled:opacity-40">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Start onboarding
      </button>
    </form>
  );
}