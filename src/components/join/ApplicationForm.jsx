import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import ChoiceGroup from '@/components/join/ChoiceGroup';

const STEPS = [
  { q: 'What is your full name?', fields: [['full_name', 'Full name']] },
  { q: 'How can we reach you?', fields: [['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['city_state', 'City, State']] },
  { q: 'What is your PTIN?', fields: [['ptin', 'P00000000']] },
  { q: 'Tell us about your experience.', choice: ['years_experience', ['New preparer', '1-2 years', '3-5 years', '6+ years']], fields: [['projected_returns', 'Projected funded returns this season', 'number']] },
  { q: 'Which software do you prefer?', choice: ['software_preference', ['TaxSlayer Pro', 'OLT Pro', 'No preference']], notes: true },
];
const REQUIRED = { 0: ['full_name'], 1: ['email'], 2: ['ptin'] };

export default function ApplicationForm({ data, setData }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const s = STEPS[step];
  const canNext = (REQUIRED[step] || []).every((k) => String(data[k] || '').trim());
  const set = (k, v) => setData({ ...data, [k]: v });

  const submit = async () => {
    setSaving(true); setError('');
    try {
      await base44.entities.PreparerApplication.create({ ...data, projected_returns: data.projected_returns ? +data.projected_returns : undefined, status: 'New' });
      // Bridge: immediately create a Preparer record so the PTIN flows into the
      // system — the admin can then add seat key, funded returns, etc. without
      // waiting for approval. Runs server-side to bypass Preparer create RLS.
      try {
        await base44.functions.invoke('bridgePreparer', {
          full_name: data.full_name,
          email: data.email,
          ptin: data.ptin,
          phone: data.phone,
        });
      } catch (bridgeErr) { /* best-effort — don't block the application */ }
      setDone(true);
    } catch (e) { setError(e.message || 'Something went wrong. Please try again.'); }
    setSaving(false);
  };

  if (done) return (
    <div className="flex min-h-[420px] flex-col justify-center border border-border p-8 md:p-12">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground"><Check /></div>
      <h3 className="font-display text-4xl">Application received.</h3>
      <p className="mt-3 text-muted-foreground">Thank you, {data.full_name}. Our team will review your application and reach out at {data.email}.</p>
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!canNext) return; step < STEPS.length - 1 ? setStep(step + 1) : submit(); }} className="flex min-h-[420px] flex-col border border-border p-6 md:p-12">
      <div className="mb-10 flex gap-1.5">{STEPS.map((_, i) => <span key={i} className={`h-0.5 flex-1 transition-colors duration-500 ${i <= step ? 'bg-primary' : 'bg-border'}`} />)}</div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} className="flex-1 space-y-5">
          <p className="font-mono text-xs text-primary">Step {step + 1} of {STEPS.length}</p>
          <h3 className="font-display text-3xl md:text-5xl">{s.q}</h3>
          {s.choice && <ChoiceGroup options={s.choice[1]} value={data[s.choice[0]]} onChange={(v) => set(s.choice[0], v)} />}
          {s.fields?.map(([k, ph, type = 'text']) => (
            <Input key={k} aria-label={ph} type={type} placeholder={ph} value={data[k] || ''} onChange={(e) => set(k, e.target.value)} autoFocus={k === s.fields[0][0] && !s.choice} className="h-14 rounded-none border-0 border-b bg-transparent px-0 text-xl focus-visible:ring-0" />
          ))}
          {s.notes && <Textarea placeholder="Anything else we should know? (optional)" value={data.notes || ''} onChange={(e) => set('notes', e.target.value)} className="rounded-none bg-transparent" />}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </motion.div>
      </AnimatePresence>
      <div className="mt-10 flex items-center justify-between">
        <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-0"><ArrowLeft className="h-4 w-4" />Back</button>
        <button type="submit" disabled={!canNext || saving} className="inline-flex h-12 items-center gap-2 bg-primary px-6 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {step === STEPS.length - 1 ? 'Submit application' : 'Continue'} {!saving && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}