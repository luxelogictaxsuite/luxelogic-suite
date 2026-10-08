import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Per-return due diligence checklist. Standard items are seeded automatically
// the first time a preparer opens a return, then toggled as each is verified.
const STANDARD_ITEMS = [
  'Identity verified (photo ID + SSN)',
  'PTIN recorded on return',
  'EITC due diligence (Form 8867)',
  'CTC qualifying child verified',
  'Head of Household verification',
  'Banking info confirmed',
  'Prior-year AGI / PIN obtained',
  'All income documents reconciled',
  'Refund routing reviewed with client',
  'Final review & client signature',
];

export default function DueDiligence() {
  const { assignments } = useOutletContext();
  const qc = useQueryClient();
  const [open, setOpen] = useState(null);
  const { data: items = [] } = useQuery({
    queryKey: ['ddItems'],
    queryFn: () => base44.entities.DueDiligenceItem.list('sort_order', 500),
  });

  const ensure = async (a) => {
    if (items.some(i => i.assignment_id === a.id)) return;
    await base44.entities.DueDiligenceItem.bulkCreate(
      STANDARD_ITEMS.map((label, idx) => ({
        assignment_id: a.id, client_name: a.client_name, preparer_email: a.preparer_email,
        item_label: label, checked: false, sort_order: idx,
      }))
    );
    qc.invalidateQueries({ queryKey: ['ddItems'] });
  };

  const toggle = async (it) => {
    // Optimistic: flip instantly in the cache, then confirm with the server.
    qc.setQueryData(['ddItems'], (old) =>
      (old || []).map(i => i.id === it.id ? { ...i, checked: !it.checked } : i)
    );
    try {
      await base44.entities.DueDiligenceItem.update(it.id, { checked: !it.checked });
    } catch (e) {
      // Revert on failure.
      qc.setQueryData(['ddItems'], (old) =>
        (old || []).map(i => i.id === it.id ? { ...i, checked: it.checked } : i)
      );
    }
    qc.invalidateQueries({ queryKey: ['ddItems'] });
  };

  return (
    <div>
      <h2 className="font-display text-4xl">Due Diligence</h2>
      <p className="mt-3 text-muted-foreground">Per-return checklist. Complete every item before filing — EITC, CTC and HoH returns require documented due diligence.</p>
      <div className="mt-6 border border-highlight bg-highlight/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-highlight" />
          <div>
            <p className="text-sm font-medium">All client documents must be uploaded ONLY to the TaxesToGo app.</p>
            <p className="mt-1 text-xs text-muted-foreground">Do not accept documents via email, text, or any other method. Instruct every client to use the TaxesToGo app for a smoother, more secure process.</p>
          </div>
        </div>
      </div>
      <div className="mt-6 divide-y divide-border border border-border">
        {assignments.map(a => {
          const row = items.filter(i => i.assignment_id === a.id).sort((x, y) => x.sort_order - y.sort_order);
          const done = row.filter(i => i.checked).length;
          const expanded = open === a.id;
          return (
            <div key={a.id}>
              <button
                onClick={() => { const next = expanded ? null : a.id; setOpen(next); if (next) ensure(a); }}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="font-display text-xl">{a.client_name}</span>
                <span className="text-sm text-muted-foreground">{row.length ? `${done}/${row.length} complete` : 'Start checklist'}</span>
              </button>
              {expanded && row.length > 0 && (
                <ul className="space-y-2 px-5 pb-5">
                  {row.map(it => (
                    <li key={it.id}>
                      <label className="flex items-center gap-3 text-sm">
                        <input type="checkbox" checked={!!it.checked} onChange={() => toggle(it)} className="h-4 w-4 accent-primary" />
                        <span className={it.checked ? 'text-muted-foreground line-through' : ''}>{it.item_label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {!assignments.length && <p className="p-5 text-sm text-muted-foreground">No returns assigned yet.</p>}
      </div>
    </div>
  );
}