import React from 'react';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';

export default function PrivacyPolicy() {
  return (
    <>
      <PageHero eyebrow="Legal" title={<>Privacy<br /><em className="text-muted-foreground">Policy</em></>}>
        How LuxeLogic Tax Suite LLC collects, uses, and protects your personal information.
      </PageHero>
      <Section num="01" eyebrow="Overview" title="Your privacy matters.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>LuxeLogic Tax Suite LLC ("LuxeLogic," "we," "us," or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy describes how we collect, use, store, and safeguard the information you provide when using our website, forms, software products, and services.</p>
          <p>By submitting your information through any LuxeLogic form, registration, or application, you acknowledge that you have read and agree to the practices described in this policy.</p>
        </div>
      </Section>
      <Section num="02" eyebrow="Information We Collect" title="What we collect and why.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>We collect the following categories of personal information necessary for identity verification, tax-software enrollment, banking-product enrollment, compliance, payment processing, and onboarding:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li><strong>Identity information:</strong> Full legal name, Social Security Number (SSN), date of birth, and government-issued photo identification.</li>
            <li><strong>Contact information:</strong> Email address, phone number, and mailing address.</li>
            <li><strong>Professional credentials:</strong> PTIN (Preparer Tax Identification Number), PTIN letter, EFIN (Electronic Filing Identification Number), and W-9 information.</li>
            <li><strong>Financial information:</strong> Banking details necessary for payment processing and banking-product enrollment.</li>
            <li><strong>Documents:</strong> Uploaded documents including photo identification, PTIN letters, W-9 forms, EFIN documentation, and other files necessary for enrollment and compliance.</li>
            <li><strong>Electronic signatures:</strong> Your typed legal name as an electronic signature on registration and agreement forms.</li>
          </ul>
        </div>
      </Section>
      <Section num="03" eyebrow="How We Use Information" title="Purpose of collection.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>Your personal information is collected and used exclusively for:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Identity verification and fraud prevention</li>
            <li>Tax-software enrollment and account provisioning</li>
            <li>Banking-product enrollment and processing</li>
            <li>IRS compliance and regulatory requirements</li>
            <li>Payment processing and compensation distribution</li>
            <li>Onboarding and ongoing service delivery</li>
            <li>Communication regarding your registration, account, or services</li>
          </ul>
          <p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
        </div>
      </Section>
      <Section num="04" eyebrow="Data Security" title="How we protect your information.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>All sensitive information and documents you submit are stored securely using private, access-controlled storage. Specifically:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li>Uploaded documents are stored in private storage — never on publicly accessible URLs.</li>
            <li>Access to your submission data is restricted to authenticated LuxeLogic administrators.</li>
            <li>Private files may only be viewed or downloaded after verifying that the user is an authenticated administrator.</li>
            <li>Short-lived signed URLs are generated only after authorization, and expire automatically.</li>
            <li>Sensitive information is never included in notification emails, attachments, or ordinary communications.</li>
            <li>Anonymous visitors cannot list, search, read, edit, or download any submission after it is submitted.</li>
            <li>Preparer accounts cannot access another applicant's registration, SSN, identification, PTIN letter, W-9, EFIN documents, or signature.</li>
          </ul>
        </div>
      </Section>
      <Section num="05" eyebrow="Data Retention" title="How long we keep your data.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>We retain all registration submissions and private uploads until further notice. We do not automatically delete or purge submissions. Administrators retain a manual delete option. If you request deletion of your data, we will process the request in accordance with applicable law.</p>
        </div>
      </Section>
      <Section num="06" eyebrow="Your Rights" title="Your rights regarding your data.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>You have the right to request access to, correction of, or deletion of your personal information. To exercise these rights, please contact us through the contact information provided on this website.</p>
          <p>You may also withdraw consent for data processing at any time; however, this may affect our ability to provide services that require the collected information.</p>
        </div>
      </Section>
      <Section num="07" eyebrow="Updates" title="Changes to this policy.">
        <div className="max-w-3xl space-y-6 text-muted-foreground">
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this page periodically.</p>
          <p className="text-sm">Last updated: September 2026</p>
        </div>
      </Section>
    </>
  );
}