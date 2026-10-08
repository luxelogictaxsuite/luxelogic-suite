import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Lists editable external form links (FormLink) AND native built forms (FormDefinition) for a section.
export default function FormsSection({ category }) {
  const { data: links = [], isLoading: isLoadingLinks } = useQuery({
    queryKey: ['formLinks', category],
    queryFn: () => base44.entities.FormLink.filter({ active: true, category }, 'sort_order', 50),
  });
  const { data: forms = [], isLoading: isLoadingForms } = useQuery({
    queryKey: ['formDefsSection', category],
    queryFn: () => base44.entities.FormDefinition.filter({ active: true, category }, 'sort_order', 50),
  });
  const isLoading = isLoadingLinks || isLoadingForms;
  if (isLoading) return <div className="h-24 animate-pulse bg-card" />;
  const items = [
    ...links.map(l => ({ kind: 'link', id: l.id, title: l.title, name: l.title, description: l.description, url: l.url })),
    ...forms.map(f => { const fs = f.form_status || (f.coming_soon ? 'coming_soon' : 'accepting'); return { kind: 'native', id: f.id, title: f.name, name: f.name, description: f.description, coming_soon: fs === 'coming_soon', closed: fs === 'closed' }; }),
  ];
  if (!items.length) return <p className="text-muted-foreground">Forms will be posted here soon — check back shortly.</p>;
  return (
    <ul className="border-t border-border">
      {items.map((f) => (
        <li key={f.id}>
          {f.kind === 'link' ? (
            <a href={f.url} title={f.title} target="_blank" rel="noopener noreferrer" className="group flex items-baseline justify-between gap-4 border-b border-border py-6 transition-colors hover:bg-card md:px-4">
              <div>
                <span className="font-display text-2xl md:text-3xl">{f.title}</span>
                {f.description && <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>}
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 text-sm text-primary transition-colors group-hover:text-highlight">Open <ArrowUpRight className="h-4 w-4" /></span>
            </a>
          ) : (
            <Link to={`/form/${f.id}`} className="group flex items-baseline justify-between gap-4 border-b border-border py-6 transition-colors hover:bg-card md:px-4">
              <div>
                <span className="font-display text-2xl md:text-3xl">{f.name}</span>
                {f.description && <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>}
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 text-sm text-primary transition-colors group-hover:text-highlight">{f.coming_soon ? 'Coming Soon' : f.closed ? 'Closed' : 'Fill out'} <ArrowUpRight className="h-4 w-4" /></span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}