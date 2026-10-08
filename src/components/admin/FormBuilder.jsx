import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, Pencil, ExternalLink, Copy, MessageSquare, Clock, Check } from 'lucide-react';

const FIELD_TYPES = ['heading', 'text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'choice', 'checkbox', 'file', 'signature'];
const CATEGORIES = ['Tax Clients', 'Join Team', 'Software', 'General'];

const blank = () => ({ name: '', slug: '', description: '', category: 'General', success_message: '', fields: [], active: true, coming_soon: false, form_status: 'accepting', sort_order: 0 });

const slugify = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

export default function FormBuilder() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [viewingSubs, setViewingSubs] = useState(null);
  const [copied, setCopied] = useState(null);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['formDefs'],
    queryFn: () => base44.entities.FormDefinition.list('sort_order', 100),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['formSubmissions'],
    queryFn: () => base44.entities.FormSubmission.list('-created_date', 500),
  });

  const subCounts = useMemo(() => {
    const m = {};
    submissions.forEach(s => { m[s.form_definition_id] = (m[s.form_definition_id] || 0) + 1; });
    return m;
  }, [submissions]);

  const grouped = useMemo(() => {
    const map = new Map();
    CATEGORIES.forEach(c => map.set(c, []));
    forms.forEach(f => {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category).push(f);
    });
    return [...map.entries()].filter(([, items]) => items.length > 0);
  }, [forms]);

  const save = async (def) => {
    const payload = { ...def, fields: JSON.stringify(def.fields || []) };
    if (def.id) await base44.entities.FormDefinition.update(def.id, payload);
    else await base44.entities.FormDefinition.create(payload);
    qc.invalidateQueries({ queryKey: ['formDefs'] });
    setEditing(null);
  };

  const del = async (f) => {
    if (!confirm(`Delete "${f.name}"? Submissions are kept.`)) return;
    await base44.entities.FormDefinition.delete(f.id);
    qc.invalidateQueries({ queryKey: ['formDefs'] });
  };

  const copyLink = (f) => {
    const url = `https://luxelogictaxsuite.com/form/${f.slug || f.id}`;
    navigator.clipboard.writeText(url);
    setCopied(f.id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (editing) return <FormEditor def={editing} onCancel={() => setEditing(null)} onSave={save} saving={false} />;

  return (
    <div>
      <p className="mb-6 text-sm text-muted-foreground">Build and manage native forms — grouped by site section. Each form shows its live link, submission count, and version history. Submissions are saved and emailed to the office automatically.</p>
      <button onClick={() => setEditing(blank())} className="mb-8 inline-flex h-11 items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-highlight hover:text-highlight-foreground"><Plus className="h-4 w-4" /> New form</button>

      {isLoading ? (
        <div className="h-40 animate-pulse bg-card" />
      ) : (
        <div className="space-y-10">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-3 border-b-2 border-foreground pb-3">
                <h3 className="font-display text-2xl">{category}</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{items.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {items.map(f => {
                  const fieldCount = (() => { try { return JSON.parse(f.fields || '[]').length; } catch { return 0; } })();
                  const url = `https://luxelogictaxsuite.com/form/${f.slug || f.id}`;
                  const subs = submissions.filter(s => s.form_definition_id === f.id);
                  const isViewing = viewingSubs === f.id;
                  return (
                    <div key={f.id} className="border border-border">
                      <div className="flex flex-wrap items-center gap-4 p-4">
                        <div className="min-w-[200px] flex-1">
                          <p className="font-display text-xl">{f.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{fieldCount} fields</span>
                            <span>·</span>
                            <span className={(f.form_status || (f.coming_soon ? 'coming_soon' : 'accepting')) === 'coming_soon' ? 'text-highlight' : (f.form_status || 'accepting') === 'closed' ? 'text-destructive' : f.active ? 'text-success' : ''}>{(f.form_status || (f.coming_soon ? 'coming_soon' : 'accepting')) === 'coming_soon' ? 'Coming Soon' : (f.form_status || 'accepting') === 'closed' ? 'Closed' : f.active ? 'Live' : 'Hidden'}</span>
                            <span>·</span>
                            <Clock className="h-3 w-3" />
                            <span>Created {fmtDate(f.created_date)}</span>
                            {f.updated_date && f.updated_date !== f.created_date && (<><span>·</span><span>Updated {fmtDate(f.updated_date)}</span></>)}
                          </div>
                        </div>

                        {/* Form link + copy + open */}
                        <div className="flex items-center gap-1">
                          <code className="hidden max-w-[200px] truncate border border-border bg-muted/40 px-2 py-1.5 font-mono text-[11px] text-muted-foreground lg:block">/form/{f.slug || f.id}</code>
                          <button onClick={() => copyLink(f)} title="Copy link" className="inline-flex h-9 w-9 items-center justify-center border border-border hover:border-primary">
                            {copied === f.id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <a href={url} target="_blank" rel="noopener noreferrer" title="Open form on site" className="inline-flex h-9 w-9 items-center justify-center border border-border hover:border-primary"><ExternalLink className="h-3.5 w-3.5" /></a>
                        </div>

                        {/* Submissions */}
                        <button onClick={() => setViewingSubs(isViewing ? null : f.id)} className="inline-flex h-9 items-center gap-2 border border-border px-3 text-sm hover:border-primary">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {subCounts[f.id] || 0} submission{(subCounts[f.id] || 0) !== 1 ? 's' : ''}
                        </button>

                        {/* Edit / Delete */}
                        <div className="flex gap-1">
                          <button onClick={() => setEditing({ ...f, fields: JSON.parse(f.fields || '[]') })} className="inline-flex h-9 items-center gap-2 border border-border px-3 text-sm hover:border-primary"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                          <button onClick={() => del(f)} className="inline-flex h-9 w-9 items-center justify-center border border-border text-destructive hover:border-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>

                      {/* Inline submissions */}
                      {isViewing && (
                        <div className="border-t border-border bg-muted/20 p-4">
                          {subs.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">No submissions yet for this form.</p>
                          ) : (
                            <div className="space-y-2">
                              {subs.slice(0, 20).map(s => {
                                let rows = []; try { rows = Object.entries(JSON.parse(s.submission_data || '{}')); } catch {}
                                return (
                                  <div key={s.id} className="border border-border bg-background p-3">
                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                      <span className="font-medium">{fmtDateTime(s.created_date)}</span>
                                      <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${s.status === 'New' ? 'bg-highlight/15 text-highlight' : 'text-muted-foreground'}`}>{s.status}</span>
                                    </div>
                                    <dl className="mt-2 grid gap-1 text-sm md:grid-cols-2">
                                      {rows.map(([k, v]) => <div key={k} className="flex gap-2"><dt className="text-muted-foreground">{k}:</dt><dd className="truncate">{String(v)}</dd></div>)}
                                    </dl>
                                  </div>
                                );
                              })}
                              {subs.length > 20 && <p className="pt-2 text-center text-xs text-muted-foreground">Showing 20 of {subs.length}. See the Submissions tab for all.</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {!forms.length && <p className="text-muted-foreground">No forms yet. Click "New form" to build your first.</p>}
        </div>
      )}
    </div>
  );
}

function FormEditor({ def, onCancel, onSave, saving }) {
  const [d, setD] = useState(def);
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setD({ ...d, [k]: v });
  const addField = () => setD({ ...d, fields: [...d.fields, { label: '', type: 'text', required: false, placeholder: '', options: '' }] });
  const updField = (i, patch) => setD({ ...d, fields: d.fields.map((f, idx) => idx === i ? { ...f, ...patch } : f) });
  const delField = (i) => setD({ ...d, fields: d.fields.filter((_, idx) => idx !== i) });
  const move = (i, dir) => { const arr = [...d.fields]; const j = i + dir; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; setD({ ...d, fields: arr }); };

  const handleSave = async () => {
    const finalDef = { ...d, slug: d.slug?.trim() || slugify(d.name) };
    setSubmitting(true);
    try { await onSave(finalDef); } catch (e) { alert('Save failed: ' + (e.message || 'unknown error')); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-3xl">{d.id ? 'Edit form' : 'New form'}</h3>
        <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div><Label className="eyebrow">Form name</Label><Input value={d.name} onChange={e => set('name', e.target.value)} className="mt-2 rounded-none bg-transparent" /></div>
        <div><Label className="eyebrow">URL slug</Label><Input value={d.slug} onChange={e => set('slug', e.target.value)} placeholder={slugify(d.name) || 'auto-from-name'} className="mt-2 rounded-none bg-transparent font-mono text-sm" /><p className="mt-1 text-xs text-muted-foreground">Leave blank to auto-generate from the name. Link: luxelogictaxsuite.com/form/<span className="font-mono">{d.slug?.trim() || slugify(d.name) || '…'}</span></p></div>
        <div><Label className="eyebrow">Section</Label><select value={d.category} onChange={e => set('category', e.target.value)} className="mt-2 h-10 w-full rounded-none border border-input bg-transparent px-2">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        <div className="md:col-span-2"><Label className="eyebrow">Description (shown above the form)</Label><Input value={d.description} onChange={e => set('description', e.target.value)} className="mt-2 rounded-none bg-transparent" /></div>
        <div className="md:col-span-2"><Label className="eyebrow">Success message</Label><Input value={d.success_message} onChange={e => set('success_message', e.target.value)} placeholder="Thank you — we'll be in touch." className="mt-2 rounded-none bg-transparent" /></div>
        <div><Label className="eyebrow">Sort order</Label><Input type="number" value={d.sort_order} onChange={e => set('sort_order', +e.target.value)} className="mt-2 rounded-none bg-transparent" /></div>
        <div className="flex flex-wrap items-end gap-6 pb-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.active} onChange={e => set('active', e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Live on site</label>
          <div className="flex items-center gap-2 text-sm">
            <span>Submissions:</span>
            <select value={d.form_status || (d.coming_soon ? 'coming_soon' : 'accepting')} onChange={e => { set('form_status', e.target.value); set('coming_soon', e.target.value === 'coming_soon'); }} className="h-9 rounded-none border border-input bg-transparent px-2">
              <option value="accepting">Accepting</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-display text-2xl">Fields</h4>
          <button type="button" onClick={addField} className="inline-flex h-9 items-center gap-2 border border-border px-3 text-sm hover:border-primary"><Plus className="h-3.5 w-3.5" /> Add field</button>
        </div>
        <div className="space-y-3">
          {d.fields.map((f, i) => (
            <div key={i} className="grid gap-2 border border-border p-3 md:grid-cols-12 md:items-center">
              <Input value={f.label} onChange={e => updField(i, { label: e.target.value })} placeholder="Field label" className="rounded-none bg-transparent md:col-span-3" />
              <select value={f.type} onChange={e => updField(i, { type: e.target.value })} className="h-9 rounded-none border border-input bg-transparent px-2 md:col-span-2">{FIELD_TYPES.map(t => <option key={t}>{t}</option>)}</select>
              {(f.type === 'select' || f.type === 'choice')
                ? <Input value={f.options} onChange={e => updField(i, { options: e.target.value })} placeholder="Options, comma-separated" className="rounded-none bg-transparent md:col-span-3" />
                : <Input value={f.placeholder} onChange={e => updField(i, { placeholder: e.target.value })} placeholder="Placeholder" className="rounded-none bg-transparent md:col-span-3" />}
              <label className="flex items-center gap-2 text-xs md:col-span-2"><input type="checkbox" checked={f.required} onChange={e => updField(i, { required: e.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" /> Required</label>
              <div className="flex gap-1 md:col-span-2 md:justify-end">
                <button type="button" onClick={() => move(i, -1)} className="inline-flex h-9 w-9 items-center justify-center border border-border hover:border-primary"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} className="inline-flex h-9 w-9 items-center justify-center border border-border hover:border-primary"><ChevronDown className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => delField(i)} className="inline-flex h-9 w-9 items-center justify-center border border-border text-destructive hover:border-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {!d.fields.length && <p className="text-sm text-muted-foreground">No fields yet. Add one to get started.</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="h-11 px-5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
        <button onClick={handleSave} disabled={!d.name.trim() || submitting} className="inline-flex h-11 items-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-highlight hover:text-highlight-foreground disabled:opacity-40">{submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save form</button>
      </div>
    </div>
  );
}