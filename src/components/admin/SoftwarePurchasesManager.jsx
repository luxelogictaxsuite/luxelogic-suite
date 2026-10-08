import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Gift, Loader2, CreditCard, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RecordRow from '@/components/admin/RecordRow';
import { PURCHASE_FIELDS } from '@/components/admin/adminConfig';

const SOFTWARE_OPTIONS = ['TaxSlayer Pro', 'OLT Pro', 'Both', '70/30 Membership'];

// Software purchase leads from the public onboarding form.
// Each lead can be marked as paid manually (cash/check/Zelle) or gifted for free —
// both trigger the same fulfillment as a Stripe payment: CRM Member profile +
// registration email + admin notification.
export default function SoftwarePurchasesManager() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['purchases'], queryFn: () => base44.entities.SoftwarePurchase.list('-created_date', 200) });
  const [busy, setBusy] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newPurchase, setNewPurchase] = useState({ full_name: '', email: '', phone: '', software: 'TaxSlayer Pro', efin: '', office_size: '', notes: '' });

  const addPurchase = async () => {
    if (!newPurchase.full_name.trim() || !newPurchase.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    setAdding(true);
    try {
      await base44.entities.SoftwarePurchase.create({ ...newPurchase, status: 'New' });
      toast.success('Purchase added');
      setNewPurchase({ full_name: '', email: '', phone: '', software: 'TaxSlayer Pro', efin: '', office_size: '', notes: '' });
      setShowAdd(false);
      qc.invalidateQueries({ queryKey: ['purchases'] });
    } catch (e) {
      toast.error(e.message || 'Could not add purchase');
    }
    setAdding(false);
  };

  const save = async (id, values) => {
    await base44.entities.SoftwarePurchase.update(id, values);
    toast.success('Saved');
    qc.invalidateQueries({ queryKey: ['purchases'] });
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this purchase?')) return;
    await base44.entities.SoftwarePurchase.delete(id);
    qc.invalidateQueries({ queryKey: ['purchases'] });
  };

  const markPaid = async (r, method) => {
    setBusy(r.id + method);
    try {
      const res = await base44.functions.invoke('markSoftwarePaid', { purchase_id: r.id, payment_method: method });
      const f = res.data?.fulfillment;
      if (res.data?.skipped) {
        toast.info(`Already marked as paid (${res.data.payment_method})`);
      } else if (f?.fulfilled) {
        const crmStatus = f.crmMember?.ok ? `CRM member ${f.crmMember.action}` : 'CRM push failed';
        toast.success(`Marked as ${method === 'Free' ? 'free' : 'paid'} — registration email sent · ${crmStatus}`);
      } else {
        toast.error('Fulfillment issue: ' + (f?.error || res.data?.error || 'unknown'));
      }
    } catch (e) {
      toast.error(e.message || 'Could not mark as paid');
    }
    setBusy(null);
    qc.invalidateQueries({ queryKey: ['purchases'] });
  };

  if (isLoading) return <div className="h-40 animate-pulse bg-card" />;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <p className="max-w-3xl text-sm text-muted-foreground">Software purchases from the Software page onboarding form. Submissions come through regardless of payment. Click <strong>Mark Paid</strong> when you receive payment outside Stripe, or <strong>Mark Free</strong> for gifted licenses — both auto-create the CRM Member profile and send the registration form email. Stripe purchases are auto-marked as paid via webhook.</p>
        <button onClick={() => setShowAdd(!showAdd)} className="inline-flex h-9 shrink-0 items-center gap-2 border border-foreground/30 px-4 text-sm transition hover:border-highlight hover:text-highlight">
          <Plus className="h-4 w-4" /> Add Purchase
        </button>
      </div>
      {showAdd && (
        <div className="mb-8 border border-border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="eyebrow">Full Name *</Label>
              <Input value={newPurchase.full_name} onChange={e => setNewPurchase({ ...newPurchase, full_name: e.target.value })} className="mt-2 h-10 rounded-none bg-transparent" />
            </div>
            <div>
              <Label className="eyebrow">Email *</Label>
              <Input type="email" value={newPurchase.email} onChange={e => setNewPurchase({ ...newPurchase, email: e.target.value })} className="mt-2 h-10 rounded-none bg-transparent" />
            </div>
            <div>
              <Label className="eyebrow">Phone</Label>
              <Input value={newPurchase.phone} onChange={e => setNewPurchase({ ...newPurchase, phone: e.target.value })} className="mt-2 h-10 rounded-none bg-transparent" />
            </div>
            <div>
              <Label className="eyebrow">Software</Label>
              <select value={newPurchase.software} onChange={e => setNewPurchase({ ...newPurchase, software: e.target.value })} className="mt-2 h-10 w-full border border-input bg-background px-3 text-sm">
                {SOFTWARE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <Label className="eyebrow">EFIN</Label>
              <Input value={newPurchase.efin} onChange={e => setNewPurchase({ ...newPurchase, efin: e.target.value })} className="mt-2 h-10 rounded-none bg-transparent" />
            </div>
            <div>
              <Label className="eyebrow">Office Size</Label>
              <Input value={newPurchase.office_size} onChange={e => setNewPurchase({ ...newPurchase, office_size: e.target.value })} className="mt-2 h-10 rounded-none bg-transparent" />
            </div>
          </div>
          <div className="mt-4">
            <Label className="eyebrow">Notes</Label>
            <Input value={newPurchase.notes} onChange={e => setNewPurchase({ ...newPurchase, notes: e.target.value })} className="mt-2 h-10 rounded-none bg-transparent" />
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={addPurchase} disabled={adding} className="inline-flex h-10 items-center gap-2 bg-primary px-6 text-sm text-primary-foreground disabled:opacity-40">
              {adding && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </button>
            <button onClick={() => setShowAdd(false)} className="inline-flex h-10 items-center border border-border px-6 text-sm">Cancel</button>
          </div>
        </div>
      )}
      {data.map((r) => {
        const isBusy = busy === r.id + 'Manual' || busy === r.id + 'Free';
        return (
        <div key={r.id + r.updated_date} className="border-b border-border">
          <RecordRow record={r} fields={PURCHASE_FIELDS} onSave={save} onDelete={remove} />
          <div className="flex flex-wrap items-center gap-3 pb-4">
            {r.paid ? (
              <span className="inline-flex items-center gap-2 border border-success/40 bg-success/10 px-3 py-1.5 text-sm text-success">
                <Check className="h-3.5 w-3.5" /> Paid{r.payment_method ? ` · ${r.payment_method}` : ''}{r.amount_paid ? ` · $${r.amount_paid}` : ''}
              </span>
            ) : (
              <>
                <button onClick={() => markPaid(r, 'Manual')} disabled={isBusy} className="inline-flex h-9 items-center gap-2 border border-foreground/30 px-3 text-sm disabled:opacity-30">
                  {busy === r.id + 'Manual' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}Mark Paid
                </button>
                <button onClick={() => markPaid(r, 'Free')} disabled={isBusy} className="inline-flex h-9 items-center gap-2 border border-foreground/30 px-3 text-sm disabled:opacity-30">
                  {busy === r.id + 'Free' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gift className="h-3.5 w-3.5" />}Mark Free
                </button>
              </>
            )}
            <span className="text-xs text-muted-foreground">{r.email}</span>
          </div>
        </div>
        );
      })}
    </div>
  );
}