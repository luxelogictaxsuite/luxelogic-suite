import React from 'react';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';

export default function IncomeDisclaimer() {
  return (
    <>
      <PageHero eyebrow="Legal" title={<>Income<br /><em className="text-muted-foreground">Disclaimer</em></>}>
        Important information about earnings, refunds, and financial expectations.
      </PageHero>
      <Section num="01" eyebrow="No Guarantee" title="Earnings are not guaranteed.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>Any statements regarding earnings, income, or compensation associated with LuxeLogic Tax Suite services are for informational purposes only and do not constitute a guarantee of actual earnings. Your actual income may vary significantly based on numerous factors, including but not limited to:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>The number of tax returns you prepare and file</li>
            <li>The complexity and fee structure of each return</li>
            <li>Your level of experience, skill, and professional knowledge</li>
            <li>Market conditions and client demand in your geographic area</li>
            <li>Your marketing efforts and client acquisition strategies</li>
            <li>The time and effort you invest in your tax preparation business</li>
            <li>External factors beyond LuxeLogic's control, including IRS regulations and tax law changes</li>
          </ul>
        </div>
      </Section>
      <Section num="02" eyebrow="Compensation Tiers" title="70/30 and 80/20 splits.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>The 70/30 compensation tier is available from the start of your membership. The 80/20 tier is an elevated compensation level that is subject to verification of 100 funded returns. Meeting the funded return threshold does not automatically guarantee elevation to the 80/20 tier — verification and approval by LuxeLogic administration is required.</p>
          <p>Compensation is calculated based on funded returns only. A return must reach "Funded" status before earnings are calculated or distributed.</p>
        </div>
      </Section>
      <Section num="03" eyebrow="Refund Estimates" title="Tax refund estimates.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>Any refund estimates provided through our Refund Estimator or other tools are estimates only and do not constitute a guarantee of actual refund amounts. Actual tax refunds depend on individual circumstances, current tax laws, IRS processing, and other factors. Always consult with a qualified tax professional for accurate tax advice.</p>
        </div>
      </Section>
      <Section num="04" eyebrow="AI Assistance" title="AI does not replace professional review.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>LuxeLogic's SmartWiz AI assists with data entry and document processing. However, AI-generated content may contain errors or omissions. All AI-assisted work must be reviewed and verified by a qualified tax professional before submission. LuxeLogic is not responsible for errors resulting from reliance on AI-generated content without professional review.</p>
        </div>
      </Section>
      <Section num="05" eyebrow="Third-Party Products" title="Banking and software products.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>Banking products, tax software, and other third-party services offered through LuxeLogic are subject to the terms, conditions, and availability of the respective providers. LuxeLogic does not guarantee the performance, availability, or results of third-party products. Fees associated with banking products and software are disclosed on-site and are separate from LuxeLogic membership fees.</p>
          <p className="text-sm">Last updated: September 2026</p>
        </div>
      </Section>
    </>
  );
}