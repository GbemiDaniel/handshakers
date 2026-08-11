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
  start_minutes INTEGER NOT NULL,
  stop_minutes INTEGER NOT NULL,
  -- Phase 2: Canonical seconds columns (nullable during transition)
  start_time_seconds INTEGER NULL,
  stop_time_seconds INTEGER NULL,
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
    WHERE id = user_id AND role = 'admin'
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
