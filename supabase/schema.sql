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

-- Recursion-safe Admin check helper function
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND (role = 'admin' OR is_super_admin = true)
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- Read: Authenticated users can read all time logs (required for snap-on handoff calculation)
CREATE POLICY "Allow authenticated users to read all time logs"
  ON public.time_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert: Members can insert logs for themselves; Admins can insert logs for anyone
CREATE POLICY "Allow members to insert own time logs or admin insert any"
  ON public.time_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Update: Only Admins can update any time log
CREATE POLICY "Allow admins to update time logs"
  ON public.time_logs
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Delete: Only Admins can delete any time log
CREATE POLICY "Allow admins to delete time logs"
  ON public.time_logs
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

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
-- once someone else has logged over it, they must undo theirs first. Admins may
-- reach past both that rule and the cycle boundary, but the call returns
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

  v_is_admin    := public.is_admin(v_caller);
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
