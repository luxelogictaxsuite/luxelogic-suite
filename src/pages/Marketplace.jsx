import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHero from '@/components/site/PageHero';
import Section from '@/components/site/Section';
import ProductSlab from '@/components/marketplace/ProductSlab';

export default function Marketplace() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.MarketplaceProduct.filter({ active: true }, 'sort_order', 50),
  });
  return (
    <>
      <PageHero eyebrow="A La Carte Marketplace" title={<>Purchase for yourself<br /><em className="text-primary">or your whole team.</em></>}>
        Buy individual seats or group packages. Every purchase auto-assigns seats to your team.
      </PageHero>
      <Section num="01" eyebrow="Products" title="Choose your package.">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-80 animate-pulse bg-card" />)}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">{data.map((p) => <ProductSlab key={p.id} p={p} />)}</div>
        )}
      </Section>
    </>
  );
}