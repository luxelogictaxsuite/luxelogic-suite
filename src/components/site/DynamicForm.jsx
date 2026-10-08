import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, Clock, Ban } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ChoiceGroup from '@/components/join/ChoiceGroup';
import FileUpload from '@/components/forms/FileUpload';
import MobileSelect from '@/components/ui/mobile-select';

const opts = (s = '') => (s || '').split(',').map(o => o.trim()).filter(Boolean);
const isLong = (s) => (s || '').length > 100;


// Renders a native built form (FormDefinition) and saves a FormSubmission,
// then notifies admins via the notifyFormSubmit backend function (sanitized —
// only safe fields are sent; sensitive data stays in the secure submission record).
export default function DynamicForm({ formId }) {
  const { data: form, isLoading } = useQuery({
    queryKey: ['formDef', formId],
    queryFn: () => base44.entities.FormDefinition.get(formId),
    enabled: !!formId,
  });
  const fields = useMemo(() => { try { return JSON.parse(form?.fields || '[]'); } catch { return []; } }, [form]);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [privacyAck, setPrivacyAck] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [captchaQ] = useState(() => {
    const a = Math.floor(Math.random() * 5) + 1;
    const b = Math.floor(Math.random() * 5) + 1;
    return { q: `${a} + ${b}`, answer: a + b };
  });
  const [captchaInput, setCaptchaInput] = useState('');
  const submittedRef = useRef(false);

  if (isLoading) return <div className="h-64 animate-pulse bg-card" />;
  if (!form || !form.active) return <p className="text-muted-foreground">This form is not available.</p>;

  // form_status is the authoritative control (accepting / coming_soon / closed).
  // Fall back to the legacy coming_soon boolean for older forms.
  const formStatus = form.form_status || (form.coming_soon ? 'coming_soon' : 'accepting');

  if (formStatus === 'coming_soon') return (
    <div className="flex flex-col justify-center border border-border p-8 md:p-12">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-highlight-foreground shadow-[0_0_24px_rgba(0,255,224,0.45)]"><Clock /></div>
      <h2 className="font-display text-4xl md:text-5xl">{form.name}</h2>
      {form.description && <p className="mt-4 text-lg text-muted-foreground">{form.description}</p>}
      <p className="mt-8 inline-flex w-fit bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_0_16px_rgba(156,121,69,0.4)]">Coming Soon</p>
    </div>
  );

  if (formStatus === 'closed') return (
    <div className="flex flex-col justify-center border border-border p-8 md:p-12">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground"><Ban /></div>
      <h2 className="font-display text-4xl md:text-5xl">{form.name}</h2>
      {form.description && <p className="mt-4 text-lg text-muted-foreground">{form.description}</p>}
      <p className="mt-8 inline-flex w-fit border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Submissions are currently closed.</p>
      <p className="mt-4 text-sm text-muted-foreground">Please check back later or contact us if you need assistance.</p>
    </div>
  );

  const set = (label, v) => setValues(s => ({ ...s, [label]: v }));

  const isEmpty = (f) => {
    const v = values[f.label];
    if (f.type === 'checkbox') return v !== true;
    if (f.type === 'file') return !v?.file_uri;
    return !String(v ?? '').trim();
  };
  const missing = fields.filter(f => f.required && f.type !== 'heading' && isEmpty(f)).map(f => f.label);

  const renderLabel = (f) => isLong(f.label)
    ? <p className="text-sm text-muted-foreground">{f.label}{f.required ? ' *' : ''}</p>
    : <Label className="eyebrow">{f.label}{f.required ? ' *' : ''}</Label>;

  const submit = async (e) => {
    e.preventDefault();
    // Honeypot — if filled, silently "succeed" without saving (bot trap).
    if (honeypot) { setDone(true); return; }
    // Prevent double-submit.
    if (submittedRef.current || saving) return;

    if (!privacyAck) { setError('Please review and acknowledge the Privacy Policy to continue.'); return; }
    if (Number(captchaInput) !== captchaQ.answer) { setError('Please answer the security question correctly.'); return; }
    if (missing.length) { setError(`Please complete: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}`); return; }

    submittedRef.current = true;
    setSaving(true); setError('');
    try {
      const sub = await base44.entities.FormSubmission.create({
        form_definition_id: form.id,
        form_name: form.name,
        submission_data: JSON.stringify(values), // stored whole — truncating corrupted long, signed intakes
        status: 'New',
      });
      // Route the intake to the preparer the client selected, then notify
      // admins. The server reads everything from the saved submission itself;
      // only its id is sent, so nothing sensitive travels in these calls.
      try { await base44.functions.invoke('routeIntake', { submissionId: sub.id }); } catch (e) { /* best-effort */ }
      try { await base44.functions.invoke('notifyFormSubmit', { submissionId: sub.id }); } catch (e) { /* best-effort */ }
      setDone(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      submittedRef.current = false; // Allow retry on failure
    }
    setSaving(false);
  };

  if (done) return (
    <div className="flex flex-col justify-center border border-border p-8 md:p-12">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-highlight text-highlight-foreground"><Check /></div>
      <h3 className="font-display text-4xl">Thank you.</h3>
      <p className="mt-3 text-muted-foreground">{form.success_message || 'Your submission has been received. We will be in touch shortly.'}</p>
      {form.name === '2026-2027 Client Intake' && (
        <Link to="/form/6ab824994701e22f9ed573e2" className="mt-6 inline-flex h-12 w-fit items-center bg-primary px-6 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">Continue to Engagement Agreement →</Link>
      )}
    </div>
  );

  return (
    <div>
      <h2 className="font-display text-4xl md:text-5xl">{form.name}</h2>
      {form.description && <p className="mt-4 text-muted-foreground">{form.description}</p>}
      <form onSubmit={submit} className="mt-8 space-y-6 border border-border p-6 md:p-10">
        {/* Honeypot — hidden from humans, bots fill it */}
        <input type="text" name="company_website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} tabIndex={-1} autoComplete="off" aria-hidden="true" />

        {fields.map((f, i) => {
          if (f.type === 'heading') return <h4 key={i} className="font-display text-2xl pt-6 mt-2 border-t border-border">{f.label}</h4>;
          if (f.type === 'paragraph') return <p key={i} className="text-sm leading-relaxed text-muted-foreground">{f.label}</p>;
          const val = values[f.label] ?? (f.type === 'checkbox' ? false : (f.type === 'file' ? null : ''));

          if (f.type === 'checkbox') {
            return (
              <label key={i} className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={!!val} onChange={e => set(f.label, e.target.checked)} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" />
                <span>{f.label}{f.required ? ' *' : ''}</span>
              </label>
            );
          }
          if (f.type === 'file') {
            return <div key={i}><FileUpload label={f.label} value={val} onChange={(obj) => set(f.label, obj)} /></div>;
          }
          if (f.type === 'signature') {
            return (
              <div key={i}>
                <Label className="eyebrow">{f.label}{f.required ? ' *' : ''}</Label>
                <p className="mt-2 text-xs text-muted-foreground">Type your full legal name as your electronic signature.</p>
                <Input value={val} onChange={e => set(f.label, e.target.value)} placeholder="Full legal name" className="mt-2 h-14 rounded-none border-0 border-b bg-transparent px-0 text-xl italic font-display focus-visible:ring-0" />
              </div>
            );
          }
          if (f.type === 'choice') {
            return (
              <div key={i}>
                {renderLabel(f)}
                <div className="mt-3"><ChoiceGroup options={opts(f.options)} value={val} onChange={(v) => set(f.label, v)} /></div>
              </div>
            );
          }
          if (f.type === 'textarea') {
            return (
              <div key={i}>
                {renderLabel(f)}
                <Textarea value={val} onChange={e => set(f.label, e.target.value)} placeholder={f.placeholder} className="mt-3 rounded-none bg-transparent" />
              </div>
            );
          }
          if (f.type === 'select') {
            const selectOpts = opts(f.options).map(o => ({ value: o, label: o }));
            return (
              <div key={i}>
                {renderLabel(f)}
                <MobileSelect value={val} onChange={(v) => set(f.label, v)} options={selectOpts} placeholder="Select…" label={f.label} />
              </div>
            );
          }
          return (
            <div key={i}>
              <Label className="eyebrow">{f.label}{f.required ? ' *' : ''}</Label>
              <Input type={f.type || 'text'} value={val} onChange={e => set(f.label, e.target.value)} placeholder={f.placeholder} className="mt-3 h-12 rounded-none bg-transparent" />
            </div>
          );
        })}

        {/* Security check (CAPTCHA) */}
        <div>
          <Label className="eyebrow">Security check: What is {captchaQ.q}? *</Label>
          <Input type="number" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} className="mt-3 h-12 rounded-none bg-transparent" placeholder="Your answer" />
        </div>

        {/* Privacy acknowledgment — required, immediately above Submit */}
        <div className="border-t border-border pt-6">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={privacyAck} onChange={e => setPrivacyAck(e.target.checked)} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" required />
            <span className="text-muted-foreground">I acknowledge that LuxeLogic Tax Suite LLC will collect and securely store the personal information and documents provided in this registration for identity verification, tax-software enrollment, banking-product enrollment, compliance, payment, and onboarding purposes. I have reviewed and agree to the <Link to="/privacy-policy" className="text-primary underline hover:text-highlight">Privacy Policy</Link>.</span>
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={saving} className="inline-flex h-12 items-center gap-2 bg-primary px-6 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground disabled:opacity-40">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit
        </button>
      </form>
    </div>
  );
}