-- =============================================
-- DBE Creator — Migration v1: Foundation Tables
-- =============================================

-- ─────────────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  updated_at timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────
-- 2. WORKSPACES
-- ─────────────────────────────────────────────
create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  settings   jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.workspaces enable row level security;

-- (A policy depende de public.workspace_members, então vem depois.)

-- ─────────────────────────────────────────────
-- 3. WORKSPACE MEMBERS
-- ─────────────────────────────────────────────
create table if not exists public.workspace_members (
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  role         text not null check (role in ('owner','admin','member','viewer')) default 'owner',
  joined_at    timestamptz default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

drop policy if exists "Members can view own memberships" on public.workspace_members;
create policy "Members can view own memberships"
  on public.workspace_members
  for select
  using (user_id = auth.uid());

-- Agora sim, policy que depende da tabela workspace_members
drop policy if exists "Members can view workspace" on public.workspaces;
create policy "Members can view workspace"
  on public.workspaces
  for select
  using (
    id in (
      select workspace_id
      from public.workspace_members
      where user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 4. IDEAS
-- ─────────────────────────────────────────────
create table if not exists public.ideas (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  status       text not null check (status in ('backlog','doing','done')) default 'backlog',
  tags         text[] default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists ideas_workspace_id_idx on public.ideas(workspace_id);
create index if not exists ideas_status_idx on public.ideas(status);

alter table public.ideas enable row level security;

drop policy if exists "Workspace members can select ideas" on public.ideas;
create policy "Workspace members can select ideas"
  on public.ideas
  for select
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "Workspace members can insert ideas" on public.ideas;
create policy "Workspace members can insert ideas"
  on public.ideas
  for insert
  with check (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "Workspace members can update ideas" on public.ideas;
create policy "Workspace members can update ideas"
  on public.ideas
  for update
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "Workspace members can delete ideas" on public.ideas;
create policy "Workspace members can delete ideas"
  on public.ideas
  for delete
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = auth.uid()
    )
  );
