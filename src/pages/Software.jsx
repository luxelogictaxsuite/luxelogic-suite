import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import ServiceBureauCard from '@/components/software/ServiceBureauCard';
import SoftwarePurchaseForm from '@/components/software/SoftwarePurchaseForm';
import BankingPartners from '@/components/software/BankingPartners';
import SoftwareComparison from '@/components/software/SoftwareComparison';
import SoftwareCard from '@/components/software/SoftwareCard';
import SoftwareFAQ from '@/components/software/SoftwareFAQ';

const SOFTWARE = [
  { name: 'TaxSlayer Pro', pay: 'payment_taxslayer', demo: 'demo_taxslayer', training: 'taxslayer_training_videos', desc: 'Full-featured professional software trusted by high-volume offices, with bank products built in.' },
  { name: 'OLT Pro', pay: 'payment_olt', demo: 'demo_olt', training: 'olt_training_videos', desc: 'Cloud-based professional software that runs anywhere, with streamlined e-file and bank product workflows.' },
];

export default function Software() {
  return (
    <>
      <PageHero eyebrow="EROs & EFIN Holders" title={<>Software &amp;<br /><em className="text-muted-foreground">Service Bureau.</em></>}>
        Purchase professional software on its own, or build your own bureau. Every purchase triggers your software agreement automatically.
      </PageHero>
      <Section num="01" eyebrow="Choose Your Software" title="Two platforms. One decision.">
        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          {SOFTWARE.map((s) => (
            <div key={s.name} className="bg-background p-8 md:p-12">
              <h3 className="font-display text-4xl md:text-5xl">{s.name}</h3>
              <p className="mt-3 text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section num="02" eyebrow="Pricing & Purchase" title="Choose your platform.">
        <p className="mb-8 max-w-2xl text-muted-foreground">$399 per season for either platform — unlimited e-filed returns, no per-return software fee. Bank product fees apply separately when a client chooses a refund transfer; those are set by the bank, not LuxeLogic. Review the agreement and refund policy before purchase.</p>
        <div className="mb-8 flex flex-wrap gap-4">
          <Link to="/software-agreement" className="inline-flex h-12 items-center gap-2 border border-foreground/30 px-6 font-medium text-foreground transition hover:border-highlight hover:text-highlight">Read the Software Agreement</Link>
          <Link to="/refund-policy" className="inline-flex h-12 items-center gap-2 border border-foreground/30 px-6 font-medium text-foreground transition hover:border-highlight hover:text-highlight">View Refund Policy</Link>
        </div>
        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          {SOFTWARE.map((s) => (
            <SoftwareCard key={s.name} {...s} />
          ))}
        </div>
      </Section>
      <Section id="comparison" num="03" eyebrow="Comparison" title="TaxSlayer Pro vs OLT Pro.">
        <p className="mb-8 max-w-2xl text-muted-foreground">Not sure which platform is right for your office? Here's a side-by-side breakdown.</p>
        <SoftwareComparison />
      </Section>
      <Section num="04" eyebrow="Service Bureau" title="Build your own bureau." className="grid-scaffold">
        <ServiceBureauCard />
      </Section>
      <Section num="05" eyebrow="Banking Products" title="Our banking partners.">
        <BankingPartners />
      </Section>
      <SoftwareFAQ num="06" />
      <Section num="07" eyebrow="Onboarding" title="Start your build.">
        <p className="mb-8 max-w-2xl text-muted-foreground">Purchased your software? Submit your details to kick off onboarding — we'll send you the registration form and begin your build immediately. EFIN is required; PTIN is also collected.</p>
        <div className="max-w-2xl"><SoftwarePurchaseForm /></div>
      </Section>
      <Section num="08" eyebrow="Next Step" title="Add SmartWiz AI.">
        <p className="mb-6 max-w-2xl text-muted-foreground">Automate return preparation with SmartWiz AI — works with both TaxSlayer Pro and OLT Pro. Lower minimums through LuxeLogic.</p>
        <Link to="/smartwiz" className="inline-flex h-12 items-center gap-2 bg-primary px-6 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">
          Explore SmartWiz AI <ArrowRight className="h-4 w-4" />
        </Link>
      </Section>
    </>
  );
}