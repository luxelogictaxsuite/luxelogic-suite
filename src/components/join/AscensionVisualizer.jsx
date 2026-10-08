import React from 'react';
import { motion } from 'framer-motion';

export default function AscensionVisualizer({ returns = 0 }) {
  const pct = Math.min(100, (returns / 100) * 100);
  const elevated = returns >= 100;
  return (
    <div className="border border-border bg-card p-6 md:p-8">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Comp tier projection</p>
        <p className="font-mono text-xs text-muted-foreground">{returns} / 100 funded</p>
      </div>
      <div className="mt-6 flex items-end gap-4">
        <span className={`font-display text-7xl tabular-nums transition-colors duration-700 md:text-8xl ${elevated ? 'text-primary' : 'text-foreground'}`}>
          {elevated ? '80' : '70'}<span className="text-muted-foreground">/</span>{elevated ? '20' : '30'}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{elevated ? 'Elevated tier — you keep 80% of prep fees.' : 'Standard tier — you keep 70% of prep fees.'}</p>
      <div className="relative mt-8 h-2 bg-muted">
        <motion.div className={`absolute inset-y-0 left-0 ${elevated ? 'bg-highlight' : 'bg-primary'}`} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 60, damping: 18 }} />
      </div>
      <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Standard 70/30</span><span>100 verified funded returns → 80/20</span>
      </div>
    </div>
  );
}