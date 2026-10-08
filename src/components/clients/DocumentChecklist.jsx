import React from 'react';

// A "Bring Your Documents" checklist of what clients should gather to file their return.
const GROUPS = [
  {
    title: 'Identification',
    items: [
      "Photo ID (driver's license or state ID) — taxpayer & spouse",
      'Social Security cards or ITIN letters for everyone on the return',
      'Birth certificates for everyone on the return (upload in the Taxes-to-Go app)',
      'Prior-year tax return (if available)',
    ],
  },
  {
    title: 'Income documents',
    items: [
      'W-2s from every employer',
      '1099-NEC / 1099-MISC (contract or gig work)',
      '1099-K (payment apps & marketplaces)',
      '1099-R, SSA-1099 (retirement & Social Security)',
      '1099-G (unemployment)',
      'K-1s (partnership, S-corp, or trust)',
    ],
  },
  {
    title: 'Deductions & credits',
    items: [
      '1098 (mortgage interest)',
      '1098-E (student loan interest)',
      '1098-T (tuition) & education receipts',
      'Childcare expenses (provider name, address, EIN & amount paid)',
      'Receipts for charitable donations',
      'Medical expense receipts (if itemizing)',
      'Property tax & mortgage statements',
    ],
  },
  {
    title: 'Health insurance',
    items: [
      '1095-A (Marketplace coverage)',
      '1095-B / 1095-C (if applicable)',
    ],
  },
  {
    title: 'Banking',
    items: [
      'Voided check or bank routing & account number (for direct deposit)',
    ],
  },
];

export default function DocumentChecklist() {
  return (
    <div className="grid gap-px border border-border bg-border md:grid-cols-2">
      {GROUPS.map((g) => (
        <div key={g.title} className="bg-background p-8 md:p-10">
          <h3 className="font-display text-2xl">{g.title}</h3>
          <ul className="mt-5 space-y-3">
            {g.items.map((it) => (
              <li key={it} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-border" />
                <span className="text-muted-foreground">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}