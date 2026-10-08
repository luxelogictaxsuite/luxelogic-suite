import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, KeyRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSiteLinks } from '@/hooks/useSiteData';

const CATEGORY = ['Annual Federal Tax Law Refresher', 'Ethics', 'Other CE', 'Firm Onboarding', 'Software Training'];

export default function SuiteTraining() {
  const { me } = useOutletContext();
  const isAdmin = me?.role === 'admin';
  const myEmail = me?.email;
  const qc = useQueryClient();
  const { links } = useSiteLinks();
  const trainingUrl = links?.training_website?.url || 'https://taxprepbootcamp.com/wp-login.php?redirect_to=https%3A%2F%2Ftaxprepbootcamp.com%2Fmy-courses%2F';
  const registerUrl = links?.training_register?.url || 'https://taxprepbootcamp.com/';
  // Each preparer has their own seat key — pull it from their Preparer record.
  const { data: myPreparer } = useQuery({
    queryKey: ['myPreparerRecord', myEmail],
    queryFn: () => base44.entities.Preparer.filter({ email: myEmail }),
    enabled: !!myEmail,
  });
  const seatKey = myPreparer?.[0]?.training_seat_key || '';
  const { data: preparers = [] } = useQuery({ queryKey: ['suitePreparers'], queryFn: () => base44.entities.Preparer.list('name', 200) });
  const { data: allSessions = [] } = useQuery({ queryKey: ['training'], queryFn: () => base44.entities.TrainingSession.list('-date', 500) });
  const sessions = myEmail ? allSessions.filter(s => s.preparer_email === myEmail) : allSessions;
  const [f, setF] = useState({ title: '', date: '', hours: '', category: 'Annual Federal Tax Law Refresher', preparer_email: '' });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const create = async (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.preparer_email || !f.hours) return;
    const prep = preparers.find(p => p.email === f.preparer_email);
    await base44.entities.TrainingSession.create({
      title: f.title, date: f.date, hours: +f.hours, category: f.category,
      preparer_email: f.preparer_email, preparer_name: prep?.name || '', attended: false,
    });
    setF({ title: '', date: '', hours: '', category: 'Annual Federal Tax Law Refresher', preparer_email: '' });
    qc.invalidateQueries({ queryKey: ['training'] });
  };

  const toggle = async (s) => { await base44.entities.TrainingSession.update(s.id, { attended: !s.attended }); qc.invalidateQueries({ queryKey: ['training'] }); };
  const myHours = sessions.filter(s => s.attended).reduce((sum, s) => sum + (s.hours || 0), 0);

  return (
    <div>
      <h2 className="font-display text-4xl">Training &amp; Attendance</h2>
      <p className="mt-3 text-muted-foreground">CE sessions and firm training, with attendance and hours earned.</p>

      <div className="mt-6 border border-border bg-secondary/30 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl">Tax Prep Boot Camp</h3>
            <p className="mt-2 text-sm text-muted-foreground">Register your seat key first, then use the Sign In button to log in for all future visits.</p>
          </div>
          <a href={trainingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-highlight hover:text-highlight-foreground">
            Sign In <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-5 border border-dashed border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-highlight" />
            <span className="eyebrow">Your seat key</span>
          </div>
          <p className="mt-2 font-mono text-xl tracking-wider">{seatKey || '— Contact the office to receive your seat key'}</p>
          <a href={registerUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline">
            Register your seat key <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <p className="mt-6 text-sm">Hours attended this period: <strong>{myHours}</strong></p>
      {isAdmin && (
        <form onSubmit={create} className="mt-6 grid gap-3 border border-border p-5 md:grid-cols-12 md:items-end">
          <label className="md:col-span-4"><span className="eyebrow mb-1.5 block">Session title</span><input value={f.title} onChange={e => set('title', e.target.value)} className="h-10 w-full border border-input bg-background px-3 text-sm" /></label>
          <label className="md:col-span-3"><span className="eyebrow mb-1.5 block">Preparer</span>
            <select value={f.preparer_email} onChange={e => set('preparer_email', e.target.value)} className="h-10 w-full border border-input bg-background px-2 text-sm">
              <option value="">Select…</option>
              {preparers.map(p => <option key={p.id} value={p.email}>{p.name}</option>)}
            </select>
          </label>
          <label className="md:col-span-2"><span className="eyebrow mb-1.5 block">Date</span><input type="date" value={f.date} onChange={e => set('date', e.target.value)} className="h-10 w-full border border-input bg-background px-3 text-sm" /></label>
          <label className="md:col-span-1"><span className="eyebrow mb-1.5 block">Hrs</span><input type="number" value={f.hours} onChange={e => set('hours', e.target.value)} className="h-10 w-full border border-input bg-background px-3 text-sm" /></label>
          <label className="md:col-span-2"><span className="eyebrow mb-1.5 block">Category</span><select value={f.category} onChange={e => set('category', e.target.value)} className="h-10 w-full border border-input bg-background px-2 text-sm">{CATEGORY.map(c => <option key={c}>{c}</option>)}</select></label>
          <button type="submit" disabled={!f.title.trim() || !f.preparer_email || !f.hours} className="h-10 bg-primary px-4 text-sm text-primary-foreground disabled:opacity-30 md:col-span-12">Add session</button>
        </form>
      )}
      <div className="mt-6 divide-y divide-border border border-border">
        {sessions.map(s => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div><p className="font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{s.date} · {s.hours} hr · {s.category}{s.preparer_name ? ` · ${s.preparer_name}` : ''}</p></div>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!s.attended} onChange={() => toggle(s)} className="h-4 w-4 accent-primary" />Attended</label>
          </div>
        ))}
        {!sessions.length && <p className="p-5 text-sm text-muted-foreground">No training sessions logged.</p>}
      </div>
    </div>
  );
}