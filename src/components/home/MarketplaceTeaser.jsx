import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import Reveal from '@/components/site/Reveal';

export default function MarketplaceTeaser() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-12 md:px-8 md:py-28">
        <Reveal className="md:col-span-5">
          <p className="eyebrow mb-5">A La Carte Marketplace</p>
          <h2 className="font-display text-5xl leading-[0.95] md:text-7xl">Training, by the seat.</h2>
          <p className="mt-6 text-muted-foreground">EarnCE self-paced training and TaxPrepBootcamp team packages — purchase individually or for your whole office, with seats assigned the moment payment clears.</p>
          <div className="mt-8 flex flex-wrap gap-8 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span>From <span className="text-foreground">$99</span></span>
            <span>Up to <span className="text-foreground">20 seats</span></span>
          </div>
          <Link to="/marketplace" className="mt-10 inline-flex h-12 items-center gap-2 bg-secondary px-6 font-medium text-primary transition hover:bg-secondary/90">
            Explore the marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
        <Reveal delay={0.15} className="md:col-span-7">
          <Link to="/marketplace" className="group block overflow-hidden border border-border">
            <Image src="https://media.base44.com/images/public/6ab71feb020c819bc103c46d/ff8f2bee3_generated_image.png" alt="Crystal prism on black surface" className="aspect-[4/3] w-full grayscale transition-all duration-700 group-hover:scale-[1.03] group-hover:grayscale-0" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}