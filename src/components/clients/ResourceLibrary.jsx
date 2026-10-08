import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ResourceLibrary() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list('sort_order', 100),
  });
  if (isLoading) return <div className="h-40 animate-pulse bg-card" />;
  if (!data.length) return <p className="text-muted-foreground">New resources are on the way.</p>;
  return (
    <ul className="border-t border-border">
      {data.map((r, i) => (
        <li key={r.id}>
          <a href={r.url} title={r.title} target="_blank" rel="noopener noreferrer" className="group grid items-baseline gap-2 border-b border-border py-6 transition-colors hover:bg-card md:grid-cols-12 md:px-4">
            <span className="flex items-center gap-2 md:col-span-2">
              <span className="eyebrow">{r.category}</span>
              {i === 0 && <span className="rounded-full bg-highlight/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-highlight">New</span>}
            </span>
            <span className="font-display text-2xl md:col-span-4 md:text-3xl">{r.title}</span>
            <span className="text-sm text-muted-foreground md:col-span-5">{r.description}</span>
            <ArrowUpRight className="hidden h-5 w-5 justify-self-end text-muted-foreground transition group-hover:text-highlight md:col-span-1 md:block" />
          </a>
        </li>
      ))}
    </ul>
  );
}