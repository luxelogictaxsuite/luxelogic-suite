import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { estimateRefund } from '@/lib/refundEstimate';
import SiteLinkButton from '@/components/site/SiteLinkButton';

const STATUSES = [
  ['single', 'Single'],
  ['mfj', 'Married Filing Jointly'],
  ['mfs', 'Married Filing Separately'],
  ['hoh', 'Head of Household'],
  ['qss', 'Qualifying Surviving Spouse'],
];
const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function RefundCalculator() {
  const [f, setF] = useState({ status: 'single', income: '', dependents: '0', withheld: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ready = f.income !== '' && f.withheld !== '';
  const r = ready && estimateRefund({ status: f.status, income: +f.income, dependents: +f.dependents, withheld: +f.withheld });

  return (
    <div className="grid gap-px border border-border bg-border md:grid-cols-2">
      <div className="space-y-6 bg-background p-6 md:p-10">
        <div>
          <Label className="eyebrow">Filing status</Label>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {STATUSES.map(([v, l]) => (
              <button key={v} type="button" onClick={() => setF({ ...f, status: v })} className={`border px-3 py-3 text-left text-sm transition ${f.status === v ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/40'}`}>{l}</button>
            ))}
          </div>
        </div>
        {[['income', 'Total annual income (W-2 wages, etc.)'], ['withheld', 'Federal tax withheld (W-2 box 2)']].map(([k, l]) => (
          <div key={k}>
            <Label htmlFor={k} className="eyebrow">{l}</Label>
            <Input id={k} type="number" min="0" inputMode="numeric" placeholder="0" value={f[k]} onChange={set(k)} className="mt-3 h-12 rounded-none bg-transparent text-lg" />
          </div>
        ))}
        <div>
          <Label htmlFor="dependents" className="eyebrow">Qualifying children under 17</Label>
          <Input id="dependents" type="number" min="0" max="10" value={f.dependents} onChange={set('dependents')} className="mt-3 h-12 rounded-none bg-transparent text-lg" />
        </div>
      </div>
      <div className="flex flex-col justify-between bg-card p-6 md:p-10">
        <div>
          <p className="eyebrow">{!r ? 'Your estimate' : r.result >= 0 ? 'Estimated refund' : 'Estimated amount owed'}</p>
          <p className={`mt-4 font-display text-7xl tabular-nums md:text-8xl ${r && r.result >= 0 ? 'text-primary' : r ? 'text-destructive' : 'text-muted-foreground'}`}>
            {r ? fmt(Math.abs(r.result)) : '$—'}
          </p>
          {r && (
            <dl className="mt-8 space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
              <div className="flex justify-between"><dt>Taxable income</dt><dd className="text-foreground">{fmt(r.taxable)}</dd></div>
              <div className="flex justify-between"><dt>Tax after child credit</dt><dd className="text-foreground">{fmt(r.liability)}</dd></div>
            </dl>
          )}
        </div>
        <div className="mt-10">
          <p className="mb-5 text-xs text-muted-foreground">A rough federal estimate using 2026 IRS brackets, the standard deduction, and Child Tax Credit only. Your actual result may differ.</p>
          <SiteLinkButton linkKey="client_intake_form">Start My Return</SiteLinkButton>
        </div>
      </div>
    </div>
  );
}