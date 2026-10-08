import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

// Renders a native <select> on desktop and a bottom-sheet picker on mobile WebViews.
export default function MobileSelect({ value, onChange, options, placeholder = 'Select…', label, className = '' }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const opts = options || [];
  const selectedLabel = opts.find(o => o.value === value)?.label || '';

  const triggerCls = `flex w-full items-center justify-between rounded-none border border-input bg-transparent px-3 text-left ${value ? 'text-foreground' : 'text-muted-foreground'} ${className}`;

  if (!isMobile) {
    return (
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={triggerCls}
      >
        <option value="">{placeholder}</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button type="button" className={triggerCls} onClick={() => setOpen(true)}>
          <span className={value ? '' : 'text-muted-foreground'}>{value ? selectedLabel : placeholder}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="pb-safe">
        <DrawerHeader className="text-left">
          {label && <DrawerTitle className="font-display text-2xl">{label}</DrawerTitle>}
        </DrawerHeader>
        <div className="max-h-[60vh] overflow-y-auto pb-4">
          <button
            type="button"
            onClick={() => { onChange?.(''); setOpen(false); }}
            className="flex w-full items-center justify-between px-4 py-4 text-left text-muted-foreground hover:bg-accent"
          >
            <span>{placeholder}</span>
            {value === '' && <Check className="h-4 w-4 text-primary" />}
          </button>
          {opts.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange?.(o.value); setOpen(false); }}
              className="flex w-full items-center justify-between border-t border-border px-4 py-4 text-left hover:bg-accent"
            >
              <span className={value === o.value ? 'text-foreground' : 'text-muted-foreground'}>{o.label}</span>
              {value === o.value && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}