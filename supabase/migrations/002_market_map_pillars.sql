-- =============================================
-- DBE Creator — Migration v2: Market Map & Pillars
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- ─────────────────────────────────────────────
-- 1. INSERT permissions for workspaces
-- ─────────────────────────────────────────────
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

-- ─────────────────────────────────────────────
-- 2. MARKET MAPS
-- ─────────────────────────────────────────────
create table if not exists public.market_maps (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid references public.workspaces(id) on delete cascade not null,
  niche            text,
  target_audience  text,
  main_pain        text,
  competitors      jsonb default '[]'::jsonb,
  differentiators  text,
  tone_of_voice    text,
  is_complete      boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists market_maps_workspace_id_idx on public.market_maps(workspace_id);
alter table public.market_maps enable row level security;

drop policy if exists "Workspace members can select market_maps" on public.market_maps;
create policy "Workspace members can select market_maps"
  on public.market_maps for select
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

drop policy if exists "Workspace members can insert market_maps" on public.market_maps;
create policy "Workspace members can insert market_maps"
  on public.market_maps for insert
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

drop policy if exists "Workspace members can update market_maps" on public.market_maps;
create policy "Workspace members can update market_maps"
  on public.market_maps for update
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

drop policy if exists "Workspace members can delete market_maps" on public.market_maps;
create policy "Workspace members can delete market_maps"
  on public.market_maps for delete
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

-- ─────────────────────────────────────────────
-- 3. CONTENT PILLARS
-- ─────────────────────────────────────────────
create table if not exists public.content_pillars (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title        text not null,
  description  text,
  type         text check (type in ('authority','sales','connection','education','entertainment','custom')),
  color        text default '#2563EB',
  icon         text default 'Target',
  is_active    boolean default true,
  position     int default 0,
  created_at   timestamptz default now()
);

create index if not exists content_pillars_workspace_id_idx on public.content_pillars(workspace_id);
alter table public.content_pillars enable row level security;

drop policy if exists "Workspace members can select pillars" on public.content_pillars;
create policy "Workspace members can select pillars"
  on public.content_pillars for select
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

drop policy if exists "Workspace members can insert pillars" on public.content_pillars;
create policy "Workspace members can insert pillars"
  on public.content_pillars for insert
  with check (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

drop policy if exists "Workspace members can update pillars" on public.content_pillars;
create policy "Workspace members can update pillars"
  on public.content_pillars for update
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));

drop policy if exists "Workspace members can delete pillars" on public.content_pillars;
create policy "Workspace members can delete pillars"
  on public.content_pillars for delete
  using (workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid()));
