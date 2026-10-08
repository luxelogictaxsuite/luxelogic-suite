import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, User, DollarSign, AlertTriangle, Check } from 'lucide-react';
import { syncEarningForAssignment, parseSubmissionContact } from '@/lib/earnings';
import AddReturnForm from '@/components/admin/AddReturnForm';

const STATUSES = [
  'Awaiting Documents',
  'Ready for Review',
  'In Progress',
  'Needs Correction',
  'Filed',
  'Funded',
];

const TIERS = ['70/30', '80/20'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export default function FirmReturns() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('returns');
  const [feeDrafts, setFeeDrafts] = useState({});
  const [savingFee, setSavingFee] = useState(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['firmReturns'],
    queryFn: () => base44.entities.ClientAssignment.list('-created_date', 500),
  });
  const { data: earnings = [], isLoading: earningsLoading } = useQuery({
    queryKey: ['firmEarnings'],
    queryFn: () => base44.entities.Earning.list('-created_date', 500),
  });
  const { data: preparers = [] } = useQuery({
    queryKey: ['firmPreparers'],
    queryFn: () => base44.entities.Preparer.list('name', 200),
  });
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['firmIntakeSubmissions'],
    queryFn: () => base44.entities.FormSubmission.list('-created_date', 500),
  });

  const setStatus = async (id, status) => {
    const a = assignments.find((x) => x.id === id);
    const updated = await base44.entities.ClientAssignment.update(id, { status });
    await syncEarningForAssignment({ ...a, status }, compTierFor(a?.preparer_email));
    // Let the preparer know their client was transmitted / funded.
    if (status === 'Filed' || status === 'Funded') {
      try { await base44.functions.invoke('notifyPreparer', { event: 'return_filed', assignment_id: id }); } catch (e) { /* best-effort */ }
    }
    qc.invalidateQueries({ queryKey: ['firmReturns'] });
    qc.invalidateQueries({ queryKey: ['firmEarnings'] });
  };

  const compTierFor = (email) => {
    const p = preparers.find((p) => p.email === email);
    return p?.comp_tier || '70/30';
  };

  const saveFee = async (a) => {
    const raw = feeDrafts[a.id] ?? a.return_fee ?? '';
    const fee = Number(raw) || 0;
    setSavingFee(a.id);
    try {
      const updated = { ...a, return_fee: fee };
      await base44.entities.ClientAssignment.update(a.id, { return_fee: fee });
      await syncEarningForAssignment(updated, compTierFor(a.preparer_email));
      setFeeDrafts((d) => { const n = { ...d }; delete n[a.id]; return n; });
      qc.invalidateQueries({ queryKey: ['firmReturns'] });
      qc.invalidateQueries({ queryKey: ['firmEarnings'] });
    } catch (e) { /* best-effort */ }
    setSavingFee(null);
  };

  const byStatus = (s) => assignments.filter((a) => (a.status || 'Awaiting Documents') === s);
  const readyForReview = byStatus('Ready for Review').sort((a, b) => {
    const da = a.review_requested_date ? new Date(a.review_requested_date).getTime() : 0;
    const db = b.review_requested_date ? new Date(b.review_requested_date).getTime() : 0;
    return db - da;
  });

  // ---- Earnings calculations ----
  const prepNameByEmail = (email) => preparers.find((p) => p.email === email)?.name || email;
  const totalRevenue = earnings.reduce((s, e) => s + (e.return_fee || 0), 0);
  const totalPreparerShare = earnings.reduce((s, e) => s + (e.preparer_share || 0), 0);
  const firmShare = totalRevenue - totalPreparerShare;
  const pendingAmount = earnings.filter((e) => e.status === 'Pending').reduce((s, e) => s + (e.preparer_share || 0), 0);
  const paidAmount = earnings.filter((e) => e.status === 'Paid').reduce((s, e) => s + (e.preparer_share || 0), 0);
  const byTier = (tier) => earnings.filter((e) => (e.tier || '70/30') === tier);
  const tierRevenue = (tier) => byTier(tier).reduce((s, e) => s + (e.return_fee || 0), 0);
  const tierPreparerShare = (tier) => byTier(tier).reduce((s, e) => s + (e.preparer_share || 0), 0);
  const prepBreakdown = (tier) => {
    const map = {};
    byTier(tier).forEach((e) => {
      const key = e.preparer_email || '—';
      if (!map[key]) map[key] = { name: prepNameByEmail(key), count: 0, revenue: 0, preparerShare: 0, pending: 0, paid: 0 };
      map[key].count += 1;
      map[key].revenue += e.return_fee || 0;
      map[key].preparerShare += e.preparer_share || 0;
      if (e.status === 'Pending') map[key].pending += e.preparer_share || 0;
      if (e.status === 'Paid') map[key].paid += e.preparer_share || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  };

  // ---- Intake submissions ----
  const submissionRows = submissions.map((s) => {
    const c = parseSubmissionContact(s.submission_data);
    return { id: s.id, formName: s.form_name || 'Form', name: c.name, email: c.email, phone: c.phone, date: s.created_date, status: s.status };
  });
  // Check which submissions have been assigned to a preparer already.
  const assignedEmails = new Set(assignments.map((a) => a.client_email?.toLowerCase()).filter(Boolean));
  const assignedNames = new Set(assignments.map((a) => a.client_name?.toLowerCase()).filter(Boolean));
  const isAssigned = (row) =>
    (row.email && assignedEmails.has(row.email.toLowerCase())) ||
    (row.name && assignedNames.has(row.name.toLowerCase()));

  const feeValue = (a) => feeDrafts[a.id] ?? a.return_fee ?? '';
  const feeInput = (a) => (
    <div className="mt-2 border-t border-border pt-2">
      <label className="eyebrow mb-1 block">Return fee $</label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          step="0.01"
          value={feeValue(a)}
          onChange={(e) => setFeeDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
          placeholder="0.00"
          className="h-8 w-full border border-input bg-transparent px-2 text-xs"
        />
        <button
          onClick={() => saveFee(a)}
          disabled={savingFee === a.id || feeValue(a) === (a.return_fee ?? '')}
          className="inline-flex h-8 items-center justify-center border border-primary bg-primary/5 px-2 text-xs text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-30"
        >
          {savingFee === a.id ? '…' : <Check className="h-3.5 w-3.5" />}
        </button>
      </div>
      {!!a.return_fee && (
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          ${Number(a.return_fee).toFixed(2)} · {compTierFor(a.preparer_email)} share ${(a.return_fee * (compTierFor(a.preparer_email) === '80/20' ? 0.80 : 0.70)).toFixed(2)}
        </p>
      )}
    </div>
  );

  return (
    <div>
      <h2 className="font-display text-4xl">Firm Returns Dashboard</h2>
      <p className="mt-3 text-muted-foreground">
        Every preparer's returns across the firm. Enter return fees to sync earnings — filed returns without a fee are flagged.
      </p>

      {/* Internal sub-tabs: Returns | Earnings | Intake */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {['returns', 'earnings', 'intake'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm capitalize transition ${tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'intake' ? 'Intake Submissions' : t}
          </button>
        ))}
      </div>

      {tab === 'returns' && (
        <>
          <div className="mt-6">
            <AddReturnForm preparers={preparers} />
          </div>
          {readyForReview.length > 0 && (
            <div className="mt-8 border border-highlight/40 bg-highlight/5 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-highlight" />
                <h3 className="font-display text-2xl">Needs Your Review ({readyForReview.length})</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {readyForReview.map((a) => (
                  <div key={a.id} className="border border-border bg-background p-4">
                    <p className="font-medium">{a.client_name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="h-3 w-3" /> {a.preparer_name || a.preparer_email}
                    </p>
                    {a.review_requested_date && (
                      <p className="mt-1 font-mono text-[10px] text-highlight">
                        Submitted {new Date(a.review_requested_date).toLocaleString()}
                      </p>
                    )}
                    {feeInput(a)}
                    <select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)} className="mt-3 h-8 w-full rounded-none border border-input bg-transparent px-2 text-xs">
                      {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      const needsFeeFlag = (a.status === 'Filed' || a.status === 'Funded') && !a.return_fee;
                      return (
                        <div key={a.id} className="border border-border bg-background p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm leading-tight">{a.client_name}</p>
                            {needsFeeFlag && (
                              <span className="inline-flex items-center gap-1 bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-destructive" title="Enter the return fee">
                                <AlertTriangle className="h-2.5 w-2.5" />Fee
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{a.preparer_name || a.preparer_email}</p>
                          {a.review_requested_date && a.status === 'Ready for Review' && (
                            <p className="mt-1 font-mono text-[10px] text-highlight">{new Date(a.review_requested_date).toLocaleDateString()}</p>
                          )}
                          {feeInput(a)}
                          <select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)} className="mt-2 h-8 w-full rounded-none border border-input bg-transparent px-1 text-xs">
                            {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </div>
                      );
                    })}
                    {!byStatus(s).length && <p className="py-2 text-center text-xs text-muted-foreground">—</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading…</p>}
        </>
      )}

      {tab === 'earnings' && (
        <div className="mt-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="border border-border bg-secondary/30 p-5">
              <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4" /><span className="eyebrow">Total Revenue</span></div>
              <p className="mt-2 font-display text-3xl">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="mt-1 text-xs text-muted-foreground">{earnings.length} return{earnings.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="border border-border bg-secondary/30 p-5">
              <div className="flex items-center gap-2 text-muted-foreground"><span className="eyebrow">Firm Share</span></div>
              <p className="mt-2 font-display text-3xl">${firmShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="mt-1 text-xs text-muted-foreground">Across all tiers</p>
            </div>
            <div className="border border-border bg-secondary/30 p-5">
              <div className="flex items-center gap-2 text-muted-foreground"><span className="eyebrow">Preparer Share</span></div>
              <p className="mt-2 font-display text-3xl">${totalPreparerShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p className="mt-1 text-xs text-muted-foreground">Paid: ${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} · Pending: ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="border border-border bg-secondary/30 p-5">
              <div className="flex items-center gap-2 text-muted-foreground"><span className="eyebrow">Returns Filed</span></div>
              <p className="mt-2 font-display text-3xl">{byStatus('Filed').length + byStatus('Funded').length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Filed + Funded</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {TIERS.map((tier) => {
              const rows = prepBreakdown(tier);
              const rev = tierRevenue(tier);
              const prepShare = tierPreparerShare(tier);
              const firm = rev - prepShare;
              return (
                <div key={tier} className="border border-border">
                  <div className="flex items-center justify-between border-b border-border bg-primary px-5 py-3 text-primary-foreground">
                    <h3 className="font-display text-2xl">Tier {tier}</h3>
                    <span className="font-mono text-xs">{byTier(tier).length} return{byTier(tier).length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
                    <div className="p-3"><p className="eyebrow">Revenue</p><p className="mt-1 font-mono text-sm">${rev.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                    <div className="p-3"><p className="eyebrow">Firm</p><p className="mt-1 font-mono text-sm">${firm.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                    <div className="p-3"><p className="eyebrow">Preparers</p><p className="mt-1 font-mono text-sm">${prepShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                  </div>
                  <div className="divide-y divide-border">
                    {rows.map((r) => (
                      <div key={r.name} className="flex flex-wrap items-center justify-between gap-2 p-4">
                        <div>
                          <p className="font-medium text-sm">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.count} return{r.count !== 1 ? 's' : ''} · Paid ${r.paid.toLocaleString('en-US', { minimumFractionDigits: 2 })} · Pending ${r.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm">${r.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          <p className="text-xs text-muted-foreground">share ${r.preparerShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    ))}
                    {!rows.length && <p className="p-5 text-sm text-muted-foreground">No earnings in this tier yet.</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {earningsLoading && <p className="mt-4 text-sm text-muted-foreground">Loading earnings…</p>}
        </div>
      )}

      {tab === 'intake' && (
        <div className="mt-8">
          <p className="mb-4 text-sm text-muted-foreground">Every client who submitted the intake form. Green check = already assigned to a preparer.</p>
          {submissionsLoading ? (
            <div className="h-40 animate-pulse bg-card" />
          ) : submissionRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No intake submissions yet.</p>
          ) : (
            <div className="border border-border">
              <div className="hidden grid-cols-12 gap-3 border-b border-border bg-secondary/30 px-4 py-2 md:grid">
                <span className="eyebrow col-span-3">Client</span>
                <span className="eyebrow col-span-3">Email</span>
                <span className="eyebrow col-span-2">Phone</span>
                <span className="eyebrow col-span-2">Form</span>
                <span className="eyebrow col-span-1">Submitted</span>
                <span className="eyebrow col-span-1">Assigned</span>
              </div>
              <div className="divide-y divide-border">
                {submissionRows.map((r) => {
                  const assigned = isAssigned(r);
                  return (
                    <div key={r.id} className="grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-12 md:gap-3 md:py-2">
                      <p className="font-medium text-sm md:col-span-3">{r.name || '—'}</p>
                      <p className="text-sm text-muted-foreground md:col-span-3">{r.email || '—'}</p>
                      <p className="text-sm text-muted-foreground md:col-span-2">{r.phone || '—'}</p>
                      <p className="text-xs text-muted-foreground md:col-span-2">{r.formName}</p>
                      <p className="text-xs text-muted-foreground md:col-span-1">{fmtDate(r.date)}</p>
                      <p className="md:col-span-1">
                        {assigned
                          ? <span className="inline-flex items-center gap-1 text-success"><Check className="h-3.5 w-3.5" /></span>
                          : <span className="font-mono text-[10px] text-muted-foreground">—</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}