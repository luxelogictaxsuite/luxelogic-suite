-- Live updates for the Preparer Suite and Admin dashboards.
-- Supabase only broadcasts rows each user is allowed to read (RLS applies).
alter publication supabase_realtime add table
  public.client_assignments,
  public.earnings,
  public.support_tickets;
