import React from 'react';
import Section from '@/components/site/Section';

const INCLUDES = [
  ['Software Onboarding', 'We set up your TaxSlayer Pro or OLT Pro account, configure your office profile, and have you ready to e-file from day one.'],
  ['Bank Enrollment Assistance', 'We walk you through bank product enrollment with Refund Advantage, Santa Barbara TPG, or Republic Bank.'],
  ['Adding Preparers & Sub-Offices', 'Scale your operation — add preparers, sub-offices, and additional EFINs as your business grows.'],
  ['Software Training', 'Step-by-step video training for TaxSlayer Pro and OLT Pro, from basic returns to bank products.'],
  ['Live Education & CE', 'Continuing education through an IRS-approved CE provider, with credits reported directly to your PTIN.'],
  ['Marketing Guidance', 'Practical strategies to grow your client base and fill your pipeline before tax season.'],
  ['One-on-One Coaching', 'Direct access to experienced tax professionals for strategy, problem-solving, and growth planning.'],
  ['Backend & Technical Support', 'Real people, real answers — software issues, e-file rejections, bank product questions, all handled.'],
  ['Workflow & Systems Setup', 'We help you build the workflows and office systems that keep your season running smoothly.'],
  ['Support Before, During & After Season', 'Year-round support — from onboarding through the last return filed and everything in between.'],
];

export default function LuxeLogicIncludes({ num = '01' }) {
  return (
    <Section num={num} eyebrow="What LuxeLogic Does for You" title={<>The software is the start.<br /><em className="text-muted-foreground">The support is the difference.</em></>}>
      <p className="mb-10 max-w-2xl text-muted-foreground">Most providers sell you software and walk away. LuxeLogic wraps every purchase in full-service support — so you're never on your own, from setup through the last return of the season.</p>
      <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
        {INCLUDES.map(([title, desc], i) => (
          <div key={title} className="bg-background p-6 md:p-8">
            <span className="font-mono text-xs text-primary">0{i + 1}</span>
            <h3 className="mt-3 font-display text-xl md:text-2xl">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}