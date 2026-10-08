import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

const BLADES = [
  { to: '/tax-clients', num: '01', title: 'File My Taxes', sub: 'Start your return, estimate your refund, beat the deadline.', img: 'https://media.base44.com/images/public/6ab71feb020c819bc103c46d/025116613_generated_image.png' },
  { to: '/software', num: '02', title: 'Buy Software / EROs', sub: 'TaxSlayer Pro, OLT Pro, and full Service Bureau setup.', img: 'https://media.base44.com/images/public/6ab71feb020c819bc103c46d/30f606f51_generated_image.png' },
  { to: '/join', num: '03', title: 'Join the Team', sub: 'PTIN holders: 70/30 from day one, 80/20 at 100 funded returns.', img: 'https://media.base44.com/images/public/6ab71feb020c819bc103c46d/15710d386_generated_image.png' },
  { to: '/live-education', num: '04', title: 'Training', sub: 'Live continuing education through an IRS-approved CE provider, twice weekly.', img: 'https://media.base44.com/images/public/6ab71feb020c819bc103c46d/62efd227c_generated_image.png' },
];

export default function HeroBlades() {
  const [active, setActive] = useState(null);
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 md:px-8 md:pt-24">
        <p className="eyebrow mb-6">LuxeLogic Tax Suite — Select your path</p>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="font-display text-[3.4rem] leading-[0.9] tracking-tight md:text-[8.5rem]">
          Tax, engineered<br /><em className="text-muted-foreground">with precision.</em>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Professional tax software, service bureau support, training and tax preparation — all backed by real guidance.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }} className="mt-8 flex flex-wrap gap-4">
          <Link to="/software" className="inline-flex h-14 items-center gap-2 bg-primary px-8 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">
            I'm a Tax Professional <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/tax-clients" className="inline-flex h-14 items-center gap-2 border border-foreground/30 px-8 font-medium text-foreground transition hover:border-highlight hover:text-highlight">
            I Need My Taxes Prepared
          </Link>
        </motion.div>
      </div>
      <div className="flex flex-col md:h-[560px] md:flex-row">
        {BLADES.map((b, i) => (
          <Link
            key={b.to}
            to={b.to}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            style={{ flexGrow: active === null ? 1 : active === i ? 2 : 0.75 }}
            className="group relative min-w-0 h-[320px] basis-0 overflow-hidden border-t border-border transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:h-auto md:border-l md:border-t-0 first:md:border-l-0"
          >
            {b.img ? (
              <Image src={b.img} alt="" className="absolute inset-0 h-full w-full grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-accent to-primary/10" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <span className="font-mono text-xs text-primary">{b.num}</span>
              <h2 className="mt-2 font-display text-4xl md:text-5xl">{b.title}</h2>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">{b.sub}</p>
              <span className="mt-6 inline-flex items-center gap-2 bg-secondary px-5 py-3 text-sm font-medium text-primary">
                Enter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}