-- Workspace leads manage their workspace's members, but only the super admin
-- may appoint or remove leads. RLS can't compare a row's old and new values,
-- so the rule is a trigger. It covers every path to changing lead status:
-- promoting or demoting (role change), inserting a member directly as a lead,
-- and deactivating or deleting an existing lead's membership, which would
-- strip their powers just as surely as a demotion.
--
-- Calls with no signed-in user (migrations, the dashboard, the service role)
-- are server-side and pass through.
CREATE OR REPLACE FUNCTION public.guard_workspace_lead_changes()
RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS NULL
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF (TG_OP = 'INSERT' AND NEW.role = 'admin')
     OR (TG_OP IN ('UPDATE', 'DELETE') AND OLD.role = 'admin')
     OR (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role) THEN
    RAISE EXCEPTION 'Only the super admin can appoint or remove workspace leads.'
      USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.guard_workspace_lead_changes() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER guard_workspace_lead_changes
  BEFORE INSERT OR UPDATE OR DELETE ON public.account_members
  FOR EACH ROW EXECUTE FUNCTION public.guard_workspace_lead_changes();
