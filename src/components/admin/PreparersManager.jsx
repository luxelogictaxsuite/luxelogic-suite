import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import RecordRow, { Field } from '@/components/admin/RecordRow';
import { PREPARER_FIELDS } from '@/components/admin/adminConfig';

const LOCKABLE_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'ptin', label: 'PTIN' },
  { key: 'phone', label: 'Phone' },
  { key: 'comp_tier', label: 'Comp tier' },
  { key: 'ce_hours_completed', label: 'CE done' },
  { key: 'ce_hours_required', label: 'CE req' },
  { key: 'training_seat_key', label: 'Seat key' },
];

// Preparer records + one-click invites so each preparer gets an email/password login.
export default function PreparersManager() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['preparers'], queryFn: () => base44.entities.Preparer.list('name', 200) });
  const [draft, setDraft] = useState({});
  const [inviting, setInviting] = useState(null);

  const save = async (id, values) => {
    await base44.entities.Preparer.update(id, values);
    toast.success('Saved');
    // Sync the full profile (incl. seat key, comp tier, CE hours) to the CRM
    try { await base44.functions.invoke('bridgePreparer', { mode: 'sync', preparer_id: id }); }
    catch { /* best-effort — profile saved locally regardless */ }
    qc.invalidateQueries({ queryKey: ['preparers'] });
  };
  const remove = async (id) => { if (!window.confirm('Delete this preparer?')) return; await base44.entities.Preparer.delete(id); qc.invalidateQueries({ queryKey: ['preparers'] }); };
  const create = async (e) => {
    e.preventDefault();
    if (PREPARER_FIELDS.some((f) => f.required && !draft[f.key])) return;
    const rec = await base44.entities.Preparer.create(draft);
    setDraft({});
    qc.invalidateQueries({ queryKey: ['preparers'] });
    if (rec.email) {
      try { await base44.users.inviteUser(rec.email, 'user'); toast.success(`Preparer added — login invite sent to ${rec.email}`); }
      catch { toast.success('Preparer added — click Invite to send the login email'); }
    } else {
      toast.success('Preparer added');
    }
  };
  const invite = async (r) => {
    if (!r.email) { toast.error('Add an email first, then invite'); return; }
    setInviting(r.id);
    try { await base44.users.inviteUser(r.email, 'user'); toast.success(`Invite sent to ${r.email} — they can set a password and log into the Suite`); }
    catch (e) { toast.error(e.message || 'Invite failed'); }
    finally { setInviting(null); }
  };

  return (
    <div>
      <p className="mb-6 max-w-3xl text-sm text-muted-foreground">Add your preparers here. The name must match the intake dropdown option exactly, and the email must match the login they'll use. Click <strong>Invite</strong> to send each preparer a password-setup email — they log into the Suite with that email and password.</p>
      {isLoading ? <div className="h-40 animate-pulse bg-card" /> : data.map((r) => {
        let locked = [];
        try { locked = JSON.parse(r.locked_fields || '[]'); } catch { /* empty */ }
        const toggleLock = async (key) => {
          const next = locked.includes(key) ? locked.filter(k => k !== key) : [...locked, key];
          await base44.entities.Preparer.update(r.id, { locked_fields: JSON.stringify(next) });
          qc.invalidateQueries({ queryKey: ['preparers'] });
        };
        return (
        <div key={r.id + r.updated_date} className="border-b border-border">
          <RecordRow record={r} fields={PREPARER_FIELDS} onSave={save} onDelete={remove} />
          <div className="flex items-center justify-end gap-3 pb-4">
            <span className="text-xs text-muted-foreground">{r.email ? `Login email: ${r.email}` : 'No email set yet'}</span>
            <button onClick={() => invite(r)} disabled={!r.email || inviting === r.id} className="inline-flex h-9 items-center gap-2 border border-foreground/30 px-3 text-sm disabled:opacity-30">
              <Send className="h-3.5 w-3.5" />{inviting === r.id ? 'Sending…' : 'Invite'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border bg-secondary/20 px-4 py-3 pb-4">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="eyebrow">Locked for preparer self-edit:</span>
            {LOCKABLE_FIELDS.map(f => (
              <label key={f.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" checked={locked.includes(f.key)} onChange={() => toggleLock(f.key)} className="h-3.5 w-3.5 accent-primary" />
                {f.label}
              </label>
            ))}
          </div>
        </div>
        );
      })}
      <form onSubmit={create} className="mt-8 grid gap-3 border border-dashed border-border p-5 md:grid-cols-12 md:items-end">
        {PREPARER_FIELDS.map((f) => (
          <label key={f.key} className={f.span || 'md:col-span-3'}>
            <span className="eyebrow mb-1.5 block">{f.label}</span>
            <Field f={f} value={draft[f.key]} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />
          </label>
        ))}
        <button type="submit" disabled={PREPARER_FIELDS.some((f) => f.required && !draft[f.key])} className="inline-flex h-10 items-center justify-center gap-2 border border-foreground/30 px-4 text-sm disabled:opacity-30 md:col-span-2">
          <Plus className="h-4 w-4" />Add
        </button>
      </form>
    </div>
  );
}