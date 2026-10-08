import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileSelect from '@/components/ui/mobile-select';

const PRIORITY = ['Low', 'Normal', 'High', 'Urgent'];
const STATUS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const CATEGORY = ['Return Question', 'Document Issue', 'Refund', 'Software', 'Billing', 'Other'];

export default function SupportTickets() {
  const { me, assignments } = useOutletContext();
  const isAdmin = me?.role === 'admin';
  const qc = useQueryClient();
  const { data: tickets = [] } = useQuery({ queryKey: ['tickets'], queryFn: () => base44.entities.SupportTicket.list('-created_date', 500) });
  const [f, setF] = useState({ subject: '', client_name: '', client_email: '', category: 'Other', priority: 'Normal', message: '' });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const create = async (e) => {
    e.preventDefault();
    if (!f.subject.trim() || !f.client_name.trim()) return;
    const prepEmail = isAdmin
      ? (assignments.find(a => a.client_name === f.client_name)?.preparer_email || '')
      : me.email;
    await base44.entities.SupportTicket.create({
      subject: f.subject, client_name: f.client_name, client_email: f.client_email,
      preparer_email: prepEmail, category: f.category, priority: f.priority, status: 'Open', message: f.message,
    });
    setF({ subject: '', client_name: '', client_email: '', category: 'Other', priority: 'Normal', message: '' });
    qc.invalidateQueries({ queryKey: ['tickets'] });
  };

  const update = async (t, patch) => {
    // Optimistic: update cache instantly for responsive UI
    qc.setQueryData(['tickets'], (old) =>
      Array.isArray(old) ? old.map(x => x.id === t.id ? { ...x, ...patch } : x) : old
    );
    try {
      await base44.entities.SupportTicket.update(t.id, patch);
    } catch (e) {
      // Revert on failure
      qc.invalidateQueries({ queryKey: ['tickets'] });
    }
    qc.invalidateQueries({ queryKey: ['tickets'] });
  };

  return (
    <div>
      <h2 className="font-display text-4xl">Support Tickets</h2>
      <p className="mt-3 text-muted-foreground">Track client questions and issues through to resolution.</p>
      <form onSubmit={create} className="mt-6 grid gap-3 border border-border p-5 md:grid-cols-12 md:items-end">
        <label className="md:col-span-4"><span className="eyebrow mb-1.5 block">Subject *</span><input value={f.subject} onChange={e => set('subject', e.target.value)} className="h-10 w-full border border-input bg-background px-3 text-sm" /></label>
        <label className="md:col-span-3"><span className="eyebrow mb-1.5 block">Client name *</span><input value={f.client_name} onChange={e => set('client_name', e.target.value)} className="h-10 w-full border border-input bg-background px-3 text-sm" /></label>
        <label className="md:col-span-3"><span className="eyebrow mb-1.5 block">Client email</span><input value={f.client_email} onChange={e => set('client_email', e.target.value)} className="h-10 w-full border border-input bg-background px-3 text-sm" /></label>
        <label className="md:col-span-2"><span className="eyebrow mb-1.5 block">Category</span>
          <MobileSelect value={f.category} onChange={(v) => set('category', v)} options={CATEGORY.map(c => ({ value: c, label: c }))} placeholder="Select…" className="h-10 text-sm" label="Category" />
        </label>
        <label className="md:col-span-2"><span className="eyebrow mb-1.5 block">Priority</span>
          <MobileSelect value={f.priority} onChange={(v) => set('priority', v)} options={PRIORITY.map(p => ({ value: p, label: p }))} placeholder="Select…" className="h-10 text-sm" label="Priority" />
        </label>
        <label className="md:col-span-8"><span className="eyebrow mb-1.5 block">Message</span><textarea value={f.message} onChange={e => set('message', e.target.value)} rows={2} className="w-full border border-input bg-background p-2 text-sm" /></label>
        <button type="submit" disabled={!f.subject.trim() || !f.client_name.trim()} className="h-10 bg-primary px-4 text-sm text-primary-foreground disabled:opacity-30 md:col-span-2">Open ticket</button>
      </form>
      <div className="mt-6 divide-y divide-border border border-border">
        {tickets.map(t => (
          <div key={t.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">{t.subject}</p>
              <span className="text-xs text-muted-foreground">{t.priority}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t.client_name}{t.client_email ? ` · ${t.client_email}` : ''} · {t.category}</p>
            {t.message && <p className="mt-2 text-sm text-muted-foreground">{t.message}</p>}
            <div className="mt-2">
              <MobileSelect value={t.status} onChange={(v) => update(t, { status: v })} options={STATUS.map(s => ({ value: s, label: s }))} className="h-8 text-xs" label="Ticket Status" />
            </div>
          </div>
        ))}
        {!tickets.length && <p className="p-5 text-sm text-muted-foreground">No support tickets.</p>}
      </div>
    </div>
  );
}