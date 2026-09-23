-- A workday (the entries between two End of Day marks) needs a date of its
-- own. created_at can't serve: it records when an entry was typed in, so a day
-- backfilled after midnight was labelled with the next day's date, and moving
-- created_at would break the save order that the locked start time, the
-- collision check and undo all rely on.
--
-- Dates follow one fixed team calendar, Africa/Lagos, for everyone.

ALTER TABLE public.time_logs ADD COLUMN work_date date;

-- Backfill. Split each workspace's log into days exactly as the timeline does
-- (at End of Day, or where the odometer resets for a new cycle), date each day
-- by its first entry in Lagos time, then walk back from the newest day so each
-- earlier day is at most one day before the next. A day typed in after
-- midnight thereby gets the date it was worked, not the date it was saved.
CREATE TEMP TABLE wd_log (id uuid, account_id uuid, grp int, created_at timestamptz) ON COMMIT DROP;
CREATE TEMP TABLE wd_day (grp int, account_id uuid, anchor date, work_date date) ON COMMIT DROP;

DO $$
DECLARE
  r record;
  prev_acct uuid;
  prev_eod boolean;
  prev_stop int;
  is_first boolean := true;
  g int := 0;
BEGIN
  FOR r IN
    SELECT id, account_id, created_at, start_time_seconds, stop_time_seconds, is_end_of_day
    FROM public.time_logs
    ORDER BY account_id NULLS FIRST, created_at, id
  LOOP
    IF is_first OR r.account_id IS DISTINCT FROM prev_acct THEN
      g := g + 1;
    ELSIF prev_eod OR r.start_time_seconds < prev_stop THEN
      g := g + 1;
    END IF;
    INSERT INTO wd_log VALUES (r.id, r.account_id, g, r.created_at);
    prev_acct := r.account_id;
    prev_eod := COALESCE(r.is_end_of_day, false);
    prev_stop := r.stop_time_seconds;
    is_first := false;
  END LOOP;
END $$;

INSERT INTO wd_day (grp, account_id, anchor)
SELECT grp, account_id, (min(created_at) AT TIME ZONE 'Africa/Lagos')::date
FROM wd_log GROUP BY grp, account_id;

DO $$
DECLARE
  d record;
  cur_acct uuid;
  is_first boolean := true;
  next_date date;
  this_date date;
BEGIN
  FOR d IN SELECT grp, account_id, anchor FROM wd_day ORDER BY account_id NULLS FIRST, grp DESC LOOP
    IF is_first OR d.account_id IS DISTINCT FROM cur_acct THEN
      next_date := NULL;
    END IF;
    this_date := CASE WHEN next_date IS NULL THEN d.anchor ELSE LEAST(d.anchor, next_date - 1) END;
    UPDATE wd_day SET work_date = this_date WHERE grp = d.grp;
    next_date := this_date;
    cur_acct := d.account_id;
    is_first := false;
  END LOOP;
END $$;

UPDATE public.time_logs t
SET work_date = d.work_date
FROM wd_log l JOIN wd_day d ON d.grp = l.grp
WHERE t.id = l.id;

ALTER TABLE public.time_logs ALTER COLUMN work_date SET NOT NULL;

-- Every new entry is dated by the database, so no client can get it wrong:
--   * while a day is still open, the entry takes that day's date, whatever the
--     client sent;
--   * an entry that starts a new day (first ever, after End of Day, or at a new
--     cycle) uses the date the logger chose, or today in Lagos. It may not be
--     in the future or earlier than the previous day. Two days may share a
--     date, so a stray End of Day click can't lock anyone out.
CREATE OR REPLACE FUNCTION public.set_time_log_work_date()
RETURNS trigger AS $$
DECLARE
  prev public.time_logs%ROWTYPE;
  today date := (now() AT TIME ZONE 'Africa/Lagos')::date;
BEGIN
  SELECT * INTO prev FROM public.time_logs
  WHERE account_id IS NOT DISTINCT FROM NEW.account_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF FOUND
     AND NOT COALESCE(prev.is_end_of_day, false)
     AND NEW.start_time_seconds >= prev.stop_time_seconds
     AND prev.created_at >= public.current_cycle_start() THEN
    NEW.work_date := prev.work_date;
    RETURN NEW;
  END IF;

  NEW.work_date := COALESCE(NEW.work_date, today);

  IF NEW.work_date > today THEN
    RAISE EXCEPTION 'A workday can''t be dated in the future.' USING ERRCODE = '22023';
  END IF;
  IF FOUND AND NEW.work_date < prev.work_date THEN
    RAISE EXCEPTION 'A new workday can''t be dated before the previous one (%).', prev.work_date
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.set_time_log_work_date() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER set_time_log_work_date
  BEFORE INSERT ON public.time_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_time_log_work_date();
