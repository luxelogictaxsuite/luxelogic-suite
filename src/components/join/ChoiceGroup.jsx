import React from 'react';

export default function ChoiceGroup({ options, value, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} className={`border px-4 py-4 text-left transition ${value === o ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'}`}>
          {o}
        </button>
      ))}
    </div>
  );
}