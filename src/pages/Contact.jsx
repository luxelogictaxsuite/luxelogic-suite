import React from 'react';
import { Link } from 'react-router-dom';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import BusinessHours from '@/components/site/BusinessHours';
import { useSettings } from '@/hooks/useSiteData';
import { Mail, Phone, LifeBuoy, Ticket, ArrowUpRight } from 'lucide-react';

export default function Contact() {
  const { settings } = useSettings();
  const supportEmail = settings.support_email || 'support@luxelogictaxsuite.com';
  const supportPhone = settings.support_phone || '(833) 589-3587';

  return (
    <>
      <PageHero eyebrow="Support" title={<>Contact &amp;<br /><em className="text-muted-foreground">Tech Support.</em></>}>
        Need help with your software, returns, or account? Reach our support team directly — or submit a ticket in your Suite for the fastest response.
      </PageHero>
      <Section num="01" eyebrow="Reach Us" title="Talk to support.">
        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          <a href={`mailto:${supportEmail}`} className="bg-background p-8 transition hover:bg-secondary/30 md:p-12">
            <Mail className="h-6 w-6 text-primary" />
            <p className="eyebrow mt-4">Email</p>
            <p className="mt-2 font-display text-2xl md:text-3xl">{supportEmail}</p>
            <p className="mt-2 text-sm text-muted-foreground">For software issues, billing questions, and general support.</p>
          </a>
          <a href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`} className="bg-background p-8 transition hover:bg-secondary/30 md:p-12">
            <Phone className="h-6 w-6 text-primary" />
            <p className="eyebrow mt-4">Phone</p>
            <p className="mt-2 font-display text-2xl md:text-3xl">{supportPhone}</p>
            <p className="mt-2 text-sm text-muted-foreground">Speak with a support specialist during business hours.</p>
          </a>
        </div>
      </Section>
      <Section num="02" eyebrow="Hours" title="When we're open.">
        <div className="max-w-2xl">
          <BusinessHours />
        </div>
      </Section>
      <Section num="03" eyebrow="Portal" title="Submit a ticket.">
        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          <Link to="/suite/support" className="group flex flex-col bg-background p-8 transition hover:bg-secondary/30 md:p-12">
            <LifeBuoy className="h-6 w-6 text-primary" />
            <p className="eyebrow mt-4">Fastest Response</p>
            <p className="mt-2 font-display text-2xl md:text-3xl">Submit a Ticket in your Suite</p>
            <p className="mt-2 text-sm text-muted-foreground">Log in to the Preparer Suite and open a support ticket — our team is notified instantly and you can track progress to resolution.</p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm text-primary">
              Go to your Suite <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
          <div className="flex flex-col bg-background p-8 md:p-12">
            <Ticket className="h-6 w-6 text-primary" />
            <p className="eyebrow mt-4">Already a client?</p>
            <p className="mt-2 font-display text-2xl">Track your tickets.</p>
            <p className="mt-2 text-sm text-muted-foreground">All tickets you submit are tracked in the Preparer Suite under Support. View status updates, responses, and resolution history — all in one place.</p>
            <Link to="/suite" className="group mt-auto inline-flex items-center gap-1.5 pt-6 text-sm text-primary">
              Access the Preparer Suite <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}