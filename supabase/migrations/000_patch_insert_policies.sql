-- =============================================
-- DBE Creator - SQL Patch: INSERT Policies
-- Safe no-op when foundation tables do not exist yet.
-- =============================================

do $$
begin
  if to_regclass('public.workspaces') is not null then
    drop policy if exists "Users can insert own workspace" on public.workspaces;
    create policy "Users can insert own workspace"
      on public.workspaces
      for insert
      to authenticated
      with check ((select auth.uid()) is not null);
  end if;

  if to_regclass('public.workspace_members') is not null then
    drop policy if exists "Members can insert memberships" on public.workspace_members;
    create policy "Members can insert memberships"
      on public.workspace_members
      for insert
      to authenticated
      with check (user_id = (select auth.uid()));
  end if;
end $$;
