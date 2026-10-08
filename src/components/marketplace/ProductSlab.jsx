import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import SiteLinkButton from '@/components/site/SiteLinkButton';

export default function ProductSlab({ p }) {
  const isBootcamp = p.brand === 'TaxPrepBootcamp';
  return (
    <article className={`group relative flex flex-col justify-between overflow-hidden border-2 bg-card/60 p-10 backdrop-blur transition-all duration-500 hover:shadow-2xl md:p-14 ${isBootcamp ? 'border-primary' : 'border-border hover:border-primary/50'}`}>
      {/* Gold top accent bar */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-primary transition-all duration-500 group-hover:h-2.5" />
      <div className="pointer-events-none absolute inset-0 grid-scaffold opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      {isBootcamp && (
        <div className="relative mb-4">
          <span className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            <Lock className="h-3 w-3" /> EROs with LuxeLogic Software Only
          </span>
        </div>
      )}
      <div className="relative">
        <p className="eyebrow">{p.brand}</p>
        <h3 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{p.name}</h3>
        <p className="mt-4 text-sm text-muted-foreground">{p.description}</p>
      </div>
      <div className="relative mt-12">
        <div className="flex items-end justify-between border-t-2 border-primary/20 pt-6">
          <span className="font-display text-7xl text-primary md:text-8xl">${p.price}</span>
          <span className="text-right font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {p.seats_included} seat{p.seats_included > 1 ? 's' : ''}
            {p.extra_seat_price ? <><br />+${p.extra_seat_price}/add'l seat</> : null}
          </span>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <SiteLinkButton linkKey={p.link_key} size="lg">Purchase</SiteLinkButton>
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-success"><ShieldCheck className="h-3.5 w-3.5" />Auto-assigned seats</span>
        </div>
      </div>
    </article>
  );
}