-- =============================================
-- DBE Creator - Migration v3: Scripts Module
-- =============================================

create table if not exists public.scripts (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid references public.workspaces(id) on delete cascade not null,
  idea_id             uuid references public.ideas(id) on delete set null,
  content_pillar_id   uuid references public.content_pillars(id) on delete set null,
  title               text not null,
  hook                text not null,
  body                text not null,
  cta                 text not null,
  status              text not null check (status in ('draft','ready','recorded')) default 'draft',
  last_analysis_score int check (last_analysis_score between 0 and 100),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists scripts_workspace_id_idx on public.scripts(workspace_id);
create index if not exists scripts_status_idx on public.scripts(status);
create index if not exists scripts_content_pillar_id_idx on public.scripts(content_pillar_id);

alter table public.scripts enable row level security;

drop policy if exists "Workspace members can select scripts" on public.scripts;
create policy "Workspace members can select scripts"
  on public.scripts for select
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

drop policy if exists "Workspace members can insert scripts" on public.scripts;
create policy "Workspace members can insert scripts"
  on public.scripts for insert
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

drop policy if exists "Workspace members can update scripts" on public.scripts;
create policy "Workspace members can update scripts"
  on public.scripts for update
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()))
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

drop policy if exists "Workspace members can delete scripts" on public.scripts;
create policy "Workspace members can delete scripts"
  on public.scripts for delete
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));
