// =====================================================================
// LuxeLogic data client — Supabase edition.
//
// This file replaces the Base44 SDK. It deliberately keeps the SAME shape
// (`base44.entities.X.list()`, `base44.auth.me()`, ...) so the ~45 pages
// and components that use it keep working unchanged. Everything here talks
// to Supabase; nothing talks to Base44 anymore.
//
// Security does NOT live in this file. Every read and write is checked by
// the Row Level Security rules in supabase/migrations — this browser code
// can only ever see what the logged-in user is allowed to see.
// =====================================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Fails loudly in development instead of silently showing an empty site.
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
}

// Sessions live in sessionStorage: they survive a page refresh but end when
// the tab or browser closes (same "log out on close" behavior as before).
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// ---------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------

// Base44 entity name → Supabase table name.
const TABLES = {
  ClientAssignment: 'client_assignments',
  ClientWaitlist: 'client_waitlist',
  DemoRequest: 'demo_requests',
  DocumentRequest: 'document_requests',
  DueDiligenceItem: 'due_diligence_items',
  Earning: 'earnings',
  FAQ: 'faqs',
  FormDefinition: 'form_definitions',
  FormLink: 'form_links',
  FormSubmission: 'form_submissions',
  MarketplaceProduct: 'marketplace_products',
  Preparer: 'preparers',
  PreparerApplication: 'preparer_applications',
  Resource: 'resources',
  SiteLink: 'site_links',
  SiteSetting: 'site_settings',
  SoftwarePurchase: 'software_purchases',
  SupportTicket: 'support_tickets',
  TrainingSession: 'training_sessions',
  User: 'profiles',
};

// Columns the database manages itself — never sent from the browser.
const READ_ONLY = new Set(['created_date', 'updated_date', 'firm_share']);

class DataError extends Error {
  constructor(error, status) {
    super(error?.message || 'Request failed');
    this.status = status ?? (error?.code === '42501' ? 403 : 400);
    this.code = error?.code;
    this.details = error?.details;
  }
}

function unwrap({ data, error, status }) {
  if (error) throw new DataError(error, status);
  return data;
}

// '-created_date' → order by created_date desc;  'sort_order' → asc.
function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  const column = desc ? sort.slice(1) : sort;
  return query.order(column, { ascending: !desc, nullsFirst: false });
}

function applyRange(query, limit, skip) {
  if (!limit && !skip) return query;
  const from = skip || 0;
  const to = from + (limit || 1000) - 1;
  return query.range(from, to);
}

// Escape % and _ so an email can be matched literally, case-insensitively.
const likeLiteral = (v) => String(v).replace(/[\\%_]/g, (c) => `\\${c}`);

function applyFilter(query, criteria = {}) {
  for (const [key, value] of Object.entries(criteria)) {
    if (value === undefined) continue;
    if (value === null) query = query.is(key, null);
    // Emails are compared case-insensitively (Base44 treated them loosely too).
    else if (/email$/i.test(key) && typeof value === 'string') query = query.ilike(key, likeLiteral(value));
    else query = query.eq(key, value);
  }
  return query;
}

function clean(data = {}) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (!READ_ONLY.has(k) && v !== undefined) out[k] = v;
  }
  return out;
}

async function currentEmail() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.email || null;
}

function makeEntity(name) {
  const table = TABLES[name];
  if (!table) throw new Error(`Unknown entity: ${name}`);

  return {
    async list(sort, limit, skip) {
      let q = supabase.from(table).select('*');
      q = applyRange(applySort(q, sort), limit, skip);
      return unwrap(await q) || [];
    },

    async filter(criteria, sort, limit, skip) {
      let q = applyFilter(supabase.from(table).select('*'), criteria);
      q = applyRange(applySort(q, sort), limit, skip);
      return unwrap(await q) || [];
    },

    async get(id) {
      const data = unwrap(await supabase.from(table).select('*').eq('id', id).maybeSingle());
      if (!data) throw new DataError({ message: `${name} not found` }, 404);
      return data;
    },

    // Public forms are submitted by logged-out visitors, who are allowed to
    // INSERT but not to read rows back. So the id is generated here and the
    // row is only re-read when someone is logged in.
    async create(data) {
      const row = { id: crypto.randomUUID(), ...clean(data) };
      const email = await currentEmail();
      if (email && !row.created_by) row.created_by = email;
      unwrap(await supabase.from(table).insert(row));
      if (!email) return { ...row, created_date: new Date().toISOString() };
      const saved = await supabase.from(table).select('*').eq('id', row.id).maybeSingle();
      return saved.data || { ...row, created_date: new Date().toISOString() };
    },

    async bulkCreate(items = []) {
      const email = await currentEmail();
      const rows = items.map((d) => ({
        id: crypto.randomUUID(),
        ...(email ? { created_by: email } : {}),
        ...clean(d),
      }));
      if (!rows.length) return [];
      return unwrap(await supabase.from(table).insert(rows).select('*')) || rows;
    },

    async update(id, data) {
      const rows = unwrap(await supabase.from(table).update(clean(data)).eq('id', id).select('*'));
      // An update that matched nothing means "not yours" or "doesn't exist".
      if (!rows || rows.length === 0) throw new DataError({ message: 'You do not have access to update this record' }, 403);
      return rows[0];
    },

    async delete(id) {
      unwrap(await supabase.from(table).delete().eq('id', id));
      return { id };
    },

    // Live updates. Supabase only delivers rows the user may read (RLS).
    subscribe(callback) {
      const channel = supabase
        .channel(`${table}-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          const type = { INSERT: 'create', UPDATE: 'update', DELETE: 'delete' }[payload.eventType];
          callback({ type, id: (payload.new || payload.old)?.id, data: payload.new });
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    },
  };
}

const entities = new Proxy({}, {
  get(cache, name) {
    if (typeof name !== 'string') return undefined;
    if (!cache[name]) cache[name] = makeEntity(name);
    return cache[name];
  },
});

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------
const siteUrl = () => (typeof window !== 'undefined' ? window.location.origin : '');

const auth = {
  async isAuthenticated() {
    const { data } = await supabase.auth.getSession();
    return !!data?.session;
  },

  // Returns the logged-in user in the same shape Base44 did:
  // { id, email, full_name, role }.
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new DataError({ message: 'Not logged in' }, 401);
    const { data: profile } = await supabase
      .from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      role: profile?.role || 'user',
      created_date: user.created_at,
    };
  },

  async loginViaEmailPassword(email, password) {
    unwrap(await supabase.auth.signInWithPassword({ email, password }));
  },

  async loginWithProvider(provider, returnTo) {
    unwrap(await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: returnTo ? new URL(returnTo, siteUrl()).href : siteUrl() },
    }));
  },

  // Sign-up sends a 6-digit code (Supabase "Confirm signup" email template
  // must include {{ .Token }}). verifyOtp completes it.
  async register({ email, password }) {
    unwrap(await supabase.auth.signUp({ email, password }));
  },

  async verifyOtp({ email, otpCode }) {
    const data = unwrap(await supabase.auth.verifyOtp({ email, token: otpCode, type: 'email' }));
    return { access_token: data?.session?.access_token };
  },

  async resendOtp(email) {
    unwrap(await supabase.auth.resend({ type: 'signup', email }));
  },

  // Supabase manages the session itself after verifyOtp; nothing to store.
  setToken() {},

  async resetPasswordRequest(email) {
    unwrap(await supabase.auth.resetPasswordForEmail(email, {
      // ?token= keeps the existing ResetPassword page's link check happy;
      // the real proof is the one-time code Supabase adds to this URL.
      redirectTo: `${siteUrl()}/reset-password?token=email-link`,
    }));
  },

  async resetPassword({ newPassword }) {
    unwrap(await supabase.auth.updateUser({ password: newPassword }));
  },

  async logout(redirectUrl) {
    await supabase.auth.signOut();
    try { localStorage.removeItem('ll_last_activity'); } catch { /* ignore */ }
    if (redirectUrl !== false && typeof window !== 'undefined') {
      window.location.href = redirectUrl || '/';
    }
  },

  redirectToLogin(returnTo) {
    const target = returnTo || window.location.href;
    window.location.href = `/login?return_to=${encodeURIComponent(target)}`;
  },
};

// ---------------------------------------------------------------------
// Server functions (Netlify Functions in /netlify/functions)
// ---------------------------------------------------------------------
async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function callFunction(name, payload = {}) {
  const res = await fetch(`/.netlify/functions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new DataError({ message: body?.error || `${name} failed` }, res.status);
  // Base44's invoke() wrapped results as { data }.
  return { data: body };
}

const functions = { invoke: callFunction };

// ---------------------------------------------------------------------
// Files (private tax documents)
// ---------------------------------------------------------------------
const BUCKET = 'private-uploads';

const integrations = {
  Core: {
    // Uploads go to private-uploads/intake/<random>/<name>. The returned
    // file_uri is a storage path, not a public link.
    async UploadPrivateFile({ file }) {
      const safeName = String(file?.name || 'upload').replace(/[^\w.-]+/g, '_').slice(-120);
      const path = `intake/${crypto.randomUUID()}/${safeName}`;
      unwrap(await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file?.type || undefined,
      }));
      return { file_uri: `${BUCKET}/${path}` };
    },

    // Short-lived (5 minute) download link. Admins get it directly; preparers
    // get it through a server function that checks the client is theirs.
    async CreateFileSignedUrl({ file_uri, expires_in = 300 }) {
      const path = String(file_uri || '').replace(new RegExp(`^${BUCKET}/`), '');
      const direct = await supabase.storage.from(BUCKET).createSignedUrl(path, expires_in);
      if (!direct.error && direct.data?.signedUrl) return { signed_url: direct.data.signedUrl };
      const { data } = await callFunction('signFileUrl', { file_uri });
      return { signed_url: data?.signed_url };
    },
  },
};

// ---------------------------------------------------------------------
// Admin user management (needs server-side privileges)
// ---------------------------------------------------------------------
const users = {
  inviteUser: (email, role = 'user') => callFunction('inviteUser', { email, role }),
};

// Base44 used this to load app-level settings; nothing to fetch now.
const app = {
  async getPublicSettings() { return { id: 'luxelogic', public_settings: {} }; },
};

export const base44 = { entities, auth, functions, integrations, users, app };
export default base44;
