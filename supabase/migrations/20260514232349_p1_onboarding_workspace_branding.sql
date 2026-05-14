-- DBE Creator - P1 onboarding and workspace branding

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

alter table public.workspaces
  add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-logos',
  'workspace-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Workspace members can upload workspace logos" on storage.objects;
create policy "Workspace members can upload workspace logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'workspace-logos'
    and (storage.foldername(name))[1] in (
      select workspace_id::text
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can update workspace logos" on storage.objects;
create policy "Workspace members can update workspace logos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'workspace-logos'
    and (storage.foldername(name))[1] in (
      select workspace_id::text
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'workspace-logos'
    and (storage.foldername(name))[1] in (
      select workspace_id::text
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Anyone can view workspace logos" on storage.objects;
create policy "Anyone can view workspace logos"
  on storage.objects for select
  using (bucket_id = 'workspace-logos');
