-- Every open client polls the newest log in its workspace every 2 seconds
-- (useLatestGlobalStop), and undo_last_time_log runs the same lookup. Without
-- an index each poll scanned the whole table. Column order matches both
-- queries (filter on account_id, newest by created_at then id), so Postgres
-- reads the single newest row straight off the index with no sort. It also
-- covers the time_logs.account_id foreign key.
CREATE INDEX time_logs_account_id_created_at_idx
  ON public.time_logs (account_id, created_at, id);
