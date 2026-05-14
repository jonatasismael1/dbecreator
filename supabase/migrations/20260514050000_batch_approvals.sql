-- DBE Creator - Batch Approvals

create table if not exists public.approval_batches (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  campaign_id  uuid references public.campaigns(id) on delete set null,
  token        text not null unique default (
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  ),
  status       text not null check (status in ('pending','approved','partially_approved','requested_changes')) default 'pending',
  client_name  text,
  client_email text,
  expires_at   timestamptz,
  created_by   uuid references auth.users(id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists approval_batches_workspace_id_idx on public.approval_batches(workspace_id);
create index if not exists approval_batches_token_idx on public.approval_batches(token);
create index if not exists approval_batches_status_idx on public.approval_batches(workspace_id, status);

alter table public.approval_batches enable row level security;

drop policy if exists "Workspace members can select approval batches" on public.approval_batches;
create policy "Workspace members can select approval batches"
  on public.approval_batches for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can insert approval batches" on public.approval_batches;
create policy "Workspace members can insert approval batches"
  on public.approval_batches for insert
  to authenticated
  with check (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can update approval batches" on public.approval_batches;
create policy "Workspace members can update approval batches"
  on public.approval_batches for update
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

drop policy if exists "Workspace members can delete approval batches" on public.approval_batches;
create policy "Workspace members can delete approval batches"
  on public.approval_batches for delete
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

create table if not exists public.approval_batch_items (
  id              uuid primary key default gen_random_uuid(),
  batch_id        uuid references public.approval_batches(id) on delete cascade not null,
  script_id       uuid references public.scripts(id) on delete cascade not null,
  status          text not null check (status in ('pending','approved','requested_changes')) default 'pending',
  client_feedback text,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists approval_batch_items_batch_id_idx on public.approval_batch_items(batch_id);
create index if not exists approval_batch_items_script_id_idx on public.approval_batch_items(script_id);

alter table public.approval_batch_items enable row level security;

drop policy if exists "Workspace members can select approval batch items" on public.approval_batch_items;
create policy "Workspace members can select approval batch items"
  on public.approval_batch_items for select
  to authenticated
  using (
    batch_id in (
      select id
      from public.approval_batches
      where workspace_id in (
        select workspace_id
        from public.workspace_members
        where user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Workspace members can insert approval batch items" on public.approval_batch_items;
create policy "Workspace members can insert approval batch items"
  on public.approval_batch_items for insert
  to authenticated
  with check (
    batch_id in (
      select id
      from public.approval_batches
      where workspace_id in (
        select workspace_id
        from public.workspace_members
        where user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Workspace members can update approval batch items" on public.approval_batch_items;
create policy "Workspace members can update approval batch items"
  on public.approval_batch_items for update
  to authenticated
  using (
    batch_id in (
      select id
      from public.approval_batches
      where workspace_id in (
        select workspace_id
        from public.workspace_members
        where user_id = (select auth.uid())
      )
    )
  )
  with check (
    batch_id in (
      select id
      from public.approval_batches
      where workspace_id in (
        select workspace_id
        from public.workspace_members
        where user_id = (select auth.uid())
      )
    )
  );

grant select, insert, update, delete on public.approval_batches to authenticated;
grant select, insert, update, delete on public.approval_batch_items to authenticated;
