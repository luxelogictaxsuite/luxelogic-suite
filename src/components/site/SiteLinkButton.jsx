import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useSiteLinks, useSettings } from '@/hooks/useSiteData';

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-highlight hover:text-highlight-foreground',
  light: 'bg-secondary text-primary hover:bg-highlight hover:text-highlight-foreground',
  outline: 'border border-foreground/30 text-foreground hover:border-highlight hover:text-highlight',
  ghost: 'text-foreground hover:text-highlight px-0',
};

// Every outbound link resolves from the Links Manager by key.
// While links are loading, renders a disabled placeholder — never a blank
// href or mailto fallback. Once loaded, if no URL is saved, falls back to
// emailing the office.
export default function SiteLinkButton({ linkKey, children, variant = 'primary', params, className = '', size = 'md', showKey = false }) {
  const { links, isLoading } = useSiteLinks();
  const { settings } = useSettings();
  const link = links[linkKey];
  const label = link?.label || linkKey;

  let href = link?.url;
  if (href && params) {
    const u = new URL(href);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    href = u.toString();
  }
  const external = !!href;
  const fallback = `mailto:${settings.business_email || ''}?subject=${encodeURIComponent(label)}`;
  const sizes = size === 'lg' ? 'h-14 px-8 text-base' : size === 'sm' ? 'h-10 px-4 text-sm' : 'h-12 px-6 text-[15px]';

  // While links are loading, render a disabled placeholder — no blank hrefs.
  if (isLoading) {
    return (
      <span
        className={`inline-flex cursor-wait items-center justify-center gap-2 font-medium tracking-tight opacity-40 ${variant === 'ghost' ? 'h-auto' : sizes} ${VARIANTS[variant]} ${className}`}
        aria-disabled="true"
      >
        <span>{children}</span>
        <ArrowUpRight className="h-4 w-4" />
      </span>
    );
  }

  return (
    <a
      href={href || fallback}
      title={label}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`group relative inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-300 ${variant === 'ghost' ? 'h-auto' : sizes} ${VARIANTS[variant]} ${className}`}
    >
      <span>{children}</span>
      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      {showKey && variant !== 'ghost' && (
        <span className="pointer-events-none absolute -bottom-5 left-0 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          [KEY: {linkKey}]
        </span>
      )}
    </a>
  );
}