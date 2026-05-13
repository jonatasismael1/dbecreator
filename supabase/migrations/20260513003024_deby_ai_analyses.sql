-- =============================================
-- DBE Creator - Migration v6: Deby AI Analyses
-- =============================================

create table if not exists public.ai_analyses (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  script_id    uuid references public.scripts(id) on delete cascade not null,
  model        text not null,
  result       jsonb not null,
  created_by   uuid references auth.users(id) on delete set null default auth.uid(),
  created_at   timestamptz default now()
);

create index if not exists ai_analyses_workspace_id_idx on public.ai_analyses(workspace_id);
create index if not exists ai_analyses_script_id_idx on public.ai_analyses(script_id);
create index if not exists ai_analyses_created_at_idx on public.ai_analyses(created_at desc);

alter table public.ai_analyses enable row level security;

drop policy if exists "Workspace members can select ai analyses" on public.ai_analyses;
create policy "Workspace members can select ai analyses"
  on public.ai_analyses for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );
