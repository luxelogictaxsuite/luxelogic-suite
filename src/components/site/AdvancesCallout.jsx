import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Banknote } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AdvancesCallout({ variant = 'full' }) {
  const { data: intake } = useQuery({
    queryKey: ['intakeForm'],
    queryFn: () => base44.entities.FormDefinition.filter({ active: true, category: 'Tax Clients' }, 'sort_order', 1),
  });
  const intakeUrl = intake?.[0] ? `/form/${intake[0].id}` : '/tax-clients';
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-4 border border-primary/30 bg-primary/5 p-6">
        <Banknote className="h-8 w-8 shrink-0 text-primary" />
        <div>
          <p className="font-display text-2xl text-primary">Up to $7,500 Tax Refund Advances</p>
          <p className="mt-1 text-sm text-muted-foreground">Subject to bank approval. Ask your preparer if you qualify.</p>
        </div>
      </div>
    );
  }
  return (
    <section className="relative overflow-hidden border-b border-border bg-foreground text-background">
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 h-[32rem] w-[32rem] rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.30) 0%, transparent 70%)' }} />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-8 md:py-20">
        <div className="flex items-start gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-primary">
            <Banknote className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <p className="eyebrow text-highlight">Tax Refund Advances</p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-6xl">Up to $7,500</h2>
            <p className="mt-3 max-w-lg text-background/80">Get an advance on your refund, based on bank approval. Your preparer can tell you if you qualify when your return is ready.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3">
          <Link to={intakeUrl} className="inline-flex h-14 items-center justify-center gap-2 bg-primary px-8 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">See if You Qualify</Link>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-background/50">Subject to bank approval</p>
        </div>
      </div>
    </section>
  );
}