import React from 'react';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import SiteLinkButton from '@/components/site/SiteLinkButton';
import NextLink from '@/components/site/NextLink';
import WizzyShowcase from '@/components/smartwiz/WizzyShowcase';

const PRICING = [
  ['$99', 'Due at sign-up', 'One-time activation fee.'],
  ['$30', 'Per return', 'Charged on each return processed through SmartWiz.'],
  ['$800', 'From first bank drop', 'One-time $800 fee, taken from your office\'s first bank drop in February.'],
];

export default function SmartWiz() {
  return (
    <>
      <div className="relative">
        <img
          src="https://media.base44.com/images/public/6ab71feb020c819bc103c46d/ce2484f49_9e91cecf-0f6e-441f-a5bd-e71aab02972f.png"
          alt="Wizzy Meets LuxeLogic"
          className="absolute right-5 top-5 z-10 h-32 w-auto md:right-8 md:top-8"
        />
        <PageHero eyebrow="SmartWiz AI Add-On" title={<>Automation that<br /><em className="text-muted-foreground">prepares with you.</em></>}>
          An AI automation add-on that works with both TaxSlayer Pro and OLT Pro.
        </PageHero>
      </div>
      <Section num="01" eyebrow="The LuxeLogic Advantage" title="Lower minimums. Same engine.">
        <div className="grid md:grid-cols-5">
          <div className="flex flex-col justify-between border border-border bg-background p-8 md:col-span-2">
            <p className="eyebrow">Signing up direct with SmartWiz</p>
            <div className="mt-16">
              <p className="font-display text-8xl text-muted-foreground">50</p>
              <p className="mt-2 text-sm text-muted-foreground">minimum funded returns required</p>
            </div>
          </div>
          <div className="flex flex-col justify-between bg-foreground p-8 text-background md:col-span-3 md:p-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-highlight">Through LuxeLogic</p>
            <div className="mt-16">
              <p className="font-display text-[9rem] leading-none text-primary">30</p>
              <p className="mt-2 text-sm text-background/80">minimum funded returns required — 20 fewer than going direct.</p>
            </div>
          </div>
        </div>
      </Section>
      <Section num="02" eyebrow="Pricing" title="Transparent terms.">
        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {PRICING.map(([p, t, d]) => (
            <div key={t} className="bg-background p-8">
              <p className="font-display text-6xl">{p}</p>
              <p className="mt-4 font-medium">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">$30 per return, plus a one-time $800 fee taken from your office's first bank drop in February.</p>
        <div className="mt-12"><SiteLinkButton linkKey="payment_smartwiz" size="lg">Activate SmartWiz — $99</SiteLinkButton></div>
      </Section>
      <WizzyShowcase />
      <Section num="05" eyebrow="Important" title="AI assists. The preparer reviews.">
        <div className="max-w-3xl space-y-4">
          <p className="text-muted-foreground">SmartWiz and Wizzy assist with data entry and document organization. <strong className="text-foreground">Licensed tax professional reviews every return before filing.</strong> AI does not replace professional judgment or review.</p>
          <p className="text-sm text-muted-foreground">Security and performance claims on this page (including SOC 2 Type I certification) are stated by SmartWiz and reflect their own disclosures at <a href="https://smartwiz.ai/security" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">smartwiz.ai/security</a>. LuxeLogic republishes these claims for informational purposes — verify current details directly with SmartWiz before relying on them.</p>
        </div>
      </Section>
      <NextLink to="/marketplace" eyebrow="Next" title="Marketplace" />
    </>
  );
}