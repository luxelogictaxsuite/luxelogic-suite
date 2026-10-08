import React from 'react';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import NextLink from '@/components/site/NextLink';

const SECTIONS = [
  { title: '1. Acceptance of Agreement', body: 'By purchasing and accessing LuxeLogic Tax Suite professional tax software (the "Software"), you ("Licensee," "you," or "your") agree to be bound by the terms of this Software License Agreement (this "Agreement"). If you do not agree to these terms, do not purchase or use the Software.' },
  { title: '2. License Grant', body: 'LuxeLogic Tax Suite ("Licensor," "we," or "us") grants you a non-exclusive, non-transferable, revocable license to use the Software for the purpose of preparing and filing federal and state tax returns for your clients during the active tax season. This license is granted upon receipt of full payment and completion of the onboarding process. The Software is licensed, not sold.' },
  { title: '3. Permitted Use', body: 'You may use the Software solely for professional tax preparation and electronic filing services. You may install the Software on multiple workstations within a single physical office location. You may not resell, sublicense, rent, lease, or otherwise distribute the Software to any third party. You may not use the Software to prepare returns for clients outside the scope of your authorized tax preparation business.' },
  { title: '4. EFIN and PTIN Requirements', body: 'You must hold a valid Electronic Filing Identification Number (EFIN) issued by the IRS and a valid Preparer Tax Identification Number (PTIN) to use the Software for electronic filing. You are responsible for maintaining the validity of your EFIN and PTIN throughout the license term. If your EFIN or PTIN is suspended, revoked, or expired, your license to use the Software for e-filing will be suspended until the issue is resolved.' },
  { title: '5. E-File Authorization', body: 'You are responsible for complying with all IRS e-file rules, regulations, and publication requirements, including but not limited to IRS Publication 1345. LuxeLogic is not responsible for any penalties, fines, or sanctions imposed by the IRS or any state tax authority due to your failure to comply with e-file requirements.' },
  { title: '6. Bank Product Integration', body: 'The Software may integrate with bank product providers to facilitate refund transfers and related financial products. Bank products are subject to the terms and conditions of the respective bank partner. LuxeLogic is not a bank and does not hold, transmit, or control client funds. All bank product fees, refund transfers, and payouts are processed by the bank partner according to their own schedules and policies.' },
  { title: '7. Data and Privacy', body: 'You retain ownership of all tax return data prepared using the Software. LuxeLogic will not access, use, or disclose your client data except as necessary to provide technical support or as required by law. You are responsible for maintaining the security and confidentiality of your clients\' personally identifiable information in accordance with applicable federal and state privacy laws, including the Gramm-Leach-Bliley Act.' },
  { title: '8. Term and Termination', body: 'This Agreement is effective upon purchase and remains in effect for the duration of the tax season for which the Software was purchased. Upon expiration, your license to use the Software will terminate unless renewed. We may terminate this Agreement immediately if you breach any term of this Agreement, violate applicable law, or engage in fraudulent or abusive tax preparation practices. Upon termination, you must cease all use of the Software.' },
  { title: '9. No Refunds', body: 'All software purchases are final. No refunds, credits, or exchanges will be provided for any reason, including but not limited to failure to obtain or maintain an EFIN or PTIN, change in business circumstances, or discontinuation of tax preparation services. Please review the Refund Policy for full details.' },
  { title: '10. Limitation of Liability', body: 'To the maximum extent permitted by law, LuxeLogic shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to lost profits, lost revenue, or business interruption, arising out of or related to the Software, even if advised of the possibility of such damages. LuxeLogic\'s total liability under this Agreement shall not exceed the amount paid by you for the Software license.' },
  { title: '11. Disclaimer of Warranties', body: 'The Software is provided "as is" and "as available" without warranties of any kind, express or implied. LuxeLogic does not warrant that the Software will be error-free, uninterrupted, or that all tax law updates will be immediately available. You are responsible for verifying the accuracy of all tax returns prepared using the Software.' },
  { title: '12. Governing Law', body: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Ohio, without regard to its conflict of law principles. Any disputes arising under this Agreement shall be resolved in the courts located in Franklin County, Ohio.' },
  { title: '13. Contact', body: 'For questions regarding this Software License Agreement, contact LuxeLogic Tax Suite at info@luxelogictaxsuite.com or (833) 589-3587.' },
];

export default function SoftwareAgreement() {
  return (
    <>
      <PageHero eyebrow="Legal" title={<>Software License<br /><em className="text-muted-foreground">Agreement.</em></>}>
        Last updated: September 2026. Please read this agreement carefully before purchasing.
      </PageHero>
      <Section num="01" eyebrow="Agreement" title="Software License Agreement.">
        <div className="max-w-3xl space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h3 className="font-display text-2xl">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>
      <NextLink to="/refund-policy" eyebrow="Next" title="Refund Policy" />
    </>
  );
}