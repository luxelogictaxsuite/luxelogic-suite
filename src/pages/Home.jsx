import React from 'react';
import HeroBlades from '@/components/home/HeroBlades';
import QuickLinksRow from '@/components/home/QuickLinksRow';
import HomeDeadline from '@/components/home/HomeDeadline';
import MarketplaceTeaser from '@/components/home/MarketplaceTeaser';

export default function Home() {
  return (
    <>
      <HeroBlades />
      <QuickLinksRow />
      <HomeDeadline />
      <MarketplaceTeaser />
    </>
  );
}