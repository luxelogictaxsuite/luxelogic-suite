import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useSiteLinks } from '@/hooks/useSiteData';

function Cell({ num, title, desc, children }) {
  return (
    <div className="group flex h-full flex-col justify-between gap-10 p-8 transition-colors hover:bg-card">
      <span className="font-mono text-xs text-muted-foreground">{num}</span>
      <div>
        <h3 className="font-display text-3xl">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export default function QuickLinksRow() {
  const { links } = useSiteLinks();
  const ext = (key, text) => (
    <a href={links[key]?.url || 'https://www.irs.gov'} title={links[key]?.label} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
      {text} <ArrowUpRight className="h-4 w-4" />
    </a>
  );
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-7xl divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        <Cell num="Q/01" title="Where's My Refund" desc="Track your federal refund status directly with the IRS.">{ext('wheres_my_refund', 'Check status')}</Cell>
        <Cell num="Q/02" title="Refund Estimator" desc="Get a rough federal refund estimate in under a minute.">
          <Link to="/tax-clients#estimator" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">Estimate now <ArrowRight className="h-4 w-4" /></Link>
        </Cell>
        <Cell num="Q/03" title="Withholding Estimator" desc="Make sure your paycheck withholding is set right for next year.">{ext('withholding_estimator', 'Check withholding')}</Cell>
      </div>
    </section>
  );
}