-- Support for the Netlify server functions.

-- 1. One-time event log. Server functions record "I already sent this
--    notification" here so a public endpoint can't be called repeatedly to
--    spam clients, preparers, or admins. Server-only: RLS on, no policies.
create table public.function_events (
  key           text primary key,
  created_date  timestamptz not null default now()
);
alter table public.function_events enable row level security;
revoke all on public.function_events from anon, authenticated;

-- 2. The form name on a submission always comes from the real form
--    definition, never from what the browser sent. (Fixes notification
--    emails showing the wrong form name.)
create or replace function public.set_submission_form_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select name into new.form_name from public.form_definitions where id = new.form_definition_id;
  return new;
end $$;

create trigger form_submissions_set_name
  before insert on public.form_submissions
  for each row execute function public.set_submission_form_name();

-- 3. Size guard: full intakes (with signatures) are stored whole, but no
--    single submission may exceed ~5 MB.
alter table public.form_submissions
  add constraint form_submissions_size check (length(submission_data) < 5000000);
