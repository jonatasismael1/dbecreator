-- =============================================
-- DBE Creator - Migration v7: Deby score 0-10 + Calendar Items
-- =============================================

update public.ai_analyses
set result = jsonb_set(
  result,
  '{score}',
  to_jsonb(round(((result->>'score')::numeric / 10), 1))
)
where result ? 'score'
  and (result->>'score')::numeric > 10;

alter table public.scripts
  alter column last_analysis_score type numeric(3, 1)
  using case
    when last_analysis_score is null then null
    when last_analysis_score > 10 then round((last_analysis_score::numeric / 10), 1)
    else last_analysis_score::numeric
  end;

alter table public.scripts
  drop constraint if exists scripts_last_analysis_score_check;

alter table public.scripts
  add constraint scripts_last_analysis_score_check
  check (last_analysis_score between 0 and 10);

create table if not exists public.calendar_items (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  script_id    uuid references public.scripts(id) on delete set null,
  publish_date timestamptz not null,
  platform     text not null check (platform in ('reels','tiktok','shorts')) default 'reels',
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists calendar_items_workspace_id_idx on public.calendar_items(workspace_id);
create index if not exists calendar_items_script_id_idx on public.calendar_items(script_id);
create index if not exists calendar_items_publish_date_idx on public.calendar_items(publish_date);

alter table public.calendar_items enable row level security;

drop policy if exists "Workspace members can select calendar items" on public.calendar_items;
create policy "Workspace members can select calendar items"
  on public.calendar_items for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can insert calendar items" on public.calendar_items;
create policy "Workspace members can insert calendar items"
  on public.calendar_items for insert
  to authenticated
  with check (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can update calendar items" on public.calendar_items;
create policy "Workspace members can update calendar items"
  on public.calendar_items for update
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  )
  with check (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can delete calendar items" on public.calendar_items;
create policy "Workspace members can delete calendar items"
  on public.calendar_items for delete
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );
