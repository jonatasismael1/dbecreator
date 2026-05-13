-- =============================================
-- DBE Creator - Migration v4: Workspace Policies + Script Versions
-- =============================================

drop policy if exists "Users can insert own workspace" on public.workspaces;
create policy "Users can insert own workspace"
  on public.workspaces
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

drop policy if exists "Members can insert memberships" on public.workspace_members;
create policy "Members can insert memberships"
  on public.workspace_members
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create table if not exists public.script_versions (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid references public.workspaces(id) on delete cascade not null,
  script_id         uuid references public.scripts(id) on delete cascade not null,
  version_number    int not null,
  title             text not null,
  hook              text not null,
  body              text not null,
  cta               text not null,
  status            text not null check (status in ('draft','ready','recorded')),
  content_pillar_id uuid references public.content_pillars(id) on delete set null,
  created_by        uuid references auth.users(id) on delete set null default auth.uid(),
  created_at        timestamptz default now(),
  unique (script_id, version_number)
);

create index if not exists script_versions_workspace_id_idx on public.script_versions(workspace_id);
create index if not exists script_versions_script_id_idx on public.script_versions(script_id);

alter table public.script_versions enable row level security;

drop policy if exists "Workspace members can select script versions" on public.script_versions;
create policy "Workspace members can select script versions"
  on public.script_versions for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can insert script versions" on public.script_versions;
create policy "Workspace members can insert script versions"
  on public.script_versions for insert
  to authenticated
  with check (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

create or replace function public.capture_script_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    old.title is distinct from new.title or
    old.hook is distinct from new.hook or
    old.body is distinct from new.body or
    old.cta is distinct from new.cta or
    old.status is distinct from new.status or
    old.content_pillar_id is distinct from new.content_pillar_id
  ) then
    insert into public.script_versions (
      workspace_id,
      script_id,
      version_number,
      title,
      hook,
      body,
      cta,
      status,
      content_pillar_id,
      created_by
    )
    values (
      old.workspace_id,
      old.id,
      coalesce((select max(version_number) from public.script_versions where script_id = old.id), 0) + 1,
      old.title,
      old.hook,
      old.body,
      old.cta,
      old.status,
      old.content_pillar_id,
      (select auth.uid())
    );
  end if;

  return new;
end;
$$;

drop trigger if exists capture_script_version_before_update on public.scripts;
create trigger capture_script_version_before_update
  before update on public.scripts
  for each row
  execute function public.capture_script_version();
