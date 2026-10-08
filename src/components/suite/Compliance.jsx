import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Compliance() {
  const { me } = useOutletContext();
  const myEmail = me?.email;
  const { data: preparers = [] } = useQuery({ queryKey: ['suitePreparers'], queryFn: () => base44.entities.Preparer.list('name', 200) });
  const { data: assignments = [] } = useQuery({ queryKey: ['suiteAssignments'], queryFn: () => base44.entities.ClientAssignment.list('-created_date', 200) });

  // Filter to own data — admins using the Suite see only their own returns and record.
  const myPreparers = myEmail ? preparers.filter((p) => p.email === myEmail) : preparers;
  const myAssignments = myEmail ? assignments.filter((a) => a.preparer_email === myEmail) : assignments;

  const eitc = myAssignments.filter((a) => a.claims_eitc).length;
  const ctc = myAssignments.filter((a) => a.claims_ctc).length;
  const hoh = myAssignments.filter((a) => a.claims_hoh).length;

  return (
    <div>
      <h2 className="font-display text-4xl">Compliance Status</h2>
      <p className="mt-3 text-muted-foreground">Continuing education progress and credit exposure across your returns.</p>
      <div className="mt-6 divide-y divide-border border border-border">
        {myPreparers.map((p) => {
          const pct = p.ce_hours_required ? Math.min(100, Math.round((p.ce_hours_completed / p.ce_hours_required) * 100)) : 0;
          const ok = p.ce_hours_completed >= p.ce_hours_required;
          return (
            <div key={p.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl">{p.name}</p>
                <span className={`text-xs ${ok ? 'text-success' : 'text-destructive'}`}>{ok ? 'On track' : 'Behind'}</span>
              </div>
              <p className="text-xs text-muted-foreground">{p.ce_hours_completed} / {p.ce_hours_required} CE hours</p>
              <div className="mt-2 h-2 w-full bg-muted"><div className={`h-full ${ok ? 'bg-success' : 'bg-destructive'}`} style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
        {!myPreparers.length && <p className="p-5 text-sm text-muted-foreground">No preparer record found.</p>}
      </div>
      <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-3">
        <div className="bg-background p-6"><p className="eyebrow">EITC returns</p><p className="font-display text-3xl">{eitc}</p></div>
        <div className="bg-background p-6"><p className="eyebrow">CTC returns</p><p className="font-display text-3xl">{ctc}</p></div>
        <div className="bg-background p-6"><p className="eyebrow">HoH returns</p><p className="font-display text-3xl">{hoh}</p></div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Returns claiming EITC, CTC, or HoH require documented due diligence (Form 8867) — review each under Due Diligence.</p>
    </div>
  );
}