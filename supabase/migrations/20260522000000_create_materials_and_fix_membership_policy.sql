-- DBE Creator - Materials and safe workspace membership inserts

create table if not exists public.materials (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title        text not null,
  type         text not null check (type in ('link', 'file', 'audio', 'video', 'image', 'note')),
  url          text,
  content      text,
  tags         text[] not null default '{}',
  created_by   uuid references auth.users(id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists materials_workspace_id_idx
  on public.materials(workspace_id);

create index if not exists materials_workspace_created_at_idx
  on public.materials(workspace_id, created_at desc);

create index if not exists materials_workspace_type_idx
  on public.materials(workspace_id, type);

create index if not exists materials_created_by_idx
  on public.materials(created_by);

create index if not exists materials_tags_idx
  on public.materials using gin(tags);

alter table public.materials enable row level security;

drop policy if exists "Workspace members can select materials" on public.materials;
create policy "Workspace members can select materials"
  on public.materials for select
  to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = materials.workspace_id
        and wm.user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace editors can insert materials" on public.materials;
create policy "Workspace editors can insert materials"
  on public.materials for insert
  to authenticated
  with check (
    (created_by is null or created_by = (select auth.uid()))
    and exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = materials.workspace_id
        and wm.user_id = (select auth.uid())
        and wm.role in ('owner', 'admin', 'member')
    )
  );

drop policy if exists "Workspace editors can update materials" on public.materials;
create policy "Workspace editors can update materials"
  on public.materials for update
  to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = materials.workspace_id
        and wm.user_id = (select auth.uid())
        and wm.role in ('owner', 'admin', 'member')
    )
  )
  with check (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = materials.workspace_id
        and wm.user_id = (select auth.uid())
        and wm.role in ('owner', 'admin', 'member')
    )
  );

drop policy if exists "Workspace editors can delete materials" on public.materials;
create policy "Workspace editors can delete materials"
  on public.materials for delete
  to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = materials.workspace_id
        and wm.user_id = (select auth.uid())
        and wm.role in ('owner', 'admin', 'member')
    )
  );

grant select, insert, delete on public.materials to authenticated;
grant update(title, type, url, content, tags, updated_at) on public.materials to authenticated;

drop policy if exists "Members can insert memberships" on public.workspace_members;
create policy "Members can insert memberships"
  on public.workspace_members
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.workspaces w
      where w.id = workspace_members.workspace_id
        and w.created_by = (select auth.uid())
    )
  );
