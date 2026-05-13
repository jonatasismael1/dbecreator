-- Fix market map upserts and persist real Instagram performance data per workspace.

delete from public.market_maps mm
using (
  select id,
         row_number() over (
           partition by workspace_id
           order by updated_at desc nulls last, created_at desc nulls last, id desc
         ) as rn
  from public.market_maps
) ranked
where mm.id = ranked.id
  and ranked.rn > 1;

create unique index if not exists market_maps_workspace_id_key
  on public.market_maps(workspace_id);

drop policy if exists "Workspace members can update market_maps" on public.market_maps;
create policy "Workspace members can update market_maps"
  on public.market_maps for update
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

create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  script_id uuid references public.scripts(id) on delete set null,
  platform text not null check (platform in ('instagram','tiktok','youtube','other')),
  published_at timestamptz not null,
  views integer not null default 0 check (views >= 0),
  likes integer not null default 0 check (likes >= 0),
  comments integer not null default 0 check (comments >= 0),
  shares integer not null default 0 check (shares >= 0),
  saves integer not null default 0 check (saves >= 0),
  watch_time_seconds integer not null default 0 check (watch_time_seconds >= 0),
  retention_rate numeric(5, 2) not null default 0 check (retention_rate >= 0 and retention_rate <= 100),
  link_clicks integer not null default 0 check (link_clicks >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.performance_metrics
  add column if not exists external_media_id text,
  add column if not exists external_permalink text,
  add column if not exists caption text,
  add column if not exists thumbnail_url text,
  add column if not exists media_type text,
  add column if not exists account_id text,
  add column if not exists raw_insights jsonb not null default '{}'::jsonb,
  add column if not exists synced_at timestamptz;

alter table public.performance_metrics
  alter column script_id drop not null,
  alter column raw_insights set default '{}'::jsonb;

create index if not exists performance_metrics_workspace_id_idx
  on public.performance_metrics(workspace_id);

create index if not exists performance_metrics_script_id_idx
  on public.performance_metrics(script_id);

create index if not exists performance_metrics_published_at_idx
  on public.performance_metrics(published_at desc);

delete from public.performance_metrics pm
using (
  select id,
         row_number() over (
           partition by workspace_id, platform, external_media_id
           order by synced_at desc nulls last, updated_at desc nulls last, created_at desc nulls last, id desc
         ) as rn
  from public.performance_metrics
  where external_media_id is not null
) ranked
where pm.id = ranked.id
  and ranked.rn > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'performance_metrics_workspace_platform_media_key'
      and conrelid = 'public.performance_metrics'::regclass
  ) then
    alter table public.performance_metrics
      add constraint performance_metrics_workspace_platform_media_key
      unique (workspace_id, platform, external_media_id);
  end if;
end $$;

alter table public.performance_metrics enable row level security;

drop policy if exists "Workspace members can select performance metrics" on public.performance_metrics;
create policy "Workspace members can select performance metrics"
  on public.performance_metrics for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can insert performance metrics" on public.performance_metrics;
create policy "Workspace members can insert performance metrics"
  on public.performance_metrics for insert
  to authenticated
  with check (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can update performance metrics" on public.performance_metrics;
create policy "Workspace members can update performance metrics"
  on public.performance_metrics for update
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

drop policy if exists "Workspace members can delete performance metrics" on public.performance_metrics;
create policy "Workspace members can delete performance metrics"
  on public.performance_metrics for delete
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

update public.workspace_integrations
set metadata = coalesce(metadata, '{}'::jsonb),
    updated_at = now()
where platform = 'instagram';
