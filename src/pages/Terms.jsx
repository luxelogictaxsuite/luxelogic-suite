import React from 'react';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';

export default function Terms() {
  return (
    <>
      <PageHero eyebrow="Legal" title={<>Terms &<br /><em className="text-muted-foreground">Conditions</em></>}>
        The terms and conditions governing your use of LuxeLogic Tax Suite.
      </PageHero>
      <Section num="01" eyebrow="Acceptance" title="Agreement to terms.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>By accessing or using the LuxeLogic Tax Suite website, forms, software products, or services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>
        </div>
      </Section>
      <Section num="02" eyebrow="Services" title="Description of services.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>LuxeLogic Tax Suite LLC provides tax management services, including but not limited to:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Tax preparation software enrollment and provisioning (TaxSlayer Pro, OLT Pro)</li>
            <li>Tax professional onboarding and continuing education</li>
            <li>Banking-product enrollment and guidance</li>
            <li>Client intake and return management workflows</li>
            <li>Live education through IRS-approved CE providers</li>
            <li>SmartWiz AI assistance for data entry and document processing</li>
          </ul>
          <p>AI assists with data entry but does not replace professional review. All tax returns and filings must be reviewed by a qualified tax professional before submission.</p>
        </div>
      </Section>
      <Section num="03" eyebrow="User Obligations" title="Your responsibilities.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>As a user of LuxeLogic services, you agree to:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Provide accurate, complete, and truthful information in all registrations and forms</li>
            <li>Submit only authentic, unaltered documents for identity verification and enrollment</li>
            <li>Maintain the confidentiality of your login credentials</li>
            <li>Use the software and services in compliance with all applicable laws and IRS regulations</li>
            <li>Not attempt to access, view, or download another user's submissions or private documents</li>
            <li>Not use the services for any fraudulent, illegal, or unauthorized purpose</li>
          </ul>
        </div>
      </Section>
      <Section num="04" eyebrow="Payments" title="Fees and payment.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>Certain services require payment of fees as displayed on the website at the time of purchase. Payments are processed securely through Stripe. All fees are stated in U.S. dollars.</p>
          <p>Compensation for tax preparers is based on the tier structure (70/30 or 80/20) as described in the Join the Team page. The 80/20 tier is subject to verification of 100 funded returns.</p>
          <p>For refund information, please review our <a href="/refund-policy" className="text-primary underline hover:text-highlight">Refund Policy</a>.</p>
        </div>
      </Section>
      <Section num="05" eyebrow="Intellectual Property" title="Ownership and use.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>The LuxeLogic name, logo, website content, software interfaces, and training materials are the intellectual property of LuxeLogic Tax Suite LLC. LuxeLogic® is a registered trademark. You may not use, copy, or distribute our intellectual property without express written permission.</p>
        </div>
      </Section>
      <Section num="06" eyebrow="Limitation of Liability" title="Liability disclaimer.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>LuxeLogic Tax Suite LLC provides services on an "as is" and "as available" basis. While we use industry-standard security measures to protect your information, no method of transmission or storage is completely secure. We are not liable for any indirect, incidental, or consequential damages arising from the use of our services.</p>
          <p>AI-assisted data entry is a convenience feature and does not replace professional review. We are not responsible for errors or omissions in tax filings that result from reliance on AI-generated content without professional verification.</p>
        </div>
      </Section>
      <Section num="07" eyebrow="Termination" title="Account termination.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>We reserve the right to suspend or terminate access to our services at any time, with or without cause. Upon termination, your submission data will be retained in accordance with our Privacy Policy unless you request deletion.</p>
        </div>
      </Section>
      <Section num="08" eyebrow="Updates" title="Changes to terms.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>We may update these Terms and Conditions from time to time. Changes will be posted on this page with an updated revision date. Continued use of our services after changes constitutes acceptance of the updated terms.</p>
          <p className="text-sm">Last updated: September 2026</p>
        </div>
      </Section>
    </>
  );
}