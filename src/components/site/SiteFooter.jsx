import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useSettings } from '@/hooks/useSiteData';
import { useIsPreparer } from '@/hooks/useIsPreparer';
import SiteLinkButton from '@/components/site/SiteLinkButton';
import { LOGO_FULL } from '@/lib/brand';

const FOOTER_GROUPS = [
  { title: 'For Clients', links: [
    { to: '/tax-clients', label: 'Tax Clients' },
    { to: '/waitlist', label: 'Waitlist' },
  ]},
  { title: 'For Tax Pros', links: [
    { to: '/software', label: 'EROs & Software' },
    { to: '/smartwiz', label: 'SmartWiz AI' },
    { to: '/join', label: 'Join the Team' },
  ]},
  { title: 'Learn', links: [
    { to: '/live-education', label: 'Live Education' },
    { to: '/marketplace', label: 'Marketplace' },
  ]},
  { title: 'Legal', links: [
    { to: '/about', label: 'About LuxeLogic' },
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms & Conditions' },
    { to: '/income-disclaimer', label: 'Income Disclaimer' },
    { to: '/refund-policy', label: 'Refund Policy' },
    { to: '/software-agreement', label: 'Software Agreement' },
  ]},
];

export default function SiteFooter() {
  const { settings, isLoading } = useSettings();
  const { isAdmin } = useIsPreparer();
  const phone = settings.business_phone || '';
  const email = settings.business_email || '';
  const address = settings.business_address || '';

  return (
    <footer id="contact" className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-12 md:px-8">
        <div className="md:col-span-4">
          <img src={LOGO_FULL} alt="LuxeLogic Tax Suite" className="mb-6 h-10 w-auto" />
          <p className="eyebrow mb-4">Speak with the office</p>
          <h2 className="font-display text-4xl leading-tight md:text-5xl">Precision, by appointment.</h2>
          <div className="mt-8">
            <SiteLinkButton linkKey="book_a_call" size="lg">Book a Call</SiteLinkButton>
          </div>
        </div>
        <div className="space-y-4 text-sm md:col-span-3">
          {/* Don't render contact links until settings are loaded — prevents blank/incorrect links */}
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-5 w-48 animate-pulse bg-secondary" />
              <div className="h-5 w-56 animate-pulse bg-secondary" />
              <div className="h-5 w-40 animate-pulse bg-secondary" />
            </div>
          ) : (
            <>
              {phone && <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="flex min-h-[44px] items-center gap-3 text-foreground hover:text-primary"><Phone className="h-4 w-4 shrink-0" />{phone}</a>}
              {email && <a href={`mailto:${email}`} className="flex min-h-[44px] items-center gap-3 text-foreground hover:text-primary"><Mail className="h-4 w-4 shrink-0" />{email}</a>}
              {address && <a href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-start gap-3 text-foreground hover:text-primary"><MapPin className="mt-1 h-4 w-4 shrink-0" />{address}</a>}
            </>
          )}
        </div>
        <nav className="grid grid-cols-2 gap-x-6 gap-y-6 md:col-span-5 md:grid-cols-4">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="eyebrow mb-3">{group.title}</p>
              <ul>
                {group.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="flex min-h-[44px] items-center text-sm text-foreground transition-colors hover:text-primary">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">© {new Date().getFullYear()} LuxeLogic Tax Suite® — All rights reserved. LuxeLogic® is a registered trademark.</span>
          {isAdmin && (
            <Link to="/admin" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground">Admin Suite</Link>
          )}
        </div>
      </div>
    </footer>
  );
}