import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Save, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SUITE_KEYS = [
  { key: 'preparer_suite_headline', label: 'Welcome Headline', placeholder: 'Welcome back' },
  { key: 'preparer_suite_subtext', label: 'Welcome Subtext', placeholder: 'Log in to manage your returns' },
  { key: 'preparer_suite_support_phone', label: 'Support Phone', placeholder: '(833) 589-3587' },
];

export default function PreparerSuiteConfig() {
  const qc = useQueryClient();
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: () => base44.entities.SiteSetting.list('key', 200),
  });
  const { data: links = [] } = useQuery({
    queryKey: ['siteLinks'],
    queryFn: () => base44.entities.SiteLink.list('key', 200),
  });

  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    const v = {};
    SUITE_KEYS.forEach(({ key }) => {
      const s = settings.find(s => s.key === key);
      v[key] = s?.value || '';
    });
    setValues(v);
  }, [settings]);

  const regLinks = links.filter(l => l.key?.startsWith('registration_') || l.key === 'crm_software_registration');

  const save = async (key) => {
    setSaving(key);
    try {
      const existing = settings.find(s => s.key === key);
      if (existing) {
        await base44.entities.SiteSetting.update(existing.id, { value: values[key] || '' });
      } else {
        const meta = SUITE_KEYS.find(k => k.key === key);
        await base44.entities.SiteSetting.create({ key, label: meta?.label || key, value: values[key] || '' });
      }
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['siteSettings'] });
    } catch (e) {
      toast.error(e.message || 'Could not save');
    }
    setSaving(null);
  };

  if (isLoading) return <div className="h-40 animate-pulse bg-muted" />;

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h3 className="mb-1 font-display text-2xl">Suite Branding</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          These settings control what preparers see when they log into the Preparer Suite.
        </p>
        <div className="space-y-5">
          {SUITE_KEYS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <Label className="eyebrow">{label}</Label>
              <div className="mt-2 flex gap-3">
                <Input
                  value={values[key] || ''}
                  onChange={e => setValues({ ...values, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="h-10 rounded-none bg-transparent"
                />
                <button
                  onClick={() => save(key)}
                  disabled={saving === key}
                  className="inline-flex h-10 shrink-0 items-center gap-2 bg-foreground px-4 text-sm text-background disabled:opacity-40"
                >
                  {saving === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-1 font-display text-2xl">Registration Links</h3>
        <p className="mb-6 text-sm text-muted-foreground">
          These links are emailed to purchasers after payment. Edit URLs in the Links Manager tab.
        </p>
        <div className="divide-y divide-border border border-border">
          {regLinks.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">No registration links configured yet.</p>
          )}
          {regLinks.map(l => (
            <div key={l.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">{l.key}</p>
                <p className="truncate text-sm">{l.url || '(not set)'}</p>
              </div>
              {l.url && (
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}