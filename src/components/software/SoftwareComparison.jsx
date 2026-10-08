import React from 'react';
import { Check, Minus } from 'lucide-react';

const ROWS = [
  { label: 'Base price', taxslayer: '$399', olt: '$399', sub: 'per season' },
  { label: 'Return types', taxslayer: 'Individual + Business (desktop)', olt: 'Individual + Business' },
  { label: 'All states', taxslayer: true, olt: true },
  { label: 'Free e-filing', taxslayer: true, olt: true },
  { label: 'Multiple users', taxslayer: true, olt: true },
  { label: 'Multi-office access', taxslayer: false, olt: true },
  { label: 'Mobile app', taxslayer: true, olt: false },
  { label: 'Bank product integration', taxslayer: true, olt: true },
  { label: 'Client / taxpayer portal', taxslayer: true, olt: true },
  { label: 'Electronic signatures', taxslayer: true, olt: true },
  { label: 'Document management', taxslayer: 'Mobile collection', olt: 'Full management' },
  { label: 'W-2 / 1099 import', taxslayer: false, olt: true },
  { label: 'K-1 import', taxslayer: false, olt: true },
  { label: 'Year-round support', taxslayer: true, olt: true },
];

const BEST_FOR = {
  taxslayer: 'Preparers focused on individual returns who want strong client-facing tools.',
  olt: 'Preparers who need individual and business returns in one platform.',
};

function Cell({ value, sub }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="mx-auto h-4 w-4 text-success" />
      : <Minus className="mx-auto h-4 w-4 text-muted-foreground" />;
  }
  return (
    <span className="block">
      {value}
      {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
    </span>
  );
}

export default function SoftwareComparison() {
  return (
    <div>
      <div className="border border-border">
        <div className="grid grid-cols-3 border-b border-border bg-secondary/50">
          <div className="p-4 md:p-6" />
          <div className="border-l border-border p-4 text-center md:p-6"><h3 className="font-display text-xl md:text-2xl">TaxSlayer Pro</h3></div>
          <div className="border-l border-border p-4 text-center md:p-6"><h3 className="font-display text-xl md:text-2xl">OLT Pro</h3></div>
        </div>
        {ROWS.map((row, i) => (
          <div key={row.label} className={`grid grid-cols-3 border-b border-border last:border-b-0 ${i % 2 === 1 ? 'bg-secondary/20' : ''}`}>
            <div className="p-4 text-sm font-medium md:p-5">{row.label}</div>
            <div className="border-l border-border p-4 text-center text-sm md:p-5"><Cell value={row.taxslayer} sub={row.sub} /></div>
            <div className="border-l border-border p-4 text-center text-sm md:p-5"><Cell value={row.olt} /></div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-2">
        <div className="bg-background p-6 md:p-8">
          <p className="eyebrow">TaxSlayer Pro — best for</p>
          <p className="mt-2 text-sm text-muted-foreground">{BEST_FOR.taxslayer}</p>
        </div>
        <div className="bg-background p-6 md:p-8">
          <p className="eyebrow">OLT Pro — best for</p>
          <p className="mt-2 text-sm text-muted-foreground">{BEST_FOR.olt}</p>
        </div>
      </div>
    </div>
  );
}