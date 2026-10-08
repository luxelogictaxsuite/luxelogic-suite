import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHero from '@/components/site/PageHero';
import DynamicForm from '@/components/site/DynamicForm';

const isObjectId = (s) => /^[0-9a-f]{24}$/i.test(s || '');

// Resolves either a form ID or a human-readable slug (e.g. /form/client-intake).
export default function FormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resolvedId, setResolvedId] = useState(isObjectId(id) ? id : null);
  const [notFound, setNotFound] = useState(false);

  const { data: forms } = useQuery({
    queryKey: ['formDefs'],
    queryFn: () => base44.entities.FormDefinition.list('sort_order', 200),
    enabled: !isObjectId(id),
  });

  useEffect(() => {
    if (isObjectId(id)) return;
    if (forms) {
      const match = forms.find(f => f.slug === id);
      if (match) setResolvedId(match.id);
      else setNotFound(true);
    }
  }, [id, forms]);

  return (
    <>
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 py-3 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>
      <PageHero eyebrow="Form" title={<>Complete<br /><em className="text-muted-foreground">your form.</em></>}>
        Fill out the fields below and submit — the office is notified instantly.
      </PageHero>
      <section className="border-b border-border">
        <div className="mx-auto max-w-2xl px-5 py-16 md:px-8 md:py-24">
          {notFound ? (
            <p className="text-center text-muted-foreground">This form could not be found.</p>
          ) : resolvedId ? (
            <DynamicForm key={resolvedId} formId={resolvedId} />
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading form…</div>
          )}
        </div>
      </section>
    </>
  );
}