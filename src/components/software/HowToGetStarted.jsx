import React from 'react';
import { ShoppingCart, FileSignature, PackageCheck, ListChecks, ExternalLink, CheckCircle2, HelpCircle } from 'lucide-react';
import SiteLinkButton from '@/components/site/SiteLinkButton';

const STEPS = [
  { icon: ListChecks, title: 'Choose Your Software', desc: 'Compare TaxSlayer Pro and OLT Pro below — select the platform that fits your office size and workflow.' },
  { icon: ShoppingCart, title: 'Make Your Purchase', desc: 'Complete your purchase through our secure payment portal. You\'ll receive an order confirmation immediately.' },
  { icon: FileSignature, title: 'Submit Your Software Agreement', desc: 'After purchase, your software agreement is generated automatically. Review and submit it to kick off onboarding.' },
  { icon: PackageCheck, title: 'Receive Software & ERO Suite Access', desc: 'We process your agreement and send your software credentials plus ERO Suite portal access — typically within 1–2 business days.' },
];

const EFIN_URL = 'https://www.irs.gov/e-file-providers/become-an-authorized-irs-e-file-provider';

export default function HowToGetStarted() {
  return (
    <div>
      {/* Two-path EFIN section */}
      <div className="grid gap-px border border-border bg-border md:grid-cols-2">
        <div className="bg-background p-6 md:p-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <h3 className="font-display text-2xl">Have an EFIN?</h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            You're ready to buy. Compare the two platforms below, choose your software, and purchase — your agreement is sent automatically after checkout.
          </p>
          <a href="#comparison" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline">
            Compare TaxSlayer Pro vs OLT Pro
          </a>
        </div>
        <div className="bg-background p-6 md:p-8">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-highlight" />
            <h3 className="font-display text-2xl">No EFIN yet?</h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            An <strong>EFIN</strong> (Electronic Filing Identification Number) is a unique number assigned by the IRS to authorized e-file providers. It identifies your office as an approved electronic return filer and is required to purchase professional tax software.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-foreground">•</span> You'll need a PTIN (Preparer Tax Identification Number) first.</li>
            <li className="flex gap-2"><span className="text-foreground">•</span> Apply through the IRS e-Services portal — it's free to apply.</li>
            <li className="flex gap-2"><span className="text-foreground">•</span> Expect 4–6 weeks for processing and a suitability check.</li>
            <li className="flex gap-2"><span className="text-foreground">•</span> <strong className="text-foreground">LuxeLogic assists with obtaining your EFIN for free</strong> — we'll handle the process with you.</li>
          </ul>
          <div className="mt-5">
            <SiteLinkButton linkKey="efin_scheduling" variant="outline">Schedule an EFIN Call</SiteLinkButton>
          </div>
          <a href={EFIN_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline">
            Learn how to get an EFIN from the IRS <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Steps */}
      <div className="mt-8 grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="bg-background p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center border border-border">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-mono text-2xl text-muted-foreground/40">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-4 font-display text-xl">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}