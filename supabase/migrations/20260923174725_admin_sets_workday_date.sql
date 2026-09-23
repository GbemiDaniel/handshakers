-- The logger no longer asks for a date: taskers end a day with the End of Day
-- checkbox and nothing else. Every new day is named after the day it starts
-- (Lagos calendar), and the only way to re-date a day — for the rare day typed
-- in after midnight — is set_workday_date, used by workspace admins from the
-- timeline.

-- Dates now come from exactly one place, so the trigger no longer accepts a
-- client-supplied date. The advisory lock is the one undo_last_time_log and
-- set_workday_date take, so an insert can't interleave with either.
CREATE OR REPLACE FUNCTION public.set_time_log_work_date()
RETURNS trigger AS $$
DECLARE
  prev public.time_logs%ROWTYPE;
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.account_id::text, 0));
  END IF;

  SELECT * INTO prev FROM public.time_logs
  WHERE account_id IS NOT DISTINCT FROM NEW.account_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF FOUND
     AND NOT COALESCE(prev.is_end_of_day, false)
     AND NEW.start_time_seconds >= prev.stop_time_seconds
     AND prev.created_at >= public.current_cycle_start() THEN
    NEW.work_date := prev.work_date;
  ELSE
    NEW.work_date := (now() AT TIME ZONE 'Africa/Lagos')::date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-dates one workday: every entry in the day containing p_log_id moves to
-- p_work_date together. Days are found exactly as the timeline groups them
-- (skip zero-length entries; split after End of Day or where the odometer
-- resets), so the admin changes the day they are looking at.
--
-- The date must keep days in order — no earlier than the previous day, no
-- later than the next day — and may not be in the future. Neighbouring days
-- may share a date.
CREATE OR REPLACE FUNCTION public.set_workday_date(
  p_account_id UUID,
  p_log_id UUID,
  p_work_date DATE
)
RETURNS JSONB AS $$
DECLARE
  r record;
  g int := 0;
  is_open boolean := false;
  prev_stop int;
  a_ids uuid[] := '{}';
  a_grp int[] := '{}';
  a_date date[] := '{}';
  v_target int;
  v_day_ids uuid[];
  v_prev_date date;
  v_next_date date;
  v_today date := (now() AT TIME ZONE 'Africa/Lagos')::date;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You need to be signed in.' USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_workspace_admin(p_account_id) THEN
    RAISE EXCEPTION 'Only admins of this workspace can change a day''s date.' USING ERRCODE = '42501';
  END IF;
  IF p_work_date IS NULL THEN
    RAISE EXCEPTION 'Please choose a date.' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_account_id::text, 0));

  FOR r IN
    SELECT id, start_time_seconds, stop_time_seconds, is_end_of_day, work_date
    FROM public.time_logs
    WHERE account_id = p_account_id
    ORDER BY created_at, id
  LOOP
    CONTINUE WHEN r.stop_time_seconds <= r.start_time_seconds;
    IF is_open AND r.start_time_seconds < prev_stop THEN
      is_open := false;
    END IF;
    IF NOT is_open THEN
      g := g + 1;
      is_open := true;
    END IF;
    a_ids := a_ids || r.id;
    a_grp := a_grp || g;
    a_date := a_date || r.work_date;
    prev_stop := r.stop_time_seconds;
    IF COALESCE(r.is_end_of_day, false) THEN
      is_open := false;
    END IF;
  END LOOP;

  SELECT t.g INTO v_target FROM unnest(a_ids, a_grp) AS t(id, g) WHERE t.id = p_log_id;
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'That day could not be found in this workspace.' USING ERRCODE = 'P0002';
  END IF;

  SELECT array_agg(t.id) INTO v_day_ids FROM unnest(a_ids, a_grp) AS t(id, g) WHERE t.g = v_target;
  SELECT max(t.d) INTO v_prev_date FROM unnest(a_grp, a_date) AS t(g, d) WHERE t.g = v_target - 1;
  SELECT min(t.d) INTO v_next_date FROM unnest(a_grp, a_date) AS t(g, d) WHERE t.g = v_target + 1;

  IF p_work_date > v_today THEN
    RAISE EXCEPTION 'A day can''t be dated in the future.' USING ERRCODE = '22023';
  END IF;
  IF v_prev_date IS NOT NULL AND p_work_date < v_prev_date THEN
    RAISE EXCEPTION 'A day can''t be dated before the previous day (%).', v_prev_date USING ERRCODE = '22023';
  END IF;
  IF v_next_date IS NOT NULL AND p_work_date > v_next_date THEN
    RAISE EXCEPTION 'A day can''t be dated after the next day (%).', v_next_date USING ERRCODE = '22023';
  END IF;

  UPDATE public.time_logs SET work_date = p_work_date WHERE id = ANY (v_day_ids);

  RETURN jsonb_build_object(
    'status', 'ok',
    'work_date', p_work_date,
    'entries', cardinality(v_day_ids)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.set_workday_date(UUID, UUID, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_workday_date(UUID, UUID, DATE) TO authenticated;
