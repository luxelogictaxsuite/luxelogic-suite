import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function Field({ f, value, onChange }) {
  const cls = 'rounded-none bg-transparent';
  if (f.type === 'textarea') return <Textarea className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === 'select') return (
    <select className="h-10 w-full border border-input bg-background px-3 text-sm" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  if (f.type === 'checkbox') return <input type="checkbox" className="h-5 w-5 accent-primary" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
  return <Input className={cls} type={f.type || 'text'} value={value ?? ''} onChange={(e) => onChange(f.type === 'number' ? (e.target.value === '' ? '' : +e.target.value) : e.target.value)} />;
}

export default function RecordRow({ record, fields, onSave, onDelete }) {
  const [draft, setDraft] = useState(record);
  const [busy, setBusy] = useState(false);
  const dirty = fields.some((f) => draft[f.key] !== record[f.key]);
  const save = async () => { setBusy(true); await onSave(record.id, Object.fromEntries(fields.map((f) => [f.key, draft[f.key]]))); setBusy(false); };

  return (
    <div className="grid gap-3 border-b border-border py-5 md:grid-cols-12 md:items-start">
      {fields.map((f) => (
        <label key={f.key} className={f.span || 'md:col-span-3'}>
          <span className="eyebrow mb-1.5 block">{f.label}</span>
          {f.readOnly ? <span className="block py-2 font-mono text-xs text-primary">{record[f.key]}</span> : <Field f={f} value={draft[f.key]} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />}
        </label>
      ))}
      <div className="flex items-end gap-2 md:col-span-2 md:justify-end md:self-end">
        <button onClick={save} disabled={!dirty || busy} className="inline-flex h-10 items-center gap-2 bg-primary px-4 text-sm text-primary-foreground disabled:opacity-30">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}Save
        </button>
        {onDelete && <button aria-label="Delete" onClick={() => onDelete(record.id)} className="h-10 border border-border px-3 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
      </div>
    </div>
  );
}