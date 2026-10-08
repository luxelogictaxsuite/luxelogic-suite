import React from 'react';
import PageHero from '@/components/site/PageHero';
import LuxeLogicIncludes from '@/components/site/LuxeLogicIncludes';
import NextLink from '@/components/site/NextLink';

export default function WhatLuxeLogicDoes() {
  return (
    <>
      <PageHero eyebrow="Why LuxeLogic" title={<>What LuxeLogic<br /><em className="text-muted-foreground">does for you.</em></>}>
        Most providers sell you software and walk away. LuxeLogic wraps every purchase in full-service support — from setup through the last return of the season.
      </PageHero>
      <LuxeLogicIncludes num="01" />
      <NextLink to="/software" eyebrow="Next" title="Explore Software" />
    </>
  );
}