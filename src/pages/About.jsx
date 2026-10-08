import React from 'react';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function About() {
  return (
    <>
      <PageHero eyebrow="About Us" title={<>LuxeLogic<br /><em className="text-muted-foreground">Tax Suite</em></>}>
        A high-precision tax management ecosystem connecting clients, professional preparers, and EROs through streamlined digital workflows, education, and software services.
      </PageHero>
      <Section num="01" eyebrow="Our Mission" title={<>Precision tax services,<br /><em className="text-muted-foreground">elevated by technology.</em></>}>
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>LuxeLogic Tax Suite LLC was founded to transform the tax preparation experience for clients, preparers, and Electronic Return Originators (EROs) alike. We combine professional tax expertise with modern technology — including AI-assisted data entry — to deliver accurate, efficient, and secure tax services.</p>
          <p>Our mission is to empower tax professionals with the tools, training, and support they need to build thriving practices, while providing clients with a seamless, transparent tax preparation experience from intake to filing.</p>
        </div>
      </Section>
      <Section num="02" eyebrow="What We Do" title="Our ecosystem.">
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Tax Client Services', 'Streamlined intake, document collection, refund estimation, and return management with preparer matching and real-time status tracking.'],
            ['Preparer Suite', 'A native preparer dashboard for return management, due diligence, document requests, earnings tracking, compliance, and continuing education.'],
            ['Software & ERO Services', 'TaxSlayer Pro and OLT Pro enrollment, bureau support, banking-product guidance, and full onboarding for Electronic Return Originators.'],
            ['Live Education', '18 hours of continuing education through an IRS-approved CE provider, with credits reported directly to your PTIN.'],
            ['SmartWiz AI', 'AI-assisted data entry and document processing that speeds up preparation while maintaining professional review standards.'],
            ['Marketplace', 'A curated marketplace of tax-preparation products, training resources, and professional tools.'],
          ].map(([t, d], i) => (
            <div key={t} className="bg-background p-6 md:p-8">
              <span className="font-mono text-xs text-primary">0{i + 1}</span>
              <h3 className="mt-3 font-display text-xl md:text-2xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section num="03" eyebrow="Our Values" title="What drives us.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <ul className="ml-6 list-disc space-y-3">
            <li><strong>Precision:</strong> Every return is reviewed by experienced professionals before it goes out the door.</li>
            <li><strong>Partnership:</strong> Preparers are compensated like partners, with transparent 70/30 and 80/20 compensation tiers.</li>
            <li><strong>Security:</strong> Sensitive personal information is stored securely with admin-only access — never exposed in emails or public URLs.</li>
            <li><strong>Education:</strong> We invest in our preparers' growth with live, IRS-approved continuing education.</li>
            <li><strong>Innovation:</strong> We leverage AI and modern technology to streamline workflows without replacing professional judgment.</li>
          </ul>
        </div>
      </Section>
      <Section num="04" eyebrow="Get Started" title="Ready to begin?">
        <div className="flex flex-wrap gap-4">
          <Link to="/tax-clients" className="inline-flex h-12 items-center gap-2 bg-primary px-6 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">
            Tax Clients <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/join" className="inline-flex h-12 items-center gap-2 border border-foreground/30 px-6 font-medium transition hover:border-highlight hover:text-highlight">
            Join the Team <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/software" className="inline-flex h-12 items-center gap-2 border border-foreground/30 px-6 font-medium transition hover:border-highlight hover:text-highlight">
            EROs & Software <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>
    </>
  );
}