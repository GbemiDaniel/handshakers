-- Baseline: the complete application schema as deployed on 2026-09-23.
--
-- Generated from the live database's own definitions (pg_get_functiondef,
-- pg_get_constraintdef, pg_policy, ACLs) rather than written by hand, then
-- annotated. It replaces supabase/schema.sql, which had drifted to describe
-- only profiles and time_logs, and supersedes every change applied before it.
--
-- Supabase platform objects (extensions, the auth/storage/realtime schemas,
-- and the platform's own event triggers) are created by Supabase itself and
-- are deliberately not repeated here.
--
-- From here on, every schema change is a new file in this directory. Never
-- change the database from the dashboard without adding a migration.

-- ============================================================
-- 1. Tables
-- ============================================================

-- A workspace: one client team sharing a weekly hour pool.
CREATE TABLE public.accounts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  account_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  weekly_pool_hours integer DEFAULT 60,
  CONSTRAINT accounts_pkey PRIMARY KEY (id)
);

-- One row per person. profiles.role is retained for compatibility but carries
-- no meaning; admin rights come from is_super_admin and account_members.role.
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  role text DEFAULT 'member'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  is_super_admin boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])))
);

-- Who belongs to which workspace. role = 'admin' makes that person the
-- workspace's lead.
CREATE TABLE public.account_members (
  account_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  status text DEFAULT 'active'::text,
  id uuid DEFAULT gen_random_uuid(),
  CONSTRAINT account_members_pkey PRIMARY KEY (account_id, user_id),
  CONSTRAINT account_members_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text])))
);

-- Duplicates the primary key, but exists in the deployed database, so it is
-- reproduced here. It must be added with ALTER TABLE: inside CREATE TABLE,
-- Postgres silently discards a UNIQUE constraint that repeats the primary
-- key's columns. Safe to drop in a later migration.
ALTER TABLE public.account_members
  ADD CONSTRAINT account_members_account_user_key UNIQUE (account_id, user_id);

-- Each handoff: the relay's stop time in cumulative seconds for the cycle.
CREATE TABLE public.time_logs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  is_end_of_day boolean DEFAULT false,
  account_id uuid,
  start_time_seconds integer NOT NULL,
  stop_time_seconds integer NOT NULL,
  CONSTRAINT time_logs_pkey PRIMARY KEY (id)
);

-- Left over from the single-team version; nothing in the app reads it.
CREATE TABLE public.team_settings (
  id integer NOT NULL,
  account_name text,
  CONSTRAINT team_settings_pkey PRIMARY KEY (id)
);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.account_members
  ADD CONSTRAINT account_members_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
  ADD CONSTRAINT account_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.time_logs
  ADD CONSTRAINT time_logs_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
  ADD CONSTRAINT time_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_settings   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Functions
-- ============================================================

-- Monday 00:00 America/Los_Angeles. date_trunc('week', ...) is Monday-anchored
-- and resolves DST through the named zone.
CREATE OR REPLACE FUNCTION public.current_cycle_start()
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT date_trunc('week', (now() AT TIME ZONE 'America/Los_Angeles'))
           AT TIME ZONE 'America/Los_Angeles';
$function$;

-- The workspaces the caller belongs to. SECURITY DEFINER so the
-- account_members read policy can use it without recursing into itself.
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
 RETURNS SETOF uuid
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT account_id FROM account_members WHERE user_id = auth.uid();
$function$;

-- Admin model: the super admin over everything, plus an optional lead per
-- workspace (active account_members row with role = 'admin') whose powers
-- apply inside that workspace only. Reads the caller from auth.uid() rather
-- than taking a user id, so it cannot be used to probe who else is an admin.
CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_account_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true)
      OR EXISTS (SELECT 1 FROM public.account_members
                 WHERE account_id = p_account_id AND user_id = auth.uid()
                   AND role = 'admin' AND COALESCE(status, 'active') = 'active');
$function$;

-- Creates a profile for every new sign-up (trigger below).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Safety net: any table created in public starts with RLS enabled, so a
-- forgotten ENABLE ROW LEVEL SECURITY can never expose a new table over the
-- API. Fired by the ensure_rls event trigger below.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
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
$function$;

-- Pops the newest entry off a workspace's log stack. A member may remove only
-- their own entry, and only while it is still on top and in the current
-- cycle. Workspace admins may reach past both rules, but the first call
-- returns 'confirm_required' so the UI can name whose entry is at stake before
-- a second call with p_force. The advisory lock serialises undos per
-- workspace; ordering on (created_at, id) keeps "top" well defined when
-- seeded rows share a timestamp.
CREATE OR REPLACE FUNCTION public.undo_last_time_log(p_account_id uuid, p_force boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  SELECT * INTO v_top FROM public.time_logs
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
      RETURN jsonb_build_object('status', 'error', 'reason', 'not_owner', 'owner_name', v_owner_name);
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
$function$;

-- ============================================================
-- 3. Triggers
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();

-- ============================================================
-- 4. Row Level Security policies
-- ============================================================
-- Permissive policies OR together, so the loosest policy on a command always
-- wins: one leftover USING (true) silently overrides any scoped policy beside
-- it. Keep a single policy per table and command wherever possible.

-- accounts ---------------------------------------------------
CREATE POLICY "View accounts if member or super admin" ON public.accounts FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM account_members
  WHERE ((account_members.account_id = accounts.id) AND (account_members.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true))))));

CREATE POLICY "Super Admins can view all accounts" ON public.accounts FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));

CREATE POLICY "Super Admins can create accounts" ON public.accounts FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));

-- Capacity and name: that workspace's admins only. Membership alone is not
-- enough — weekly_pool_hours caps what the whole team can log.
CREATE POLICY "Workspace admins update their workspace" ON public.accounts FOR UPDATE TO authenticated
  USING (is_workspace_admin(id))
  WITH CHECK (is_workspace_admin(id));

CREATE POLICY "Super Admins can delete accounts" ON public.accounts FOR DELETE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true)))));

-- profiles ---------------------------------------------------
CREATE POLICY "Allow authenticated users to read all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow users to insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = id));

-- Own row only. Which columns may change is enforced by the grants in
-- section 5, since RLS cannot restrict columns.
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

-- account_members --------------------------------------------
CREATE POLICY "View team members safely" ON public.account_members FOR SELECT TO authenticated
  USING (((account_id IN ( SELECT get_user_workspaces() AS get_user_workspaces)) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true))))));

CREATE POLICY "Workspace admins add members" ON public.account_members FOR INSERT TO authenticated
  WITH CHECK (is_workspace_admin(account_id));

CREATE POLICY "Workspace admins update members" ON public.account_members FOR UPDATE TO authenticated
  USING (is_workspace_admin(account_id))
  WITH CHECK (is_workspace_admin(account_id));

CREATE POLICY "Workspace admins remove members" ON public.account_members FOR DELETE TO authenticated
  USING (is_workspace_admin(account_id));

-- time_logs --------------------------------------------------
CREATE POLICY "Read logs in own workspaces" ON public.time_logs FOR SELECT TO authenticated
  USING (((account_id IN ( SELECT get_user_workspaces() AS get_user_workspaces)) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true))))));

-- Own hours, into a workspace you belong to. Checking user_id matters:
-- payouts are computed per user, so logging under a teammate's name would
-- move pay between people.
CREATE POLICY "Log own time in own workspaces" ON public.time_logs FOR INSERT TO authenticated
  WITH CHECK ((((user_id = auth.uid()) AND (account_id IN ( SELECT get_user_workspaces() AS get_user_workspaces))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_super_admin = true))))));

-- Members remove their own entries through undo_last_time_log, not directly.
CREATE POLICY "Workspace admins edit logs" ON public.time_logs FOR UPDATE TO authenticated
  USING (is_workspace_admin(account_id))
  WITH CHECK (is_workspace_admin(account_id));

CREATE POLICY "Workspace admins delete logs" ON public.time_logs FOR DELETE TO authenticated
  USING (is_workspace_admin(account_id));

-- team_settings ----------------------------------------------
CREATE POLICY "Allow all authenticated read" ON public.team_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow all authenticated update" ON public.team_settings FOR UPDATE TO authenticated
  USING (true);

-- ============================================================
-- 5. Grants
-- ============================================================
-- Supabase grants anon/authenticated full table access and EXECUTE on
-- functions (including to PUBLIC) by default; only the exceptions are listed.
-- Revoking from a named role does not remove the PUBLIC grant, so PUBLIC is
-- always revoked explicitly.

-- Without this, the update policy above would let any signed-in user set their
-- own role or is_super_admin from the browser. full_name is the only column
-- the client writes (ProfileSettings.jsx).
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

-- Internal: fired only by triggers, never called directly.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Callable by signed-in users only; each enforces its own rules.
REVOKE ALL ON FUNCTION public.get_user_workspaces() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_workspaces() TO authenticated;
REVOKE ALL ON FUNCTION public.is_workspace_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.undo_last_time_log(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.undo_last_time_log(uuid, boolean) TO authenticated;

-- ============================================================
-- 6. Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.time_logs;
