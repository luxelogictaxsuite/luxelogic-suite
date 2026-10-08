import React from 'react';
import { Link } from 'react-router-dom';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import NextLink from '@/components/site/NextLink';

export default function RefundPolicy() {
  return (
    <>
      <PageHero eyebrow="Legal" title={<>Refund<br /><em className="text-muted-foreground">Policy.</em></>}>
        Last updated: September 2026.
      </PageHero>
      <Section num="01" eyebrow="Policy" title="All sales are final.">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            LuxeLogic Tax Suite does not offer refunds, credits, exchanges, or chargebacks for any software purchases, service bureau setup fees, add-on products, or training seats. All sales are final upon completion of payment.
          </p>
          <div>
            <h3 className="font-display text-xl">Why no refunds?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Upon purchase, your software license is activated, credentials are issued, and backend infrastructure is provisioned for your office. These resources are allocated immediately and cannot be recovered. Additionally, IRS e-file authorization, bank product integration, and ERO Suite access are configured specifically for your account.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl">Before you buy</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We encourage all prospective buyers to review the <Link to="/software-agreement" className="text-primary underline-offset-2 hover:underline">Software License Agreement</Link>, compare software options, and confirm EFIN and PTIN status before completing a purchase. If you have questions about which product is right for your office, contact us before purchasing.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl">Technical issues</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              If you experience a technical issue with the Software that prevents normal operation, LuxeLogic will provide technical support to resolve the issue. Support is not a basis for refund but ensures your software functions as intended throughout the license term.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl">Chargebacks</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Initiating a chargeback through your bank or credit card provider does not void this Refund Policy or the Software License Agreement. All sales remain final regardless of chargeback outcome. Disputes should be directed to LuxeLogic Tax Suite at info@luxelogictaxsuite.com or (833) 589-3587 before contacting your financial institution.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl">Contact</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Questions about this policy? Contact LuxeLogic Tax Suite at info@luxelogictaxsuite.com or (833) 589-3587.
            </p>
          </div>
        </div>
      </Section>
      <NextLink to="/software" eyebrow="Next" title="Buy Software" />
    </>
  );
}