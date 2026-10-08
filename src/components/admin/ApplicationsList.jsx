import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const STATUSES = ['New', 'Reviewing', 'Approved', 'Declined'];

export default function ApplicationsList() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['applications'], queryFn: () => base44.entities.PreparerApplication.list('-created_date', 200) });
  const setStatus = async (id, status) => {
    await base44.entities.PreparerApplication.update(id, { status });
    // Bridge: auto-create a Preparer record when approved so the PTIN flows
    // into the system — the admin can then add seat key, funded returns, etc.
    if (status === 'Approved') {
      const app = data.find(a => a.id === id);
      if (app?.email) {
        try {
          const res = await base44.functions.invoke('bridgePreparer', {
            full_name: app.full_name,
            email: app.email,
            ptin: app.ptin,
            phone: app.phone || '',
          });
          if (res.data?.bridged) {
            const crmOk = res.data?.crm_push === 'ok';
            toast.success(
              `Preparer record created for ${app.full_name} — PTIN bridged.` +
              (crmOk ? ' Profile pushed to CRM.' : ' CRM push pending — check logs.')
            );
          } else if (res.data?.reason === 'already_exists') {
            toast.info(`${app.full_name} already has a preparer record.`);
          } else {
            toast.error('Could not create preparer record: ' + (res.data?.error || 'unknown error'));
          }
        } catch (e) { toast.error('Could not create preparer record: ' + (e.message || 'unknown error')); }
      }
    }
    qc.invalidateQueries({ queryKey: ['applications'] });
    qc.invalidateQueries({ queryKey: ['preparers'] });
  };
  if (isLoading) return <div className="h-40 animate-pulse bg-card" />;
  if (!data.length) return <p className="text-muted-foreground">No applications yet.</p>;
  return (
    <div className="divide-y divide-border border-y border-border">
      {data.map((a) => (
        <div key={a.id} className="grid gap-3 py-5 md:grid-cols-12 md:items-center">
          <div className="md:col-span-4">
            <p className="font-display text-2xl">{a.full_name}</p>
            <p className="text-sm text-muted-foreground">{a.email}{a.phone ? ` · ${a.phone}` : ''}</p>
            {a.city_state && <p className="text-xs text-muted-foreground">{a.city_state}</p>}
          </div>
          <div className="text-sm md:col-span-5">
            <p><span className="text-muted-foreground">PTIN</span> <span className="font-mono">{a.ptin}</span></p>
            <p className="text-muted-foreground">{[a.years_experience, a.software_preference, a.projected_returns && `${a.projected_returns} projected returns`].filter(Boolean).join(' · ')}</p>
            {a.notes && <p className="mt-1 text-xs text-muted-foreground">"{a.notes}"</p>}
          </div>
          <div className="flex items-center gap-3 md:col-span-3 md:justify-end">
            <span className="font-mono text-[10px] text-muted-foreground">{format(new Date(a.created_date), 'MMM d, yyyy')}</span>
            <select value={a.status || 'New'} onChange={(e) => setStatus(a.id, e.target.value)} className="h-10 border border-input bg-background px-3 text-sm">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}