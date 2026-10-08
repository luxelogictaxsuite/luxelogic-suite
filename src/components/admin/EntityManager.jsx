import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import RecordRow, { Field } from '@/components/admin/RecordRow';

// Generic admin editor: list, inline edit, optional create/delete.
export default function EntityManager({ entity, queryKey, sort, fields, createFields, canDelete, stampUpdated, intro }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: () => base44.entities[entity].list(sort, 200) });
  const [draft, setDraft] = useState({});
  const refresh = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const save = async (id, values) => {
    await base44.entities[entity].update(id, stampUpdated ? { ...values, updated_at: new Date().toISOString() } : values);
    toast.success('Saved'); refresh();
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await base44.entities[entity].delete(id); refresh();
  };
  const create = async (e) => {
    e.preventDefault();
    await base44.entities[entity].create(stampUpdated ? { ...draft, updated_at: new Date().toISOString() } : draft);
    setDraft({}); toast.success('Added'); refresh();
  };

  return (
    <div>
      {intro && <p className="mb-6 max-w-3xl text-sm text-muted-foreground">{intro}</p>}
      {isLoading ? <div className="h-40 animate-pulse bg-card" /> : data.map((r) => (
        <RecordRow key={r.id + r.updated_date} record={r} fields={fields} onSave={save} onDelete={canDelete ? remove : null} />
      ))}
      {createFields && (
        <form onSubmit={create} className="mt-8 grid gap-3 border border-dashed border-border p-5 md:grid-cols-12 md:items-end">
          {createFields.map((f) => (
            <label key={f.key} className={f.span || 'md:col-span-3'}>
              <span className="eyebrow mb-1.5 block">{f.label}</span>
              <Field f={f} value={draft[f.key]} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />
            </label>
          ))}
          <button type="submit" disabled={createFields.some((f) => f.required && !draft[f.key])} className="inline-flex h-10 items-center justify-center gap-2 border border-foreground/30 px-4 text-sm disabled:opacity-30 md:col-span-2">
            <Plus className="h-4 w-4" />Add
          </button>
        </form>
      )}
    </div>
  );
}