import React from 'react';
import Section from '@/components/site/Section';
import { Image } from '@/components/ui/image';

const MASCOT = 'https://base44.app/api/apps/6ab71feb020c819bc103c46d/files/mp/public/6ab71feb020c819bc103c46d/5e4946657_wizzy-mascot.png';
const ONE_CLICK = 'https://base44.app/api/apps/6ab71feb020c819bc103c46d/files/mp/public/6ab71feb020c819bc103c46d/ef9265d8c_wizzy-one-click-return.png';
const CLIENT_CREATION = 'https://base44.app/api/apps/6ab71feb020c819bc103c46d/files/mp/public/6ab71feb020c819bc103c46d/87f05b50b_wizzy-client-creation.png';
const REVIEW = 'https://base44.app/api/apps/6ab71feb020c819bc103c46d/files/mp/public/6ab71feb020c819bc103c46d/ade953073_wizzy-review.png';

const STEPS = [
  {
    num: '01',
    title: 'Collect client info your way',
    desc: 'Upload PDFs, W-2s, 1099s, receipts, organizers, and any other client documents — or bring in client info from the form tools you already use. SmartWiz supports JotForm, Cognito Forms, and more.',
    image: CLIENT_CREATION,
    alt: 'Wizzy client creation — drag and drop documents',
  },
  {
    num: '02',
    title: 'Wizzy extracts and organizes everything',
    desc: 'From tax forms and organizers to intake responses, Wizzy extracts it all and organizes your files behind the scenes so nothing is out of place.',
    image: ONE_CLICK,
    alt: 'Wizzy one-click return — data sent straight into your tax software',
  },
  {
    num: '03',
    title: 'Review made easy',
    desc: 'Double-checking has never been this simple. With side-by-side document preview, you\'ll spot errors instantly and confirm accuracy in minutes.',
    image: REVIEW,
    alt: 'Wizzy review — side-by-side document preview with your tax software',
  },
];

export default function WizzyShowcase() {
  return (
    <>
      {/* Meet Wizzy — mascot + logo */}
      <Section num="03" eyebrow="Meet Wizzy" title={<>Your AI tax<br /><em className="text-muted-foreground">preparation assistant.</em></>}>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            {/* SmartWiz wordmark logo */}
            <div className="mb-8 inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#wizzy-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="wizzy-grad" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#3CA9FD" />
                    <stop offset="100%" stopColor="#4E69F6" />
                  </linearGradient>
                </defs>
                <path d="M6 21l15 -15l-3 -3l-15 15l3 3" />
                <path d="M15 6l3 3" />
                <path d="M9 3a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
                <path d="M19 13a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
              </svg>
              <span className="font-display text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #3CA9FD 0%, #4E69F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SmartWiz</span>
            </div>
            <p className="text-lg text-muted-foreground">
              Wizzy is the AI assistant inside SmartWiz that reads your client's tax documents, builds the client profile, and enters the data directly into the return — so your job shifts from typing to reviewing.
            </p>
            <ul className="mt-8 space-y-4">
              <li className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" /><span><strong className="text-foreground">Reduces manual data entry</strong> — Wizzy handles the keystrokes so you focus on review.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" /><span><strong className="text-foreground">One-Click Return</strong> — sends everything into your tax software in one click.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" /><span><strong className="text-foreground">Works with TaxSlayer Pro & OLT Pro</strong> — lives as a browser extension.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" /><span><strong className="text-foreground">SOC 2 Type I audited</strong> — per SmartWiz, client data is encrypted in transit and at rest.</span></li>
            </ul>
            <div className="mt-8 border-t border-border pt-6">
              <p className="text-xs text-muted-foreground"><strong className="text-foreground">Licensed tax professional reviews every return before filing.</strong> Security and performance claims above are provided by SmartWiz, not independently verified by LuxeLogic.</p>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden border border-border bg-card">
              <Image src={MASCOT} alt="Wizzy — the SmartWiz AI assistant mascot" className="h-full w-full" fittingType="fit" />
            </div>
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Wizzy, your AI assistant</p>
          </div>
        </div>
      </Section>

      {/* How Wizzy works — step by step */}
      <Section num="04" eyebrow="How It Works" title="SmartWiz works the way you work." intro="From document collection to one-click return to side-by-side review — Wizzy handles the heavy lifting at every step.">
        <div className="space-y-px border border-border bg-border">
          {STEPS.map((step) => (
            <div key={step.num} className="grid gap-0 bg-background md:grid-cols-2">
              <div className="flex flex-col justify-center p-8 md:p-12">
                <span className="flex h-8 w-8 items-center justify-center border border-primary/50 font-mono text-[11px] text-primary">{step.num}</span>
                <h3 className="mt-6 font-display text-3xl md:text-4xl">{step.title}</h3>
                <p className="mt-4 text-muted-foreground">{step.desc}</p>
              </div>
              <div className="relative min-h-[280px] border-t border-border bg-muted/30 md:border-l md:border-t-0">
                <Image src={step.image} alt={step.alt} className="h-full w-full" fittingType="fit" />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}