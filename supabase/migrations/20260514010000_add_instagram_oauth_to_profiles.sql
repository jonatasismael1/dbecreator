alter table public.profiles
  add column if not exists ig_user_id text,
  add column if not exists ig_access_token text,
  add column if not exists ig_token_expires_at timestamptz;

create index if not exists profiles_ig_user_id_idx
  on public.profiles (ig_user_id)
  where ig_user_id is not null;
