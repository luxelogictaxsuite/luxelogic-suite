import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MobileSelect from '@/components/ui/mobile-select';

const STATUS = ['Requested', 'Received', 'Rejected'];

export default function DocumentRequests() {
  const { assignments } = useOutletContext();
  const qc = useQueryClient();
  const { data: reqs = [] } = useQuery({ queryKey: ['docReqs'], queryFn: () => base44.entities.DocumentRequest.list('-created_date', 500) });
  const [doc, setDoc] = useState('');
  const [sel, setSel] = useState('');
  const [note, setNote] = useState('');

  const create = async (e) => {
    e.preventDefault();
    const a = assignments.find(x => x.id === sel);
    if (!a || !doc.trim()) return;
    const created = await base44.entities.DocumentRequest.create({
      client_name: a.client_name, client_email: a.client_email || '', preparer_email: a.preparer_email,
      assignment_id: a.id, document_name: doc.trim(), status: 'Requested', notes: note,
    });
    if (a.client_email) {
      try { await base44.functions.invoke('notifyPreparer', { event: 'document_requested', document_request_id: created.id }); } catch (e) { /* best-effort */ }
    }
    setDoc(''); setNote(''); setSel('');
    qc.invalidateQueries({ queryKey: ['docReqs'] });
  };

  const setStatus = async (r, s) => {
    await base44.entities.DocumentRequest.update(r.id, { status: s });
    if (s === 'Received') {
      try { await base44.functions.invoke('notifyPreparer', { event: 'document_received', document_request_id: r.id }); } catch (e) { /* best-effort */ }
    }
    qc.invalidateQueries({ queryKey: ['docReqs'] });
  };

  return (
    <div>
      <h2 className="font-display text-4xl">Client Document Requests</h2>
      <p className="mt-3 text-muted-foreground">Request missing documents from a client and track what comes back.</p>
      <form onSubmit={create} className="mt-6 grid gap-3 border border-border p-5 md:grid-cols-12 md:items-end">
        <label className="md:col-span-4"><span className="eyebrow mb-1.5 block">Return</span>
          <MobileSelect
            value={sel}
            onChange={setSel}
            options={assignments.map(a => ({ value: a.id, label: a.client_name }))}
            placeholder="Select client…"
            className="h-10 text-sm"
            label="Return"
          />
        </label>
        <label className="md:col-span-4"><span className="eyebrow mb-1.5 block">Document needed</span>
          <input value={doc} onChange={e => setDoc(e.target.value)} className="h-10 w-full border border-input bg-background px-3 text-sm" placeholder="e.g. 2025 W-2" />
        </label>
        <label className="md:col-span-3"><span className="eyebrow mb-1.5 block">Note</span>
          <input value={note} onChange={e => setNote(e.target.value)} className="h-10 w-full border border-input bg-background px-3 text-sm" />
        </label>
        <button type="submit" disabled={!sel || !doc.trim()} className="h-10 bg-primary px-4 text-sm text-primary-foreground disabled:opacity-30 md:col-span-1">Add</button>
      </form>
      <div className="mt-6 divide-y divide-border border border-border">
        {reqs.map(r => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{r.document_name}</p>
              <p className="text-xs text-muted-foreground">{r.client_name}{r.client_email ? ` · ${r.client_email}` : ''}</p>
              {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
            </div>
            <MobileSelect
              value={r.status}
              onChange={(v) => setStatus(r, v)}
              options={STATUS.map(s => ({ value: s, label: s }))}
              className="h-9 text-sm"
              label="Document Status"
            />
          </div>
        ))}
        {!reqs.length && <p className="p-5 text-sm text-muted-foreground">No document requests yet.</p>}
      </div>
    </div>
  );
}