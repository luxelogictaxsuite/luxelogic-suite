import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowRight, AlertTriangle, Check } from 'lucide-react';
import { syncEarningForAssignment } from '@/lib/earnings';
import MobileSelect from '@/components/ui/mobile-select';

const STATUSES = [
  'Awaiting Documents',
  'Ready for Review',
  'In Progress',
  'Needs Correction',
  'Filed',
  'Funded',
];

export default function ReturnQueue() {
  const { me, assignments } = useOutletContext();
  const myEmail = me?.email;
  const isAdmin = me?.role === 'admin';
  // Only the office (admin) moves a return into or out of Filed/Funded; the
  // database enforces this too. Preparers see those stages but can't pick them.
  const statusOptionsFor = (current) => STATUSES
    .filter((st) => isAdmin || !['Filed', 'Funded'].includes(st) || st === current)
    .map((st) => ({ value: st, label: st, disabled: !isAdmin && ['Filed', 'Funded'].includes(st) }));
  const qc = useQueryClient();
  // Load this preparer's record to get their comp tier for earning calculations.
  const { data: myPreparerRows = [] } = useQuery({
    queryKey: ['myPreparerRecord', myEmail],
    queryFn: () => base44.entities.Preparer.filter({ email: myEmail }),
    enabled: !!myEmail,
  });
  const compTier = myPreparerRows[0]?.comp_tier || '70/30';

  const [feeDrafts, setFeeDrafts] = useState({});
  const [savingFee, setSavingFee] = useState(null);

  const setStatus = async (id, status) => {
    const a = assignments.find((x) => x.id === id);
    // Optimistic: update cache instantly for responsive UI
    qc.setQueryData(['myAssignments', myEmail], (old) =>
      Array.isArray(old) ? old.map(a => a.id === id ? { ...a, status } : a) : old
    );
    try {
      await base44.entities.ClientAssignment.update(id, { status });
      await syncEarningForAssignment({ ...a, status }, compTier);
      if (status === 'Needs Correction') {
        try { await base44.functions.invoke('notifyPreparer', { event: 'needs_correction', assignment_id: id }); } catch (e) { /* best-effort */ }
      }
    } catch (e) {
      // Revert on failure
      qc.invalidateQueries({ queryKey: ['myAssignments', myEmail] });
    }
    qc.invalidateQueries({ queryKey: ['myAssignments', myEmail] });
    qc.invalidateQueries({ queryKey: ['earnings'] });
  };

  const markForReview = async (a) => {
    // Optimistic: update cache instantly
    const now = new Date().toISOString();
    qc.setQueryData(['myAssignments', myEmail], (old) =>
      Array.isArray(old) ? old.map(x => x.id === a.id ? { ...x, status: 'Ready for Review', review_requested_date: now } : x) : old
    );
    try {
      await base44.entities.ClientAssignment.update(a.id, {
        status: 'Ready for Review',
        review_requested_date: now,
      });
      await syncEarningForAssignment({ ...a, status: 'Ready for Review' }, compTier);
      try { await base44.functions.invoke('notifyPreparer', { event: 'ready_for_review', assignment_id: a.id }); } catch (e) { /* best-effort */ }
    } catch (e) {
      qc.invalidateQueries({ queryKey: ['myAssignments', myEmail] });
    }
    qc.invalidateQueries({ queryKey: ['myAssignments', myEmail] });
    qc.invalidateQueries({ queryKey: ['earnings'] });
  };

  const saveFee = async (a) => {
    const raw = feeDrafts[a.id] ?? a.return_fee ?? '';
    const fee = Number(raw) || 0;
    setSavingFee(a.id);
    try {
      const updated = { ...a, return_fee: fee };
      await base44.entities.ClientAssignment.update(a.id, { return_fee: fee });
      await syncEarningForAssignment(updated, compTier);
      setFeeDrafts((d) => { const n = { ...d }; delete n[a.id]; return n; });
      qc.invalidateQueries({ queryKey: ['myAssignments', myEmail] });
      qc.invalidateQueries({ queryKey: ['earnings'] });
    } catch (e) { /* best-effort */ }
    setSavingFee(null);
  };

  const byStatus = (s) => assignments.filter((a) => (a.status || 'Awaiting Documents') === s);

  return (
    <div>
      <h2 className="font-display text-4xl">Return Queue</h2>
      <p className="mt-3 text-muted-foreground">
        Track every client return. Enter the fee you charged before filing — it flows into your Earnings automatically. Returns marked Filed or Funded without a fee are flagged.
      </p>
      <div className="mt-8 overflow-x-auto">
        <div className="grid min-w-[1100px] gap-4 lg:grid-cols-6 lg:min-w-0">
          {STATUSES.map((s) => (
            <div key={s} className="border border-border bg-secondary/30 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em]">{s}</h3>
                <span className="font-mono text-[10px] text-muted-foreground">{byStatus(s).length}</span>
              </div>
              <div className="space-y-3">
                {byStatus(s).map((a) => {
                  const canReview = a.status !== 'Ready for Review' && a.status !== 'Filed' && a.status !== 'Funded';
                  const needsFeeFlag = (a.status === 'Filed' || a.status === 'Funded') && !a.return_fee;
                  const feeValue = feeDrafts[a.id] ?? a.return_fee ?? '';
                  return (
                    <div key={a.id} className="border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm leading-tight">{a.client_name}</p>
                        {needsFeeFlag && (
                          <span className="inline-flex items-center gap-1 bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-destructive" title="Enter the return fee before filing">
                            <AlertTriangle className="h-2.5 w-2.5" />Fee
                          </span>
                        )}
                      </div>
                      {a.client_email && <p className="mt-1 text-xs text-muted-foreground">{a.client_email}</p>}
                      {a.client_phone && <p className="text-xs text-muted-foreground">{a.client_phone}</p>}
                      {a.review_requested_date && a.status === 'Ready for Review' && (
                        <p className="mt-1 font-mono text-[10px] text-highlight">
                          Submitted {new Date(a.review_requested_date).toLocaleDateString()}
                        </p>
                      )}

                      {/* Fee entry */}
                      <div className="mt-2 border-t border-border pt-2">
                        <label className="eyebrow mb-1 block">Return fee $</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={feeValue}
                            onChange={(e) => setFeeDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
                            placeholder="0.00"
                            className="h-8 w-full border border-input bg-transparent px-2 text-xs"
                          />
                          <button
                            onClick={() => saveFee(a)}
                            disabled={savingFee === a.id || feeValue === (a.return_fee ?? '')}
                            className="inline-flex h-8 items-center justify-center border border-primary bg-primary/5 px-2 text-xs text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-30"
                          >
                            {savingFee === a.id ? '…' : <Check className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        {!!a.return_fee && (
                          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                            ${Number(a.return_fee).toFixed(2)} · {compTier} share ${((a.return_fee) * (compTier === '80/20' ? 0.80 : 0.70)).toFixed(2)}
                          </p>
                        )}
                      </div>

                      {canReview && (
                        <button
                          onClick={() => markForReview(a)}
                          className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1 border border-primary bg-primary/5 text-xs text-primary transition hover:bg-primary hover:text-primary-foreground"
                        >
                          Mark for Review <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                      <div className="mt-2">
                        <MobileSelect
                          value={a.status}
                          onChange={(v) => setStatus(a.id, v)}
                          options={statusOptionsFor(a.status)}
                          className="h-8 text-xs"
                          label="Return Status"
                        />
                      </div>
                    </div>
                  );
                })}
                {!byStatus(s).length && <p className="py-2 text-center text-xs text-muted-foreground">—</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}