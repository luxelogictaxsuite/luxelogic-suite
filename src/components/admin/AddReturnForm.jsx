import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { syncEarningForAssignment } from '@/lib/earnings';

const STATUSES = [
  'Awaiting Documents', 'Ready for Review', 'In Progress',
  'Needs Correction', 'Filed', 'Funded',
];

const EMPTY = {
  preparer_email: '', client_name: '', client_email: '', client_phone: '',
  status: 'Awaiting Documents', return_fee: '', filing_status: '',
  claims_eitc: false, claims_ctc: false, claims_hoh: false, notes: '',
};

export default function AddReturnForm({ preparers }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.preparer_email || !form.client_name) {
      toast.error('Preparer and client name are required.');
      return;
    }
    setSaving(true);
    const prep = preparers.find(p => p.email === form.preparer_email);
    const fee = Number(form.return_fee) || 0;
    const payload = {
      preparer_email: form.preparer_email,
      preparer_name: prep?.name || '',
      client_name: form.client_name,
      client_email: form.client_email,
      client_phone: form.client_phone,
      status: form.status,
      return_fee: fee,
      filing_status: form.filing_status,
      claims_eitc: form.claims_eitc,
      claims_ctc: form.claims_ctc,
      claims_hoh: form.claims_hoh,
      notes: form.notes,
    };
    try {
      const created = await base44.entities.ClientAssignment.create(payload);
      await syncEarningForAssignment({ ...created, ...payload }, prep?.comp_tier || '70/30');
      qc.invalidateQueries({ queryKey: ['firmReturns'] });
      qc.invalidateQueries({ queryKey: ['firmEarnings'] });
      toast.success(`Return added for ${form.client_name}.`);
      setForm(EMPTY);
      setOpen(false);
    } catch (e) {
      toast.error('Could not save: ' + (e.message || 'unknown error'));
    }
    setSaving(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 border border-primary bg-primary/5 px-4 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground">
        <Plus className="h-4 w-4" /> Add Return
      </button>
    );
  }

  return (
    <div className="border border-primary/30 bg-secondary/20 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl">Add Return</h3>
        <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label>
          <span className="eyebrow mb-1 block">Preparer *</span>
          <select value={form.preparer_email} onChange={e => set('preparer_email', e.target.value)} className="h-10 w-full border border-input bg-transparent px-2 text-sm">
            <option value="">Select…</option>
            {preparers.map(p => <option key={p.id} value={p.email}>{p.name}</option>)}
          </select>
        </label>
        <label>
          <span className="eyebrow mb-1 block">Client Name *</span>
          <input value={form.client_name} onChange={e => set('client_name', e.target.value)} className="h-10 w-full border border-input bg-transparent px-2 text-sm" />
        </label>
        <label>
          <span className="eyebrow mb-1 block">Client Email</span>
          <input value={form.client_email} onChange={e => set('client_email', e.target.value)} className="h-10 w-full border border-input bg-transparent px-2 text-sm" />
        </label>
        <label>
          <span className="eyebrow mb-1 block">Client Phone</span>
          <input value={form.client_phone} onChange={e => set('client_phone', e.target.value)} className="h-10 w-full border border-input bg-transparent px-2 text-sm" />
        </label>
        <label>
          <span className="eyebrow mb-1 block">Status</span>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="h-10 w-full border border-input bg-transparent px-2 text-sm">
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          <span className="eyebrow mb-1 block">Return Fee $</span>
          <input type="number" min="0" step="0.01" value={form.return_fee} onChange={e => set('return_fee', e.target.value)} placeholder="0.00" className="h-10 w-full border border-input bg-transparent px-2 text-sm" />
        </label>
        <label>
          <span className="eyebrow mb-1 block">Filing Status</span>
          <input value={form.filing_status} onChange={e => set('filing_status', e.target.value)} placeholder="Single, MFJ, etc." className="h-10 w-full border border-input bg-transparent px-2 text-sm" />
        </label>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.claims_eitc} onChange={e => set('claims_eitc', e.target.checked)} className="h-4 w-4 accent-primary" /> EITC</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.claims_ctc} onChange={e => set('claims_ctc', e.target.checked)} className="h-4 w-4 accent-primary" /> CTC</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.claims_hoh} onChange={e => set('claims_hoh', e.target.checked)} className="h-4 w-4 accent-primary" /> HOH</label>
        </div>
      </div>
      <label className="mt-4 block">
        <span className="eyebrow mb-1 block">Notes</span>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full border border-input bg-transparent p-2 text-sm" />
      </label>
      <button onClick={save} disabled={saving} className="mt-4 inline-flex h-11 items-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-30">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save Return
      </button>
    </div>
  );
}