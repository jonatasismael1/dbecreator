-- =============================================
-- DBE Creator - Migration v5: Workspace creator fallback
-- =============================================

alter table public.workspaces
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();

update public.workspaces w
set created_by = wm.user_id
from public.workspace_members wm
where wm.workspace_id = w.id
  and w.created_by is null
  and wm.role = 'owner';

drop policy if exists "Members can view workspace" on public.workspaces;
create policy "Members can view workspace"
  on public.workspaces
  for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can insert own workspace" on public.workspaces;
create policy "Users can insert own workspace"
  on public.workspaces
  for insert
  to authenticated
  with check (created_by = (select auth.uid()));
