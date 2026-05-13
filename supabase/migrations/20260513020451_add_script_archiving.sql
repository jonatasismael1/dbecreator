alter table public.scripts
  add column if not exists archived_at timestamptz;

create index if not exists scripts_workspace_archived_at_idx
  on public.scripts(workspace_id, archived_at);
