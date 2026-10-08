import React, { useState } from 'react';

const BANKS = [
  {
    name: 'Refund Advantage',
    logo: 'https://base44.app/api/apps/6ab71feb020c819bc103c46d/files/mp/public/6ab71feb020c819bc103c46d/b227775bb_refund-advantage-logo.png',
    desc: 'Refund transfer and bank product solutions for tax offices.',
    products: [
      { name: 'Refund Transfer (RT)', fee: 'Typically $25–$40 per return', detail: 'Deducted from the client\'s refund. The client receives their remaining refund via direct deposit or prepaid card.' },
      { name: 'Refund Advance', fee: 'No fee to client (0% APR)', detail: 'An advance of $250–$1,000 available at the opening of tax season. Repaid from the client\'s refund.' },
      { name: 'Prepaid Card', fee: 'No activation fee', detail: 'Client receives their refund on a prepaid Visa card. ATM and reload fees may apply.' },
    ],
  },
  {
    name: 'Santa Barbara TPG',
    logo: 'https://base44.app/api/apps/6ab71feb020c819bc103c46d/files/mp/public/6ab71feb020c819bc103c46d/57393018f_sbtpg-logo.png',
    desc: 'Refund transfer, prepaid card, and bank product solutions.',
    products: [
      { name: 'Refund Transfer', fee: 'Typically $30–$45 per return', detail: 'Also known as an RT. The client\'s tax preparation fee is deducted from their refund.' },
      { name: 'Go Prepaid Card', fee: 'No monthly fee', detail: 'Client receives their refund on a Visa prepaid card. ATM and transfer fees may apply.' },
      { name: 'Tax Refund Cash Advance', fee: 'No fee (0% APR)', detail: 'An advance available at the start of tax season, repaid from the client\'s refund.' },
    ],
  },
  {
    name: 'Republic Bank',
    logo: 'https://base44.app/api/apps/6ab71feb020c819bc103c46d/files/mp/public/6ab71feb020c819bc103c46d/d7521eee0_republic-bank-logo.webp',
    desc: 'Refund transfer and bank product solutions for tax professionals.',
    products: [
      { name: 'Refund Transfer', fee: '$44.95 per return', detail: 'Preparation fees are deducted from the client\'s refund. The client receives the net refund by direct deposit. Subsequent deposit fee: $14.' },
      { name: 'RT Basic', fee: '$19.95 per return', detail: 'The most affordable refund transfer option. Subsequent deposit fee: $10.' },
      { name: 'Refund Advance', fee: 'No fee (0% APR)', detail: 'A 0% APR advance available at the opening of tax season. Repaid from the client\'s refund.' },
    ],
  },
];

function BankCard({ bank }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="bg-background p-8 md:p-10">
      <img src={bank.logo} alt={`${bank.name} logo`} className="h-14 w-auto max-w-[200px] object-contain" />
      <h3 className="mt-5 font-display text-2xl">{bank.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{bank.desc}</p>
      <div className="mt-6 space-y-3">
        {bank.products.map((p) => (
          <div key={p.name} className="relative" onMouseEnter={() => setHovered(p.name)} onMouseLeave={() => setHovered(null)}>
            <div className="flex cursor-default items-center justify-between border border-border p-4 transition-colors hover:border-highlight">
              <span className="text-sm font-medium">{p.name}</span>
              <span className="text-sm text-muted-foreground">{p.fee}</span>
            </div>
            {hovered === p.name && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 border border-highlight bg-background p-4 shadow-xl">
                <p className="text-xs text-muted-foreground">{p.detail}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BankingPartners() {
  return (
    <div>
      <p className="mb-8 max-w-2xl text-muted-foreground">
        LuxeLogic offices can offer bank products through our trusted partners. Bank product fees are set by the bank and deducted from the client's refund — not charged by LuxeLogic. Hover any product to see fee details.
      </p>
      <div className="grid gap-px border border-border bg-border md:grid-cols-3">
        {BANKS.map((b) => <BankCard key={b.name} bank={b} />)}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Fee ranges are typical estimates and subject to change by each bank. Confirm current rates during your bank enrollment.
      </p>
    </div>
  );
}