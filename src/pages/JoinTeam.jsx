import React, { useState } from 'react';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import SiteLinkButton from '@/components/site/SiteLinkButton';
import ApplicationForm from '@/components/join/ApplicationForm';
import AscensionVisualizer from '@/components/join/AscensionVisualizer';
import FormsSection from '@/components/site/FormsSection';
import NextLink from '@/components/site/NextLink';

const INCLUDES = [
  ['18-Hour Live Education', 'Continuing education through an IRS-approved CE provider, with credits reported directly to your PTIN.'],
  ['Software Access', 'Work in TaxSlayer Pro — the professional software our preparers use — with full bureau support behind you.'],
  ['Software Training', 'Step-by-step video training for TaxSlayer Pro, from basic returns to bank products.'],
  ['Return Review', 'Have your returns reviewed by experienced professionals before they go out the door.'],
  ['One-on-One Coaching', 'Direct access to experienced tax professionals for strategy, problem-solving, and growth planning.'],
  ['Marketing Resources', 'Practical marketing strategies and materials to grow your client base and fill your pipeline.'],
  ['Ongoing Support', 'Support before, during, and after tax season — you are never on your own.'],
  ['Office Systems', 'Workflow and systems setup to keep your operation running smoothly all season.'],
  ['Bank-Product Guidance', 'We guide you through bank product enrollment, usage, and best practices.'],
];

export default function JoinTeam() {
  const [data, setData] = useState({});
  const scrollToApply = () => document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' });
  return (
    <>
      <PageHero eyebrow="Join the Team — PTIN Holders" title={<>Not a seat.<br /><em className="text-muted-foreground">A partnership.</em></>}>
        LuxeLogic preparers are compensated like partners. Apply below — it takes about two minutes.
      </PageHero>
      <Section num="01" eyebrow="What's Included" title={<>Everything you need<br /><em className="text-muted-foreground">to build your tax career.</em></>}>
        <p className="mb-10 max-w-2xl text-muted-foreground">Your tax career deserves more than a software login. Here is everything that comes with joining LuxeLogic:</p>
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDES.map(([t, d], i) => (
            <div key={t} className="bg-background p-6 md:p-8">
              <span className="font-mono text-xs text-primary">0{i + 1}</span>
              <h3 className="mt-3 font-display text-xl md:text-2xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section num="02" eyebrow="Membership" title={<>Your tax career deserves more<br /><em className="text-muted-foreground">than a software login.</em></>}>
        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          <div className="bg-background p-8 md:p-12">
            <p className="font-display text-7xl">$149</p>
            <p className="mt-2 eyebrow">One-time onboarding</p>
            <ul className="mt-8 space-y-3 text-sm">
              <li className="flex gap-3"><span className="text-highlight">•</span> Live continuing education through an IRS-approved CE provider</li>
              <li className="flex gap-3"><span className="text-highlight">•</span> Credits reported straight to the IRS and issued to your PTIN</li>
              <li className="flex gap-3"><span className="text-highlight">•</span> Work in TaxSlayer Pro with full bureau support</li>
              <li className="flex gap-3"><span className="text-highlight">•</span> 70/30 split from day one, 80/20 at 100 funded returns</li>
            </ul>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <SiteLinkButton linkKey="payment_membership_149" size="lg">Join Now — $149</SiteLinkButton>
              <button onClick={scrollToApply} className="inline-flex h-14 items-center gap-2 border border-foreground/30 px-8 font-medium text-foreground transition hover:border-highlight hover:text-highlight">
                Apply First
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">After your $149 payment, you'll receive the 70/30 Specialist Registration form by email — just like our ERO registration process.</p>
          </div>
          <div className="flex flex-col justify-center bg-card p-8 md:p-12">
            <p className="eyebrow mb-4">Live education</p>
            <h3 className="font-display text-3xl">Exclusive to LuxeLogic preparers.</h3>
            <p className="mt-4 text-muted-foreground">Our live continuing education is available only to preparers who join LuxeLogic Tax Suite — it's included with your $149 membership, with credits reported directly to the IRS and issued to your PTIN.</p>
          </div>
        </div>
      </Section>
      <Section id="apply" num="03" eyebrow="Tax Preparer Application" title="Apply to join." intro="Enter your projected funded returns to see where your comp tier lands.">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7"><ApplicationForm data={data} setData={setData} /></div>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28 space-y-6">
              <AscensionVisualizer returns={Number(data.projected_returns) || 0} />
              <p className="text-xs text-muted-foreground">The 80/20 tier activates once your funded return count reaches 100 and the volume is verified by our team.</p>
            </div>
          </div>
        </div>
      </Section>
      <Section num="04" eyebrow="Forms" title="Agreements & registration forms." intro="Register below to officially onboard as a specialist. These forms are built right into LuxeLogic — no redirects. The office can add additional forms here anytime.">
        <FormsSection category="Join Team" />
      </Section>
      <NextLink to="/live-education" eyebrow="Next" title="Live Education" />
    </>
  );
}