import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ExternalLink } from 'lucide-react';

export default function ResourceDashboard() {
  const { data: resources = [] } = useQuery({ queryKey: ['suiteResources'], queryFn: () => base44.entities.Resource.list('sort_order', 200) });
  return (
    <div>
      <h2 className="font-display text-4xl">Resources</h2>
      <p className="mt-3 text-muted-foreground">Articles, FAQs and trusted links for you and your clients.</p>
      <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-2">
        {resources.map(r => (
          <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="block bg-background p-6 transition hover:bg-accent">
            <div className="flex items-center justify-between">
              <p className="font-display text-xl">{r.title}</p>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
            {r.description && <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>}
            <p className="mt-3 text-xs text-muted-foreground">{r.category}</p>
          </a>
        ))}
        {!resources.length && <p className="bg-background p-6 text-sm text-muted-foreground md:col-span-2">No resources published yet.</p>}
      </div>
    </div>
  );
}