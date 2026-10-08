import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function NextLink({ to, eyebrow, title }) {
  return (
    <section className="border-t border-border">
      <Link to={to} className="group flex items-center justify-between px-5 py-12 transition-colors hover:bg-secondary/50 md:px-8 md:py-16">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <p className="mt-2 font-display text-3xl md:text-5xl">{title}</p>
        </div>
        <ArrowRight className="h-8 w-8 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-2" />
      </Link>
    </section>
  );
}