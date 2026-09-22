-- ==========================================
-- Supabase Database Schema & RLS Policies
-- Application: Team Time-Tracking (Handshakers)
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. Create Profiles Table
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_super_admin BOOLEAN NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- 2. Create Time Logs Table
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID NULL,
  start_time_seconds INTEGER NOT NULL,
  stop_time_seconds INTEGER NOT NULL,
  is_end_of_day BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on time_logs
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- 3. Helper Functions & Triggers
-- ------------------------------------------

-- Safety net: any table created in the public schema starts with RLS enabled,
-- closing the classic Supabase footgun of a forgotten ALTER TABLE ... ENABLE
-- ROW LEVEL SECURITY exposing a new table over PostgREST. Runs with elevated
-- privileges to alter tables it doesn't otherwise own, but an event trigger
-- only fires on DDL — it is not a callable RPC endpoint, so EXECUTE is
-- revoked from every role below to keep it out of the exposed API surface.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog;

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();

-- Used by RLS policies on account_members and time_logs to list the accounts
-- the caller belongs to, without a policy on account_members recursing into
-- account_members itself. account_members and accounts are not declared in
-- this file — see the note at the end of this file.
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
RETURNS SETOF UUID AS $$
  SELECT account_id FROM public.account_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_user_workspaces() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_workspaces() TO authenticated;

-- Admin model: a super admin (profiles.is_super_admin) over everything, plus an
-- optional lead per workspace (account_members.role = 'admin') whose admin
-- powers apply inside that workspace only. profiles.role carries no meaning.
--
-- Reads the caller from auth.uid() rather than taking a user id, so it cannot
-- be used to probe whether other people are admins.
CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_account_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
      OR EXISTS (SELECT 1 FROM public.account_members
                 WHERE account_id = p_account_id AND user_id = auth.uid()
                   AND role = 'admin' AND COALESCE(status, 'active') = 'active');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.is_workspace_admin(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID) TO authenticated;

-- Automatic profile creation on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Only fires via the trigger above; no direct caller is legitimate. Postgres
-- already refuses a direct call structurally ("trigger functions can only be
-- called as triggers"), but the grant is revoked too so it doesn't show up as
-- a callable SECURITY DEFINER endpoint in the API surface.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ------------------------------------------
-- 4. RLS Policies: Profiles Table
-- ------------------------------------------

-- Read: Authenticated users can read all profiles (to see team members)
CREATE POLICY "Allow authenticated users to read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Update: Users can update only their own profile
-- RLS cannot restrict columns. Without these grants the policy below would let
-- any signed-in user set their own role='admin' from the browser client.
-- full_name is the only field the client ever writes (ProfileSettings.jsx).
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM anon;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

CREATE POLICY "Allow users to update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert: Users can insert their own profile
CREATE POLICY "Allow users to insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------
-- 5. RLS Policies: Time Logs Table
-- ------------------------------------------

-- Keep exactly one policy per command here. Permissive policies OR together,
-- so a leftover USING (true) silently overrides any scoped policy beside it —
-- that is how every workspace's logs became readable by every user.

-- Read: members see logs in their own workspaces; super admins see all.
CREATE POLICY "Read logs in own workspaces"
  ON public.time_logs
  FOR SELECT
  TO authenticated
  USING (
    account_id IN (SELECT public.get_user_workspaces())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- Insert: your own hours, into a workspace you belong to. Checking user_id
-- matters — payouts are computed per user, so logging under a teammate's name
-- would move pay between people.
CREATE POLICY "Log own time in own workspaces"
  ON public.time_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND account_id IN (SELECT public.get_user_workspaces()))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
  );

-- Update/Delete: admins of the log's workspace (and super admins). Members
-- remove their own entries through undo_last_time_log, not directly.
CREATE POLICY "Workspace admins edit logs"
  ON public.time_logs
  FOR UPDATE
  TO authenticated
  USING (public.is_workspace_admin(account_id))
  WITH CHECK (public.is_workspace_admin(account_id));

CREATE POLICY "Workspace admins delete logs"
  ON public.time_logs
  FOR DELETE
  TO authenticated
  USING (public.is_workspace_admin(account_id));

-- ------------------------------------------
-- 6. Undo (LIFO stack pop)
-- ------------------------------------------

-- Monday 00:00 America/Los_Angeles, as a timestamptz. date_trunc('week', ...)
-- is Monday-anchored and resolves DST via the named zone, so this stays correct
-- across the March/November transitions.
CREATE OR REPLACE FUNCTION public.current_cycle_start()
RETURNS TIMESTAMPTZ AS $$
  SELECT date_trunc('week', (now() AT TIME ZONE 'America/Los_Angeles'))
           AT TIME ZONE 'America/Los_Angeles';
$$ LANGUAGE sql STABLE SET search_path = public;

-- Pops the newest entry off an account's log stack.
--
-- A member may only remove their own entry, and only while it is still on top —
-- once someone else has logged over it, they must undo theirs first. Admins of
-- that workspace may reach past both that rule and the cycle boundary, but the
-- call returns
-- 'confirm_required' first so the UI can name whose entry is at stake before a
-- second call with p_force passes.
--
-- SECURITY DEFINER: authorization is enforced in the body below, not by RLS.
-- The advisory lock serialises undos per account, closing the read-then-delete
-- race where two callers could each pop a different row believing it was top.
CREATE OR REPLACE FUNCTION public.undo_last_time_log(
  p_account_id UUID,
  p_force BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  v_caller       UUID := auth.uid();
  v_is_admin     BOOLEAN;
  v_top          public.time_logs%ROWTYPE;
  v_cycle_start  TIMESTAMPTZ;
  v_owner_name   TEXT;
  v_other_user   BOOLEAN;
  v_prior_cycle  BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'not_authenticated');
  END IF;

  IF p_account_id IS NULL THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'no_account');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_account_id::text, 0));

  -- (created_at, id) rather than created_at alone: seeded rows land on whole
  -- hours and can collide, and ordering must be total for "top" to be a fact.
  SELECT * INTO v_top
  FROM public.time_logs
  WHERE account_id = p_account_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'reason', 'no_logs');
  END IF;

  v_is_admin    := public.is_workspace_admin(p_account_id);
  v_cycle_start := public.current_cycle_start();
  v_other_user  := v_top.user_id <> v_caller;
  v_prior_cycle := v_top.created_at < v_cycle_start;

  SELECT full_name INTO v_owner_name FROM public.profiles WHERE id = v_top.user_id;

  IF NOT v_is_admin THEN
    IF v_other_user THEN
      RETURN jsonb_build_object(
        'status', 'error', 'reason', 'not_owner', 'owner_name', v_owner_name
      );
    END IF;
    IF v_prior_cycle THEN
      RETURN jsonb_build_object('status', 'error', 'reason', 'prior_cycle');
    END IF;
  ELSIF (v_other_user OR v_prior_cycle) AND NOT p_force THEN
    RETURN jsonb_build_object(
      'status', 'confirm_required',
      'owner_name', v_owner_name,
      'is_other_user', v_other_user,
      'is_prior_cycle', v_prior_cycle,
      'stop_time_seconds', v_top.stop_time_seconds
    );
  END IF;

  DELETE FROM public.time_logs WHERE id = v_top.id;

  RETURN jsonb_build_object(
    'status', 'ok',
    'deleted_id', v_top.id,
    'stop_time_seconds', v_top.stop_time_seconds,
    'owner_name', v_owner_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Supabase default privileges grant EXECUTE to anon at CREATE time, and
-- REVOKE ... FROM PUBLIC does not remove an explicit role grant, so anon is
-- revoked by name.
REVOKE ALL ON FUNCTION public.undo_last_time_log(UUID, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.undo_last_time_log(UUID, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.undo_last_time_log(UUID, BOOLEAN) TO authenticated;

-- ------------------------------------------
-- KNOWN GAP: this file does not fully describe the live database.
-- ------------------------------------------
-- public.account_members and public.accounts (workspace membership and the
-- workspace/account records themselves — read by get_user_workspaces above,
-- by the account_members RLS policies, and by every workspace-scoped query
-- in the app) exist in production but were never added here; they were
-- created directly against the database, the same way is_super_admin,
-- rls_auto_enable and get_user_workspaces were before this pass. This file
-- is not yet a complete source of truth for a fresh deploy — reconstructing
-- those two tables and their policies is a deliberate follow-up, not done
-- as a side effect of this change.
--
-- Their write policies do follow the admin model above and live only in the
-- database for now: accounts UPDATE and account_members INSERT/UPDATE/DELETE
-- all require public.is_workspace_admin(<the row's workspace>). The unused
-- team_settings table also exists only in the database.
