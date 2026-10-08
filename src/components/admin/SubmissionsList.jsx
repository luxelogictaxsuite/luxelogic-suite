import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, ChevronDown, ChevronRight, FileText, Printer, Paperclip, Mail, Archive } from 'lucide-react';
import { downloadSubmissionPDF, printSubmission, downloadAttachments } from '@/lib/submissionPdf';
import MissingDocsDialog from '@/components/admin/MissingDocsDialog';

const STATUSES = ['New', 'Under Review', 'Approved', 'Incomplete', 'Completed', 'Archived'];
const STATUS_COLORS = {
  'New': 'bg-highlight/15 text-highlight',
  'Under Review': 'bg-blue-100 text-blue-700',
  'Approved': 'bg-green-100 text-green-700',
  'Incomplete': 'bg-orange-100 text-orange-700',
  'Completed': 'bg-green-100 text-green-800',
  'Archived': 'bg-secondary text-muted-foreground',
};

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

function displayValue(v) {
  if (typeof v === 'object' && v !== null) return v.name ? `[Attached: ${v.name}]` : '[Attached file]';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v || '—');
}

export default function SubmissionsList() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(null);
  const [missingDocs, setMissingDocs] = useState(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ['formSubmissions'],
    queryFn: () => base44.entities.FormSubmission.list('-created_date', 200),
  });

  const groups = useMemo(() => {
    const map = new Map();
    data.forEach(s => {
      const key = s.form_name || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return [...map.entries()];
  }, [data]);

  const setStatus = async (id, status) => { await base44.entities.FormSubmission.update(id, { status }); qc.invalidateQueries({ queryKey: ['formSubmissions'] }); };
  const del = async (id) => { if (confirm('Delete this submission? This cannot be undone.')) { await base44.entities.FormSubmission.delete(id); qc.invalidateQueries({ queryKey: ['formSubmissions'] }); } };
  const archive = async (id) => { await base44.entities.FormSubmission.update(id, { status: 'Archived' }); qc.invalidateQueries({ queryKey: ['formSubmissions'] }); };

  if (isLoading) return <div className="h-40 animate-pulse bg-card" />;
  if (!data.length) return <p className="text-muted-foreground">No submissions yet.</p>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">All submissions are stored securely with admin-only access. Sensitive documents and private uploads are never included in notification emails. Use the actions below to review, print, download, or follow up on each submission.</p>
      {groups.map(([name, items]) => (
        <div key={name}>
          <div className="flex items-center gap-3 border-b-2 border-foreground py-3">
            <h3 className="font-display text-2xl">{name}</h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{items.length}</span>
          </div>
          <div className="border-t border-border">
            {items.map(s => {
              let rows = []; try { rows = Object.entries(JSON.parse(s.submission_data || '{}')); } catch {}
              const isOpen = open === s.id;
              const statusClass = STATUS_COLORS[s.status] || STATUS_COLORS['New'];
              return (
                <div key={s.id} className="border-b border-border">
                  <div className="flex flex-wrap items-center gap-3 p-4">
                    <button onClick={() => setOpen(isOpen ? null : s.id)} className="inline-flex items-center gap-2 font-medium">{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{s.form_name || 'Form'}</button>
                    <span className="text-xs text-muted-foreground">{fmtDate(s.created_date)}</span>
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${statusClass}`}>{s.status}</span>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <select value={s.status} onChange={e => setStatus(s.id, e.target.value)} className="h-9 rounded-none border border-input bg-transparent px-2 text-sm">
                        {STATUSES.map(st => <option key={st}>{st}</option>)}
                      </select>
                      <div className="flex gap-1">
                        <button onClick={() => downloadSubmissionPDF(s)} title="Download PDF" className="inline-flex h-9 w-9 items-center justify-center border border-border hover:border-primary"><FileText className="h-3.5 w-3.5" /></button>
                        <button onClick={() => printSubmission(s)} title="Print" className="inline-flex h-9 w-9 items-center justify-center border border-border hover:border-primary"><Printer className="h-3.5 w-3.5" /></button>
                        <button onClick={() => downloadAttachments(s)} title="Download Attachments" className="inline-flex h-9 w-9 items-center justify-center border border-border hover:border-primary"><Paperclip className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setMissingDocs(s)} title="Request Documents" className="inline-flex h-9 w-9 items-center justify-center border border-border hover:border-primary"><Mail className="h-3.5 w-3.5" /></button>
                        <button onClick={() => archive(s.id)} title="Archive" className="inline-flex h-9 w-9 items-center justify-center border border-border hover:border-primary"><Archive className="h-3.5 w-3.5" /></button>
                        <button onClick={() => del(s.id)} title="Delete" className="inline-flex h-9 w-9 items-center justify-center border border-border text-destructive hover:border-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                  {isOpen && (
                    <dl className="grid gap-1 px-4 pb-5 text-sm md:grid-cols-2">
                      {rows.map(([k, v]) => <div key={k} className="flex gap-2"><dt className="text-muted-foreground">{k}:</dt><dd>{displayValue(v)}</dd></div>)}
                    </dl>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {missingDocs && <MissingDocsDialog submission={missingDocs} onClose={() => setMissingDocs(null)} />}
    </div>
  );
}