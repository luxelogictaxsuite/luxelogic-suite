import React from 'react';
import { Check } from 'lucide-react';
import SiteLinkButton from '@/components/site/SiteLinkButton';

const PLATFORMS = {
  'TaxSlayer Pro': {
    price: '$399',
    priceNote: 'per season',
    desc: 'A trusted, user-friendly option designed for tax professionals who want flexibility and a smooth client experience.',
    inclusions: [
      'Unlimited individual returns',
      'Business returns (desktop mode)',
      'All states',
      'Free e-filing',
      'Multiple-user access',
      'Mobile app',
      'Bank-product integration',
      'Client portal',
      'Electronic signatures',
      'Mobile document collection',
      'Year-round support',
    ],
    bestFor: 'Preparers who want strong client-facing tools and an easy-to-use platform. Business returns available on desktop mode.',
  },
  'OLT Pro': {
    price: '$399',
    priceNote: 'per season',
    desc: 'An affordable, all-inclusive option for preparing both individual and business tax returns.',
    inclusions: [
      'Unlimited returns (individual & business)',
      'All states',
      'Free e-filing',
      'Multiple-user and multi-office access',
      'Bank-product integration',
      'Taxpayer portal',
      'Electronic signatures',
      'Document management',
      'W-2 and 1099 importing',
      'K-1 importing',
      'Customer support',
    ],
    bestFor: 'Preparers who need individual and business return capabilities in one complete platform.',
  },
};

export default function SoftwareCard({ name, pay, demo, training }) {
  const p = PLATFORMS[name];
  if (!p) return null;
  return (
    <div className="bg-background p-8 md:p-12">
      <h3 className="font-display text-4xl md:text-5xl">{name}</h3>
      <p className="mt-3 text-muted-foreground">{p.desc}</p>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-display text-5xl">{p.price}</span>
        <span className="text-sm text-muted-foreground">{p.priceNote}</span>
      </div>
      <ul className="mt-8 space-y-3">
        {p.inclusions.map((inc) => (
          <li key={inc} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-highlight" />
            <span>{inc}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 border-t border-border pt-6">
        <p className="text-sm font-medium text-primary">Best for:</p>
        <p className="mt-1 text-sm text-muted-foreground">{p.bestFor}</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-4">
        <SiteLinkButton linkKey={pay}>Purchase</SiteLinkButton>
        <SiteLinkButton linkKey={training} variant="outline">Software Videos</SiteLinkButton>
        <SiteLinkButton linkKey={demo} variant="outline">Request a Demo</SiteLinkButton>
      </div>
    </div>
  );
}