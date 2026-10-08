import React from 'react';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import SiteLinkButton from '@/components/site/SiteLinkButton';
import NextLink from '@/components/site/NextLink';
import { Lock } from 'lucide-react';

const DETAILS = [
  ['Starts', 'Tuesday, September 29'],
  ['Schedule', 'Every Tuesday & Thursday'],
  ['Time', '7:00 – 9:00 PM EST'],
  ['Format', 'Live, instructor-led, ongoing'],
];

export default function LiveEducation() {
  return (
    <>
      <PageHero eyebrow="Live Tax Education" title={<>Learn it live.<br /><em className="text-muted-foreground">Twice a week.</em></>}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-highlight/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-highlight"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-highlight" />Enrolling Now</span>
        An ongoing, instructor-led program for new and developing preparers. Reserve your seat and your attendance tracking begins with the first session.
      </PageHero>
      <section className="border-b border-border bg-primary/5">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-6 md:px-8">
          <Lock className="h-6 w-6 shrink-0 text-primary" />
          <p className="text-sm font-medium md:text-base"><strong className="text-primary">EROs & PTIN holders only.</strong> This program is exclusively for preparers with a PTIN and EROs/EFIN holders who have LuxeLogic tax software. Not a LuxeLogic software user yet? <a href="/software" className="underline underline-offset-2 hover:text-primary">Explore our software</a>.</p>
        </div>
      </section>
      <Section num="01" eyebrow="Program" title="The schedule.">
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {DETAILS.map(([k, v]) => (
            <div key={k} className="bg-background p-8">
              <p className="eyebrow">{k}</p>
              <p className="mt-4 font-display text-3xl">{v}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section num="02" eyebrow="Registration" title="Reserve your seat." className="grid-scaffold">
        <div className="flex flex-col gap-10 border border-border bg-card p-8 md:flex-row md:items-end md:justify-between md:p-12">
          <div>
            <p className="eyebrow">Seat price</p>
            <p className="mt-3 font-display text-8xl">$100</p>
            <p className="mt-3 max-w-md text-muted-foreground">One seat, full access to the ongoing live program. You'll be enrolled in the attendance cohort once payment is confirmed.</p>
          </div>
          <SiteLinkButton linkKey="live_tax_ed_payment" size="lg">Purchase Seat — $100</SiteLinkButton>
        </div>
      </Section>
      <NextLink to="/marketplace" eyebrow="Next" title="Marketplace" />
    </>
  );
}