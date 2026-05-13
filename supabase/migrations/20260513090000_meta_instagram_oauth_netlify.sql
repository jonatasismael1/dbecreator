alter table public.workspace_integrations
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists meta_user_id text,
  add column if not exists facebook_page_id text,
  add column if not exists facebook_page_name text,
  add column if not exists page_access_token_encrypted text,
  add column if not exists instagram_business_account_id text,
  add column if not exists token_expires_at timestamptz,
  add column if not exists permissions text[] not null default '{}';

create table if not exists public.meta_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  redirect_to text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.meta_oauth_states enable row level security;

create table if not exists public.meta_pending_instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  meta_user_id text not null,
  facebook_page_id text not null,
  facebook_page_name text not null,
  page_access_token_encrypted text not null,
  instagram_business_account_id text not null,
  instagram_username text,
  permissions text[] not null default '{}',
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.meta_pending_instagram_accounts enable row level security;

create index if not exists meta_pending_instagram_accounts_lookup_idx
  on public.meta_pending_instagram_accounts (user_id, workspace_id, expires_at);

create index if not exists workspace_integrations_instagram_account_idx
  on public.workspace_integrations (workspace_id, platform, instagram_business_account_id);
