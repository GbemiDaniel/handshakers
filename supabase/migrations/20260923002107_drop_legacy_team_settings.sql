-- Left over from the single-team version of the app. Nothing reads it, any
-- signed-in user could update it, and its one row names a team that already
-- exists as a workspace in public.accounts. Its policies are dropped with it.
DROP TABLE public.team_settings;
