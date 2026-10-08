import React from 'react';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import WaitlistForm from '@/components/clients/WaitlistForm';
import AdvancesCallout from '@/components/site/AdvancesCallout';

export default function Waitlist() {
  return (
    <>
      <PageHero eyebrow="Next Season" title={<>Join the<br /><em className="text-muted-foreground">waitlist.</em></>}>
        <p>Be first in line for tax season. Join now and we’ll automatically send your client intake form as soon as filing opens.</p>
      </PageHero>
      <AdvancesCallout />
      <Section num="01" eyebrow="Waitlist" title="Reserve your spot." intro="Choose your preferred preparer and we'll reach out the second intake opens for the new season.">
        <div className="mx-auto max-w-2xl"><WaitlistForm /></div>
      </Section>
    </>
  );
}