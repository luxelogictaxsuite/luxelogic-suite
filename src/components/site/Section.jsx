import React from 'react';
import Reveal from '@/components/site/Reveal';

export default function Section({ id, num, eyebrow, title, intro, children, className = '' }) {
  return (
    <section id={id} className={`relative scroll-mt-28 border-b border-border ${className}`}>
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-24 -translate-x-1/2 bg-primary/30" />
      <div className="relative mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal className="mb-12 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="mb-4 flex items-center gap-3">
              {num && (
                <span className="flex h-7 w-7 items-center justify-center border border-primary/50 font-mono text-[11px] text-primary">{num}</span>
              )}
              <span className="eyebrow">{eyebrow}</span>
            </div>
            <h2 className="font-display text-4xl leading-[0.95] md:text-6xl">{title}</h2>
          </div>
          {intro && <p className="self-end text-muted-foreground md:col-span-6 md:col-start-7">{intro}</p>}
        </Reveal>
        <Reveal delay={0.1}>{children}</Reveal>
      </div>
    </section>
  );
}