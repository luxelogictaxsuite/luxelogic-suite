import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Countdown from '@/components/site/Countdown';
import Reveal from '@/components/site/Reveal';
import { useSettings } from '@/hooks/useSiteData';

export default function HomeDeadline() {
  const { settings } = useSettings();
  const mode = settings.countdown_mode || 'extension';
  const extDeadline = settings.extension_deadline;
  const extPassed = extDeadline ? new Date(extDeadline) < new Date() : false;
  const isTaxSeason = mode === 'tax_season' || extPassed;

  const { data: intake } = useQuery({
    queryKey: ['intakeForm'],
    queryFn: () => base44.entities.FormDefinition.filter({ active: true, category: 'Tax Clients' }, 'sort_order', 1),
  });
  const intakeUrl = intake?.[0] ? `/form/${intake[0].id}` : null;
  return (
    <section className="border-b border-border grid-scaffold">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-12 md:px-8 md:py-28">
        <Reveal className="md:col-span-5">
          <h2 className="font-display text-5xl leading-[0.95] md:text-6xl">
            {isTaxSeason ? 'Tax season is almost here.' : 'Filed an extension? The clock is running.'}
          </h2>
          <p className="mt-6 text-muted-foreground">
            {isTaxSeason
              ? 'Get ready for January 2nd — start your return or prepare your office for the season ahead.'
              : 'Start your return today and let our preparers handle the rest before the final deadline.'}
          </p>
          <div className="mt-8">
            {intakeUrl ? (
              <Link to={intakeUrl} className="inline-flex h-14 items-center gap-2 bg-primary px-8 font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">Start My Return</Link>
            ) : (
              <span className="inline-flex h-14 items-center gap-2 border border-dashed border-border px-8 font-medium text-muted-foreground">Client intake coming soon</span>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.15} className="md:col-span-7"><Countdown /></Reveal>
      </div>
    </section>
  );
}