-- =====================================================================
-- LuxeLogic Tax Suite — initial Supabase schema
-- Migrated from the Base44 entity definitions in /base44/entities.
--
-- What this file sets up:
--   1. profiles            — one row per login, holds the admin/user role
--   2. 19 business tables  — same fields as Base44, same record ids
--   3. Row Level Security  — the "who can see what" rules, enforced by
--                            the database itself (not by the browser)
--   4. Guard triggers      — stop preparers from editing locked fields,
--                            changing their own comp tier, filing their
--                            own returns, or writing their own earnings
--   5. Earnings trigger    — calculates preparer share server-side
--   6. Private storage     — locked bucket for uploaded tax documents
--
-- Run once in Supabase → SQL Editor on a NEW project.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------

-- Lower-cased email of the logged-in user ('' when logged out).
create or replace function public.current_email()
returns text language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- Keeps updated_date fresh on every update (Base44 did this automatically).
create or replace function public.touch_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 1. Profiles (replaces Base44's built-in User entity)
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  role          text not null default 'user' check (role in ('admin','user')),
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now()
);
create unique index profiles_email_idx on public.profiles (lower(email));

-- Every new login automatically gets a profile with role 'user'.
-- Admins are promoted by hand (see bottom of file) — never by the browser.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Is the logged-in user an admin?
-- SECURITY DEFINER so it can read profiles without tripping RLS recursion.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

create policy "profiles: read own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- Only admins can change roles. Users cannot promote themselves.
create policy "profiles: admin update"
  on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_date();

-- ---------------------------------------------------------------------
-- 2. Preparers  (created before the helper that depends on it)
-- ---------------------------------------------------------------------
create table public.preparers (
  id                  text primary key default gen_random_uuid()::text,
  name                text not null,
  email               text not null,
  ptin                text,
  phone               text,
  comp_tier           text not null default '70/30' check (comp_tier in ('70/30','80/20')),
  ce_hours_completed  numeric default 0,
  ce_hours_required   numeric default 15,
  training_seat_key   text,
  locked_fields       text default '[]',   -- JSON array of field names
  active              boolean not null default true,
  created_date        timestamptz not null default now(),
  updated_date        timestamptz not null default now(),
  created_by          text
);
create unique index preparers_email_idx on public.preparers (lower(email));

-- Is the logged-in user an ACTIVE preparer?
-- Deactivating a preparer (active = false) instantly cuts off every
-- preparer-scoped table below — this is the "deactivate access" switch.
create or replace function public.is_active_preparer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.preparers
    where lower(email) = public.current_email() and active
  );
$$;

-- Shorthand used by most policies: "this row belongs to me and I'm active".
create or replace function public.owns_row(row_email text)
returns boolean language sql stable as $$
  select lower(coalesce(row_email,'')) = public.current_email()
         and public.current_email() <> ''
         and public.is_active_preparer();
$$;

alter table public.preparers enable row level security;

create policy "preparers: read own or admin"
  on public.preparers for select
  using (public.is_admin() or lower(email) = public.current_email());
create policy "preparers: admin insert"
  on public.preparers for insert with check (public.is_admin());
create policy "preparers: update own or admin"
  on public.preparers for update
  using (public.is_admin() or (lower(email) = public.current_email() and active))
  with check (public.is_admin() or (lower(email) = public.current_email() and active));
create policy "preparers: admin delete"
  on public.preparers for delete using (public.is_admin());

-- Guard: preparers may edit their own profile, but never their email,
-- comp tier, active flag, the lock list itself, or any locked field.
-- (In Base44 this was only enforced on screen.)
create or replace function public.guard_preparer_update()
returns trigger language plpgsql as $$
declare
  locked jsonb;
  f text;
begin
  if public.is_admin() then return new; end if;

  if new.email is distinct from old.email
     or new.comp_tier is distinct from old.comp_tier
     or new.active is distinct from old.active
     or new.locked_fields is distinct from old.locked_fields then
    raise exception 'Only an admin can change email, comp tier, access, or locked fields';
  end if;

  begin
    locked := coalesce(old.locked_fields, '[]')::jsonb;
  exception when others then
    locked := '[]'::jsonb;
  end;

  for f in select jsonb_array_elements_text(locked) loop
    if (to_jsonb(new) -> f) is distinct from (to_jsonb(old) -> f) then
      raise exception 'The field "%" is locked by your admin', f;
    end if;
  end loop;

  return new;
end $$;

create trigger preparers_guard before update on public.preparers
  for each row execute function public.guard_preparer_update();
create trigger preparers_touch before update on public.preparers
  for each row execute function public.touch_updated_date();

-- ---------------------------------------------------------------------
-- 3. Client assignments (the Return Queue)
-- ---------------------------------------------------------------------
create table public.client_assignments (
  id                     text primary key default gen_random_uuid()::text,
  client_name            text not null,
  client_email           text,
  client_phone           text,
  preparer_name          text,
  preparer_email         text not null,
  form_submission_id     text,
  intake_summary         text,
  status                 text not null default 'Awaiting Documents'
                         check (status in ('Awaiting Documents','Ready for Review','In Progress',
                                           'Needs Correction','Filed','Funded')),
  review_requested_date  timestamptz,
  return_fee             numeric,
  filing_status          text,
  claims_eitc            boolean default false,
  claims_ctc             boolean default false,
  claims_hoh             boolean default false,
  notes                  text,
  created_date           timestamptz not null default now(),
  updated_date           timestamptz not null default now(),
  created_by             text
);
create index client_assignments_preparer_idx on public.client_assignments (lower(preparer_email));
create index client_assignments_submission_idx on public.client_assignments (form_submission_id);

alter table public.client_assignments enable row level security;

create policy "assignments: read own or admin"
  on public.client_assignments for select
  using (public.is_admin() or public.owns_row(preparer_email));
create policy "assignments: admin insert"
  on public.client_assignments for insert with check (public.is_admin());
create policy "assignments: update own or admin"
  on public.client_assignments for update
  using (public.is_admin() or public.owns_row(preparer_email))
  with check (public.is_admin() or public.owns_row(preparer_email));
create policy "assignments: admin delete"
  on public.client_assignments for delete using (public.is_admin());

-- Guard: preparers work their own returns but can't reassign them,
-- rewrite client identity, or mark them Filed/Funded (admin files).
create or replace function public.guard_assignment_update()
returns trigger language plpgsql as $$
begin
  if public.is_admin() then return new; end if;

  if new.preparer_email is distinct from old.preparer_email
     or new.preparer_name is distinct from old.preparer_name
     or new.form_submission_id is distinct from old.form_submission_id
     or new.client_name is distinct from old.client_name
     or new.client_email is distinct from old.client_email
     or new.client_phone is distinct from old.client_phone then
    raise exception 'Only an admin can reassign a return or change client identity';
  end if;

  if new.status is distinct from old.status
     and (new.status in ('Filed','Funded') or old.status in ('Filed','Funded')) then
    raise exception 'Only an admin can move a return into or out of Filed/Funded';
  end if;

  return new;
end $$;

create trigger assignments_guard before update on public.client_assignments
  for each row execute function public.guard_assignment_update();
create trigger assignments_touch before update on public.client_assignments
  for each row execute function public.touch_updated_date();

-- ---------------------------------------------------------------------
-- 4. Earnings — written ONLY by the database, never by the browser
-- ---------------------------------------------------------------------
create table public.earnings (
  id              text primary key default gen_random_uuid()::text,
  assignment_id   text references public.client_assignments(id) on delete set null,
  client_name     text not null,
  preparer_email  text not null,
  return_fee      numeric not null,
  tier            text not null default '70/30' check (tier in ('70/30','80/20')),
  preparer_share  numeric,
  firm_share      numeric generated always as (return_fee - coalesce(preparer_share,0)) stored,
  status          text not null default 'Pending' check (status in ('Pending','Paid')),
  paid_date       date,
  created_date    timestamptz not null default now(),
  updated_date    timestamptz not null default now(),
  created_by      text
);
create unique index earnings_assignment_idx on public.earnings (assignment_id) where assignment_id is not null;
create index earnings_preparer_idx on public.earnings (lower(preparer_email));

alter table public.earnings enable row level security;

create policy "earnings: read own or admin"
  on public.earnings for select
  using (public.is_admin() or public.owns_row(preparer_email));
-- Only admins may touch earnings directly (e.g. mark Paid).
create policy "earnings: admin insert" on public.earnings for insert with check (public.is_admin());
create policy "earnings: admin update" on public.earnings for update using (public.is_admin()) with check (public.is_admin());
create policy "earnings: admin delete" on public.earnings for delete using (public.is_admin());

create trigger earnings_touch before update on public.earnings
  for each row execute function public.touch_updated_date();

-- Same business rule as src/lib/earnings.js, now server-side:
-- an earning exists only for a Funded return with a fee > 0.
-- Tier comes from the preparer's record, not from the browser.
-- Paid earnings are never deleted or rewritten automatically.
create or replace function public.sync_earning()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tier  text;
  v_fee   numeric := coalesce(new.return_fee, 0);
  v_share numeric;
  v_existing public.earnings;
begin
  select * into v_existing from public.earnings where assignment_id = new.id;

  if new.status <> 'Funded' or v_fee <= 0 then
    if found and v_existing.status = 'Pending' then
      delete from public.earnings where id = v_existing.id;
    end if;
    return new;
  end if;

  select comp_tier into v_tier from public.preparers
   where lower(email) = lower(new.preparer_email);
  v_tier  := coalesce(v_tier, '70/30');
  v_share := round(v_fee * case when v_tier = '80/20' then 0.80 else 0.70 end, 2);

  if found and v_existing.status = 'Paid' then
    return new;  -- already paid out: leave history untouched
  end if;

  insert into public.earnings (assignment_id, client_name, preparer_email, return_fee, tier, preparer_share, status)
  values (new.id, new.client_name, new.preparer_email, v_fee, v_tier, v_share, 'Pending')
  on conflict (assignment_id) where assignment_id is not null
  do update set client_name    = excluded.client_name,
                preparer_email = excluded.preparer_email,
                return_fee     = excluded.return_fee,
                tier           = excluded.tier,
                preparer_share = excluded.preparer_share;
  return new;
end $$;

create trigger assignments_sync_earning
  after insert or update of status, return_fee, preparer_email on public.client_assignments
  for each row execute function public.sync_earning();

-- ---------------------------------------------------------------------
-- 5. Form definitions & submissions
-- ---------------------------------------------------------------------
create table public.form_definitions (
  id               text primary key default gen_random_uuid()::text,
  name             text not null,
  slug             text,
  description      text,
  category         text not null default 'General'
                   check (category in ('Tax Clients','Join Team','Software','General')),
  success_message  text,
  fields           text not null default '[]',   -- JSON array, same as Base44
  active           boolean default true,
  coming_soon      boolean default false,
  form_status      text default 'accepting' check (form_status in ('accepting','coming_soon','closed')),
  sort_order       numeric default 0,
  created_date     timestamptz not null default now(),
  updated_date     timestamptz not null default now(),
  created_by       text
);
create unique index form_definitions_slug_idx on public.form_definitions (slug) where slug is not null;

create table public.form_submissions (
  id                  text primary key default gen_random_uuid()::text,
  form_definition_id  text not null,
  form_name           text,
  submission_data     text not null,   -- JSON; contains PII and private file paths
  status              text not null default 'New'
                      check (status in ('New','Under Review','Approved','Incomplete','Completed','Archived')),
  created_date        timestamptz not null default now(),
  updated_date        timestamptz not null default now(),
  created_by          text
);
create index form_submissions_def_idx on public.form_submissions (form_definition_id);

alter table public.form_definitions enable row level security;
alter table public.form_submissions enable row level security;

create policy "form_definitions: public read" on public.form_definitions for select using (true);
create policy "form_definitions: admin insert" on public.form_definitions for insert with check (public.is_admin());
create policy "form_definitions: admin update" on public.form_definitions for update using (public.is_admin()) with check (public.is_admin());
create policy "form_definitions: admin delete" on public.form_definitions for delete using (public.is_admin());

-- Anyone (including logged-out clients) may SUBMIT a form, but only as
-- status 'New', and only to a form that is currently accepting.
create policy "form_submissions: public submit"
  on public.form_submissions for insert
  with check (
    status = 'New'
    and exists (
      select 1 from public.form_definitions d
      where d.id = form_definition_id
        and coalesce(d.active, true)
        and coalesce(d.form_status, 'accepting') = 'accepting'
    )
  );

-- Is this submission the intake of a client assigned to the logged-in,
-- active preparer? SECURITY DEFINER so the check works for every role.
create or replace function public.is_my_clients_submission(sub_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.client_assignments a
    where a.form_submission_id = sub_id
      and public.owns_row(a.preparer_email)
  );
$$;

-- Admins see everything. NEW: a preparer can view the full intake of a
-- client assigned to them (fixes "nowhere to see the intake form").
create policy "form_submissions: admin or assigned preparer read"
  on public.form_submissions for select
  using (public.is_admin() or public.is_my_clients_submission(id));
create policy "form_submissions: admin update" on public.form_submissions for update using (public.is_admin()) with check (public.is_admin());
create policy "form_submissions: admin delete" on public.form_submissions for delete using (public.is_admin());

create trigger form_definitions_touch before update on public.form_definitions
  for each row execute function public.touch_updated_date();
create trigger form_submissions_touch before update on public.form_submissions
  for each row execute function public.touch_updated_date();

-- ---------------------------------------------------------------------
-- 6. Preparer-scoped work tables
-- ---------------------------------------------------------------------
create table public.document_requests (
  id              text primary key default gen_random_uuid()::text,
  assignment_id   text references public.client_assignments(id) on delete cascade,
  client_name     text not null,
  client_email    text,
  preparer_email  text not null,
  document_name   text not null,
  status          text not null default 'Requested' check (status in ('Requested','Received','Rejected')),
  notes           text,
  created_date    timestamptz not null default now(),
  updated_date    timestamptz not null default now(),
  created_by      text
);

create table public.due_diligence_items (
  id              text primary key default gen_random_uuid()::text,
  assignment_id   text not null references public.client_assignments(id) on delete cascade,
  client_name     text not null,
  preparer_email  text not null,
  item_label      text not null,
  checked         boolean default false,
  sort_order      numeric default 0,
  created_date    timestamptz not null default now(),
  updated_date    timestamptz not null default now(),
  created_by      text
);

create table public.support_tickets (
  id              text primary key default gen_random_uuid()::text,
  subject         text not null,
  client_name     text,
  client_email    text,
  preparer_email  text not null,
  category        text default 'Other'
                  check (category in ('Return Question','Document Issue','Refund','Software','Billing','Other')),
  priority        text default 'Normal' check (priority in ('Low','Normal','High','Urgent')),
  status          text not null default 'Open' check (status in ('Open','In Progress','Resolved','Closed')),
  message         text,
  created_date    timestamptz not null default now(),
  updated_date    timestamptz not null default now(),
  created_by      text
);

create table public.training_sessions (
  id              text primary key default gen_random_uuid()::text,
  title           text not null,
  date            date,
  hours           numeric not null default 0,
  category        text default 'Other CE'
                  check (category in ('Annual Federal Tax Law Refresher','Ethics','Other CE',
                                      'Firm Onboarding','Software Training')),
  preparer_email  text not null,
  preparer_name   text,
  attended        boolean default false,
  created_date    timestamptz not null default now(),
  updated_date    timestamptz not null default now(),
  created_by      text
);

-- document_requests, due_diligence_items, support_tickets share one rule set:
-- read/create/update own (active preparer) or admin; delete admin only.
do $$
declare t text;
begin
  foreach t in array array['document_requests','due_diligence_items','support_tickets'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy "%1$s: read own or admin" on public.%1$I for select
                     using (public.is_admin() or public.owns_row(preparer_email))$p$, t);
    execute format($p$create policy "%1$s: create own or admin" on public.%1$I for insert
                     with check (public.is_admin() or public.owns_row(preparer_email))$p$, t);
    execute format($p$create policy "%1$s: update own or admin" on public.%1$I for update
                     using (public.is_admin() or public.owns_row(preparer_email))
                     with check (public.is_admin() or public.owns_row(preparer_email))$p$, t);
    execute format($p$create policy "%1$s: admin delete" on public.%1$I for delete
                     using (public.is_admin())$p$, t);
    execute format('create trigger %1$s_touch before update on public.%1$I
                    for each row execute function public.touch_updated_date()', t);
    execute format('create index %1$s_preparer_idx on public.%1$I (lower(preparer_email))', t);
  end loop;
end $$;

-- Extra guard: a preparer can only attach requests/checklist items to
-- returns that are actually assigned to them.
create or replace function public.guard_child_of_own_assignment()
returns trigger language plpgsql as $$
begin
  if public.is_admin() or new.assignment_id is null then return new; end if;
  if not exists (
    select 1 from public.client_assignments a
    where a.id = new.assignment_id
      and lower(a.preparer_email) = lower(new.preparer_email)
  ) then
    raise exception 'That return is not assigned to you';
  end if;
  return new;
end $$;

create trigger document_requests_guard before insert or update on public.document_requests
  for each row execute function public.guard_child_of_own_assignment();
create trigger due_diligence_items_guard before insert or update on public.due_diligence_items
  for each row execute function public.guard_child_of_own_assignment();

-- training_sessions: preparers read their own; only admins write.
alter table public.training_sessions enable row level security;
create policy "training_sessions: read own or admin" on public.training_sessions for select
  using (public.is_admin() or public.owns_row(preparer_email));
create policy "training_sessions: admin insert" on public.training_sessions for insert with check (public.is_admin());
create policy "training_sessions: admin update" on public.training_sessions for update using (public.is_admin()) with check (public.is_admin());
create policy "training_sessions: admin delete" on public.training_sessions for delete using (public.is_admin());
create trigger training_sessions_touch before update on public.training_sessions
  for each row execute function public.touch_updated_date();

-- ---------------------------------------------------------------------
-- 7. Public lead-capture tables (anyone submits, only admin reads)
-- ---------------------------------------------------------------------
create table public.client_waitlist (
  id                 text primary key default gen_random_uuid()::text,
  full_name          text not null,
  phone              text not null,
  email              text,
  dependents         numeric default 0,
  filing_status      text default 'Single'
                     check (filing_status in ('Single','Married Filing Jointly','Married Filing Separately',
                                              'Head of Household','Qualifying Surviving Spouse')),
  preferred_contact  text default 'Phone' check (preferred_contact in ('Phone','Email','Text')),
  preparer_name      text,
  notes              text,
  status             text not null default 'Waiting' check (status in ('Waiting','Contacted','Onboarded')),
  created_date       timestamptz not null default now(),
  updated_date       timestamptz not null default now(),
  created_by         text
);

create table public.demo_requests (
  id            text primary key default gen_random_uuid()::text,
  full_name     text not null,
  email         text not null,
  phone         text,
  software      text default 'TaxSlayer Pro' check (software in ('TaxSlayer Pro','OLT Pro','Both')),
  efin          text,
  office_size   text,
  notes         text,
  status        text not null default 'New' check (status in ('New','Contacted','Scheduled')),
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now(),
  created_by    text
);

create table public.preparer_applications (
  id                   text primary key default gen_random_uuid()::text,
  full_name            text not null,
  email                text not null,
  phone                text,
  city_state           text,
  ptin                 text not null,
  years_experience     text check (years_experience in ('New preparer','1-2 years','3-5 years','6+ years')),
  projected_returns    numeric,
  software_preference  text check (software_preference in ('TaxSlayer Pro','OLT Pro','No preference')),
  notes                text,
  status               text not null default 'New' check (status in ('New','Reviewing','Approved','Declined')),
  created_date         timestamptz not null default now(),
  updated_date         timestamptz not null default now(),
  created_by           text
);

create table public.software_purchases (
  id              text primary key default gen_random_uuid()::text,
  full_name       text not null,
  email           text not null,
  phone           text,
  software        text not null default 'TaxSlayer Pro'
                  check (software in ('TaxSlayer Pro','OLT Pro','Both','70/30 Membership')),
  efin            text,
  office_size     text,
  notes           text,
  price           numeric,          -- NEW: editable list price (fix list)
  amount_paid     numeric,          -- set by Stripe webhook / admin only
  status          text not null default 'New'
                  check (status in ('New','Registration Sent','Registered','Build Started','Completed')),
  paid            boolean not null default false,
  payment_method  text check (payment_method in ('Stripe','Manual','Free')),
  created_date    timestamptz not null default now(),
  updated_date    timestamptz not null default now(),
  created_by      text
);
create index software_purchases_email_idx on public.software_purchases (lower(email));

-- Same rule set for all four: public insert (with status locked to the
-- starting value so nobody can submit themselves as "paid" or
-- "Approved"), admin-only read/update/delete.
do $$
declare
  t text;
  start_check text;
begin
  foreach t in array array['client_waitlist','demo_requests','preparer_applications','software_purchases'] loop
    start_check := case t
      when 'client_waitlist'    then $c$status = 'Waiting'$c$
      when 'software_purchases' then $c$status = 'New' and paid = false and amount_paid is null and payment_method is null$c$
      else $c$status = 'New'$c$
    end;
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%1$s: public submit" on public.%1$I for insert with check (%2$s)', t, start_check);
    execute format('create policy "%1$s: admin read" on public.%1$I for select using (public.is_admin())', t);
    execute format('create policy "%1$s: admin update" on public.%1$I for update using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "%1$s: admin delete" on public.%1$I for delete using (public.is_admin())', t);
    execute format('create trigger %1$s_touch before update on public.%1$I
                    for each row execute function public.touch_updated_date()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 8. Public site content (anyone reads, only admin writes)
-- ---------------------------------------------------------------------
create table public.faqs (
  id            text primary key default gen_random_uuid()::text,
  question      text not null,
  answer        text not null,
  category      text default 'Software' check (category in ('Software','General')),
  sort_order    numeric default 0,
  active        boolean default true,
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now(),
  created_by    text
);

create table public.form_links (
  id            text primary key default gen_random_uuid()::text,
  title         text not null,
  description   text,
  category      text not null default 'Tax Clients'
                check (category in ('Tax Clients','Join Team','Software','General')),
  url           text not null,
  sort_order    numeric default 0,
  active        boolean default true,
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now(),
  created_by    text
);

create table public.marketplace_products (
  id                text primary key default gen_random_uuid()::text,
  name              text not null,
  brand             text,
  price             numeric not null,
  seats_included    numeric default 1,
  extra_seat_price  numeric,
  description       text,
  link_key          text not null,
  active            boolean default true,
  sort_order        numeric default 0,
  created_date      timestamptz not null default now(),
  updated_date      timestamptz not null default now(),
  created_by        text
);

create table public.resources (
  id            text primary key default gen_random_uuid()::text,
  title         text not null,
  url           text not null,
  description   text,
  category      text default 'Article' check (category in ('Article','FAQ','Link')),
  sort_order    numeric default 0,
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now(),
  created_by    text
);

create table public.site_links (
  id            text primary key default gen_random_uuid()::text,
  key           text not null unique,
  label         text not null,
  url           text,
  updated_at    timestamptz,
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now(),
  created_by    text
);

create table public.site_settings (
  id            text primary key default gen_random_uuid()::text,
  key           text not null unique,
  label         text,
  value         text,
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now(),
  created_by    text
);

do $$
declare t text;
begin
  foreach t in array array['faqs','form_links','marketplace_products','resources','site_links','site_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%1$s: public read" on public.%1$I for select using (true)', t);
    execute format('create policy "%1$s: admin insert" on public.%1$I for insert with check (public.is_admin())', t);
    execute format('create policy "%1$s: admin update" on public.%1$I for update using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "%1$s: admin delete" on public.%1$I for delete using (public.is_admin())', t);
    execute format('create trigger %1$s_touch before update on public.%1$I
                    for each row execute function public.touch_updated_date()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 9. Table privileges for Supabase's built-in roles
--    (RLS above decides WHICH rows; these decide which tables at all)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on public.form_submissions, public.client_waitlist, public.demo_requests,
                public.preparer_applications, public.software_purchases to anon;
-- Logged-out visitors can never see these, even by accident:
revoke select on public.profiles, public.preparers, public.client_assignments, public.earnings,
                 public.document_requests, public.due_diligence_items, public.support_tickets,
                 public.training_sessions from anon;

-- ---------------------------------------------------------------------
-- 10. Private document storage (replaces Base44 UploadPrivateFile)
-- ---------------------------------------------------------------------
-- Locked bucket: no public URLs. 25 MB cap, documents and images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-uploads', 'private-uploads', false, 26214400,
        array['application/pdf','image/jpeg','image/png','image/heic','image/heif','image/webp',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

-- Clients (logged in or not) can drop files into the intake/ folder,
-- but nobody can list or read them back except admins. Preparers get
-- short-lived download links through a server function that checks
-- the file belongs to one of their assigned clients.
create policy "uploads: anyone can add intake files"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'private-uploads' and (storage.foldername(name))[1] = 'intake');

create policy "uploads: admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'private-uploads' and public.is_admin());

create policy "uploads: admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'private-uploads' and public.is_admin());

-- =====================================================================
-- AFTER RUNNING: make yourself an admin.
-- 1. Sign up on the new site (or Authentication → Users → Add user).
-- 2. Then run (with your login email):
--      update public.profiles set role = 'admin'
--      where lower(email) = lower('YOUR-EMAIL-HERE');
-- =====================================================================
