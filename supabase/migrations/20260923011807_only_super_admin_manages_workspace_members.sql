-- Workspace membership (adding, removing, deactivating, and appointing leads)
-- is the super admin's alone. Leads keep their other powers in their own
-- workspace (capacity, editing logs, undo override), which are governed by
-- is_workspace_admin() elsewhere.
DROP POLICY "Workspace admins add members" ON public.account_members;
DROP POLICY "Workspace admins update members" ON public.account_members;
DROP POLICY "Workspace admins remove members" ON public.account_members;

CREATE POLICY "Super admins add members" ON public.account_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "Super admins update members" ON public.account_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "Super admins remove members" ON public.account_members FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

-- Its only job was stopping leads from changing lead status. With no write
-- access to account_members at all, leads can no longer reach it.
DROP TRIGGER guard_workspace_lead_changes ON public.account_members;
DROP FUNCTION public.guard_workspace_lead_changes();
