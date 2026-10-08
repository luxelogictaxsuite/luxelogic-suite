import { jsPDF } from 'jspdf';
import { base44 } from '@/api/base44Client';

const SAFE_NAME_LABELS = ['Full Legal First Name', 'First Name', 'First name', 'Legal First Name'];
const SAFE_LAST_LABELS = ['Full Legal Last Name', 'Last Name', 'Last name', 'Legal Last Name'];

function getField(data, labels) {
  for (const l of labels) {
    if (data[l]) return String(data[l]);
  }
  return '';
}

function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return String(d); }
}

function sanitizeFilename(s) {
  return String(s || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
}

// Generates a PDF for a secure submission. Only available to authenticated admins.
// Lists attached filenames without exposing public or signed URLs.
export function generateSubmissionPDF(submission) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  let data = {};
  try { data = JSON.parse(submission.submission_data || '{}'); } catch {}

  const firstName = getField(data, SAFE_NAME_LABELS);
  const lastName = getField(data, SAFE_LAST_LABELS);
  const subDate = formatDate(submission.created_date);
  const subId = String(submission.id || '').slice(-8);

  // Header — LuxeLogic branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(156, 121, 69); // Gold #9C7945
  doc.text('LuxeLogic Tax Suite', margin, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Secure Registration Submission', margin, 38);

  // Form name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 26, 26);
  doc.text(String(submission.form_name || 'Form Submission'), margin, 55);

  // Submission metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Submission ID: ${submission.id || '—'}`, margin, 65);
  doc.text(`Submitted: ${subDate}`, margin, 72);
  if (firstName || lastName) doc.text(`Applicant: ${firstName} ${lastName}`.trim(), margin, 79);

  // Confidential marking
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 50, 50);
  doc.text('CONFIDENTIAL — CONTAINS SENSITIVE PERSONAL INFORMATION', margin, 90);
  doc.setDrawColor(200, 50, 50);
  doc.setLineWidth(0.5);
  doc.line(margin, 93, pageWidth - margin, 93);

  // Submission data
  let y = 105;
  const lineHeight = 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(26, 26, 26);

  for (const [key, value] of Object.entries(data)) {
    let displayValue;
    if (typeof value === 'object' && value !== null) {
      // File upload — show filename only, never the URI
      if (value.name) displayValue = `[Attached: ${value.name}]`;
      else if (value.url) displayValue = '[Attached file]';
      else displayValue = '[Attached file]';
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No';
    } else {
      displayValue = String(value || '—');
    }

    // Wrap label and value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const labelLines = doc.splitTextToSize(String(key), pageWidth * 0.35);
    doc.setFont('helvetica', 'normal');
    const valueLines = doc.splitTextToSize(displayValue, pageWidth * 0.55);

    const maxLines = Math.max(labelLines.length, valueLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (y > pageHeight - 30) { doc.addPage(); y = 30; }
      if (i < labelLines.length) {
        doc.setFont('helvetica', 'bold');
        doc.text(labelLines[i], margin, y);
      }
      if (i < valueLines.length) {
        doc.setFont('helvetica', 'normal');
        doc.text(valueLines[i], margin + pageWidth * 0.37, y);
      }
      y += lineHeight;
    }
    y += 3;
  }

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, pageHeight - 10);
    doc.text('CONFIDENTIAL', margin, pageHeight - 10);
  }

  return { doc, filename: buildFilename(submission, firstName, lastName, subDate) };
}

function buildFilename(submission, firstName, lastName, subDate) {
  const formName = sanitizeFilename(submission.form_name || 'Form');
  const first = sanitizeFilename(firstName) || 'Unknown';
  const last = sanitizeFilename(lastName) || 'Unknown';
  const subId = String(submission.id || '').slice(-8);
  const dateStr = sanitizeFilename(subDate || new Date().toISOString().split('T')[0]).slice(0, 20);
  return `${formName}_${last}_${first}_${subId}_${dateStr}.pdf`;
}

export function downloadSubmissionPDF(submission) {
  const { doc, filename } = generateSubmissionPDF(submission);
  doc.save(filename);
}

// Opens a print-friendly window with the submission data.
export function printSubmission(submission) {
  let data = {};
  try { data = JSON.parse(submission.submission_data || '{}'); } catch {}
  const subDate = formatDate(submission.created_date);

  const rows = Object.entries(data).map(([k, v]) => {
    let val;
    if (typeof v === 'object' && v !== null) val = v.name ? `[Attached: ${v.name}]` : '[Attached file]';
    else if (typeof v === 'boolean') val = v ? 'Yes' : 'No';
    else val = String(v || '—');
    return `<tr><td style="padding:6px 12px;font-weight:bold;vertical-align:top;border:1px solid #ddd;">${escapeHtml(k)}</td><td style="padding:6px 12px;border:1px solid #ddd;">${escapeHtml(val)}</td></tr>`;
  }).join('');

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Secure Submission</title>
<style>body{font-family:Georgia,serif;color:#1a1a1a;max-width:700px;margin:40px auto;padding:0 20px;}
h1{color:#9C7945;font-size:24px;margin:0 0 4px;}
h2{font-size:18px;margin:0 0 16px;font-weight:normal;color:#666;}
.confidential{color:#c83232;font-weight:bold;font-size:11px;border:1px solid #c83232;padding:4px 8px;display:inline-block;margin:16px 0;}
table{width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;}
.meta{font-size:13px;color:#666;margin:8px 0;}
</style></head><body>
<h1>LuxeLogic Tax Suite</h1>
<h2>${escapeHtml(submission.form_name || 'Form Submission')}</h2>
<p class="meta">Submission ID: ${escapeHtml(submission.id || '—')}</p>
<p class="meta">Submitted: ${escapeHtml(subDate)}</p>
<div class="confidential">CONFIDENTIAL — CONTAINS SENSITIVE PERSONAL INFORMATION</div>
<table>${rows}</table>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
  win.document.close();
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Generates signed URLs for all private attachments in a submission.
export async function downloadAttachments(submission) {
  let data = {};
  try { data = JSON.parse(submission.submission_data || '{}'); } catch {}
  const files = Object.entries(data).filter(([, v]) => typeof v === 'object' && v !== null && (v.file_uri || v.url));
  for (const [, value] of files) {
    const fileUri = value.file_uri || value.url;
    if (!fileUri) continue;
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
      if (signed_url) window.open(signed_url, '_blank');
    } catch (e) { /* best-effort */ }
  }
}