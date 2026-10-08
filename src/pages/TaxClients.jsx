import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import SiteLinkButton from '@/components/site/SiteLinkButton';
import { base44 } from '@/api/base44Client';
import Countdown from '@/components/site/Countdown';
import RefundCalculator from '@/components/clients/RefundCalculator';
import ResourceLibrary from '@/components/clients/ResourceLibrary';
import FormsSection from '@/components/site/FormsSection';
import DocumentChecklist from '@/components/clients/DocumentChecklist';
import NextLink from '@/components/site/NextLink';
import AdvancesCallout from '@/components/site/AdvancesCallout';


const TOOLS = [
  { key: 'wheres_my_refund', title: "Where's My Refund", desc: 'Official IRS refund status tracker. Have your SSN, filing status and exact refund amount ready.' },
  { key: 'withholding_estimator', title: 'Withholding Estimator', desc: 'Check your W-4 so next year holds no surprises.' },
];

export default function TaxClients() {
  const { data: intake } = useQuery({
    queryKey: ['intakeForm'],
    queryFn: () => base44.entities.FormDefinition.filter({ active: true, category: 'Tax Clients' }, 'sort_order', 1),
  });
  const intakeUrl = intake?.[0] ? `/form/${intake[0].id}` : '#forms';
  return (
    <>
      <PageHero eyebrow="Tax Client Hub" title={<>Your return, handled<br /><em className="text-muted-foreground">with care.</em></>}>
        <p>Start your return online in minutes. A LuxeLogic preparer reviews every detail before anything is filed.</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to={intakeUrl} className="inline-flex h-12 items-center bg-primary px-6 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">Start My Return</Link>
          <SiteLinkButton linkKey="book_a_call" variant="outline" size="lg">Book a Consultation</SiteLinkButton>
        </div>
      </PageHero>

      <AdvancesCallout />

      <Section id="estimator" num="01" eyebrow="Refund Estimator" title="What might you get back?" intro="Five filing statuses, 2025 IRS brackets. Enter your figures to see an instant federal estimate.">
        <RefundCalculator />
      </Section>

      <Section num="02" eyebrow="IRS Tools" title="Track and plan.">
        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          {TOOLS.map((t) => (
            <div key={t.key} className="bg-background p-8 md:p-10">
              <h3 className="font-display text-3xl">{t.title}</h3>
              <p className="mt-3 text-muted-foreground">{t.desc}</p>
              <div className="mt-8"><SiteLinkButton linkKey={t.key} variant="outline">Open tool</SiteLinkButton></div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="deadline" num="03" eyebrow="Extension Deadline" title="Time remaining." className="grid-scaffold">
        <Countdown />
        <div className="mt-10"><Link to={intakeUrl} className="inline-flex h-12 items-center bg-primary px-6 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">Start My Return</Link></div>
      </Section>

      <Section num="04" eyebrow="Resources" title="The library." intro="Articles, FAQs and trusted links to help you understand your return.">
        <ResourceLibrary />
      </Section>

      <Section num="05" eyebrow="Bring Your Documents" title="What to gather." intro="Use this checklist to collect everything you need before your appointment. The more complete your documents, the faster your return.">
        <DocumentChecklist />
      </Section>

      <Section num="06" eyebrow="Forms" title="All your forms." intro="Every form you need, in one place. Missing one? The office can add it anytime from the Forms Manager.">
        <FormsSection category="Tax Clients" />
      </Section>

      <Section num="07" eyebrow="Consultations" title="Prefer to talk it through?" intro="Book time with a LuxeLogic preparer to review your situation before you file.">
        <SiteLinkButton linkKey="book_a_call" size="lg">Book a Consultation</SiteLinkButton>
      </Section>
      <NextLink to="/software" eyebrow="Next" title="Explore ERO Software" />
    </>
  );
}