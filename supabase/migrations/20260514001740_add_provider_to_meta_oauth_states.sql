alter table public.meta_oauth_states
  add column if not exists provider text not null default 'instagram';

create index if not exists meta_oauth_states_provider_idx
  on public.meta_oauth_states (provider, expires_at);
