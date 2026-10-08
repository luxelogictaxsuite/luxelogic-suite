import React from 'react';
import { motion } from 'framer-motion';

export default function PageHero({ eyebrow, title, children }) {
  return (
    <section className="relative overflow-hidden border-b border-border grid-scaffold">
      {/* luxe brand-color glow */}
      <div aria-hidden className="pointer-events-none absolute -top-48 -right-40 h-[40rem] w-[40rem] rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.22) 0%, transparent 70%)' }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-[32rem] w-[32rem] rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--highlight) / 0.16) 0%, transparent 70%)' }} />
      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3">
          <span aria-hidden className="h-px w-10 bg-primary" />
          <span className="eyebrow">{eyebrow}</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl font-display text-5xl font-normal leading-[0.95] tracking-tight md:text-8xl"
        >
          {title}
        </motion.h1>
        {children && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 max-w-2xl text-lg text-muted-foreground">
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}