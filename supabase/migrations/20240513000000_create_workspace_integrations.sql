create table public.workspace_integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform text not null, -- 'instagram', 'youtube', etc
  access_token text,
  account_id text,
  account_name text,
  status text not null default 'connected', -- 'connected', 'error', 'disconnected'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, platform) -- Usually one integration per platform per workspace
);

-- Enable RLS
alter table public.workspace_integrations enable row level security;

-- Policies
create policy "Users can view integrations of their workspaces"
  on public.workspace_integrations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspace_integrations.workspace_id
      and workspace_members.user_id = auth.uid()
    )
  );

create policy "Users can insert integrations to their workspaces"
  on public.workspace_integrations
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspace_integrations.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.role in ('owner', 'admin')
    )
  );

create policy "Users can update integrations of their workspaces"
  on public.workspace_integrations
  for update
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspace_integrations.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.role in ('owner', 'admin')
    )
  );

create policy "Users can delete integrations of their workspaces"
  on public.workspace_integrations
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspace_integrations.workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.role in ('owner', 'admin')
    )
  );


