import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const share = (fee, tier) => tier === '80/20' ? +(fee * 0.8).toFixed(2) : +(fee * 0.7).toFixed(2);

export default function Earnings() {
  const { me, assignments } = useOutletContext();
  const isAdmin = me?.role === 'admin';
  const myEmail = me?.email;
  const qc = useQueryClient();
  const { data: allEarnings = [] } = useQuery({ queryKey: ['earnings'], queryFn: () => base44.entities.Earning.list('-created_date', 500) });
  const earnings = myEmail ? allEarnings.filter(e => e.preparer_email === myEmail) : allEarnings;
  const [f, setF] = useState({ sel: '', fee: '', tier: '70/30' });

  const create = async (e) => {
    e.preventDefault();
    const a = assignments.find(x => x.id === f.sel);
    if (!a || !f.fee) return;
    await base44.entities.Earning.create({
      client_name: a.client_name, preparer_email: a.preparer_email, assignment_id: a.id,
      return_fee: +f.fee, tier: f.tier, preparer_share: share(+f.fee, f.tier), status: 'Pending',
    });
    setF({ sel: '', fee: '', tier: '70/30' });
    qc.invalidateQueries({ queryKey: ['earnings'] });
  };

  const pay = async (r) => {
    await base44.entities.Earning.update(r.id, { status: 'Paid', paid_date: new Date().toISOString().slice(0, 10) });
    qc.invalidateQueries({ queryKey: ['earnings'] });
  };

  const paid = earnings.filter(e => e.status === 'Paid').reduce((s, e) => s + (e.preparer_share || 0), 0);
  const pending = earnings.filter(e => e.status === 'Pending').reduce((s, e) => s + (e.preparer_share || 0), 0);

  return (
    <div>
      <h2 className="font-display text-4xl">Earnings</h2>
      <p className="mt-3 text-muted-foreground">Commission by return, based on your tier.</p>
      <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-3">
        <div className="bg-background p-6"><p className="eyebrow">Paid</p><p className="font-display text-3xl">${paid.toFixed(2)}</p></div>
        <div className="bg-background p-6"><p className="eyebrow">Pending</p><p className="font-display text-3xl">${pending.toFixed(2)}</p></div>
        <div className="bg-background p-6"><p className="eyebrow">Returns</p><p className="font-display text-3xl">{earnings.length}</p></div>
      </div>
      {isAdmin && (
        <form onSubmit={create} className="mt-6 grid gap-3 border border-border p-5 md:grid-cols-12 md:items-end">
          <label className="md:col-span-5"><span className="eyebrow mb-1.5 block">Return</span>
            <select value={f.sel} onChange={e => setF({ ...f, sel: e.target.value })} className="h-10 w-full border border-input bg-background px-2 text-sm">
              <option value="">Select client…</option>
              {assignments.map(a => <option key={a.id} value={a.id}>{a.client_name}</option>)}
            </select>
          </label>
          <label className="md:col-span-3"><span className="eyebrow mb-1.5 block">Return fee ($)</span><input type="number" value={f.fee} onChange={e => setF({ ...f, fee: e.target.value })} className="h-10 w-full border border-input bg-background px-3 text-sm" /></label>
          <label className="md:col-span-2"><span className="eyebrow mb-1.5 block">Tier</span><select value={f.tier} onChange={e => setF({ ...f, tier: e.target.value })} className="h-10 w-full border border-input bg-background px-2 text-sm"><option>70/30</option><option>80/20</option></select></label>
          <button type="submit" disabled={!f.sel || !f.fee} className="h-10 bg-primary px-4 text-sm text-primary-foreground disabled:opacity-30 md:col-span-2">Add earning</button>
        </form>
      )}
      <div className="mt-6 divide-y divide-border border border-border">
        {earnings.map(r => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div><p className="font-medium">{r.client_name}</p><p className="text-xs text-muted-foreground">Fee ${r.return_fee} · {r.tier} · share ${r.preparer_share}</p></div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${r.status === 'Paid' ? 'text-success' : 'text-muted-foreground'}`}>{r.status}{r.paid_date ? ` · ${r.paid_date}` : ''}</span>
              {isAdmin && r.status === 'Pending' && <button onClick={() => pay(r)} className="h-8 border border-foreground/30 px-3 text-xs">Mark paid</button>}
            </div>
          </div>
        ))}
        {!earnings.length && <p className="p-5 text-sm text-muted-foreground">No earnings recorded yet.</p>}
      </div>
    </div>
  );
}