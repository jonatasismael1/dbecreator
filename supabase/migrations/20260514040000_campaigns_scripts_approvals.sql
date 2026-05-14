-- DBE Creator - Campaigns, script campaign links, and approval links

create table if not exists public.campaigns (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title        text not null,
  description  text,
  status       text not null check (status in ('planning','active','completed','paused')) default 'planning',
  start_date   date,
  end_date     date,
  goal         text,
  checklist    jsonb not null default '[]'::jsonb,
  created_by   uuid references auth.users(id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint campaigns_checklist_is_array check (jsonb_typeof(checklist) = 'array')
);

create index if not exists campaigns_workspace_id_idx on public.campaigns(workspace_id);
create index if not exists campaigns_status_idx on public.campaigns(workspace_id, status);

alter table public.campaigns enable row level security;

drop policy if exists "Workspace members can select campaigns" on public.campaigns;
create policy "Workspace members can select campaigns"
  on public.campaigns for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can insert campaigns" on public.campaigns;
create policy "Workspace members can insert campaigns"
  on public.campaigns for insert
  to authenticated
  with check (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can update campaigns" on public.campaigns;
create policy "Workspace members can update campaigns"
  on public.campaigns for update
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

drop policy if exists "Workspace members can delete campaigns" on public.campaigns;
create policy "Workspace members can delete campaigns"
  on public.campaigns for delete
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

alter table public.scripts
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null;

create index if not exists scripts_campaign_id_idx on public.scripts(campaign_id);
create index if not exists scripts_workspace_campaign_id_idx on public.scripts(workspace_id, campaign_id);

alter table public.scripts
  drop constraint if exists scripts_status_check;

alter table public.scripts
  add constraint scripts_status_check
  check (status in ('draft','ready','in_approval','approved','changes_requested','recorded'));

alter table public.script_versions
  add column if not exists campaign_id uuid references public.campaigns(id) on delete set null;

alter table public.script_versions
  drop constraint if exists script_versions_status_check;

alter table public.script_versions
  add constraint script_versions_status_check
  check (status in ('draft','ready','in_approval','approved','changes_requested','recorded'));

create or replace function public.ensure_script_campaign_workspace()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  campaign_workspace_id uuid;
begin
  if new.campaign_id is null then
    return new;
  end if;

  select workspace_id
  into campaign_workspace_id
  from public.campaigns
  where id = new.campaign_id;

  if campaign_workspace_id is null then
    raise exception 'Campaign not found for script.';
  end if;

  if campaign_workspace_id <> new.workspace_id then
    raise exception 'Campaign and script must belong to the same workspace.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_script_campaign_workspace_before_write on public.scripts;
create trigger ensure_script_campaign_workspace_before_write
  before insert or update of workspace_id, campaign_id on public.scripts
  for each row
  execute function public.ensure_script_campaign_workspace();

create or replace function public.capture_script_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    old.title is distinct from new.title or
    old.hook is distinct from new.hook or
    old.body is distinct from new.body or
    old.cta is distinct from new.cta or
    old.status is distinct from new.status or
    old.content_pillar_id is distinct from new.content_pillar_id or
    old.campaign_id is distinct from new.campaign_id
  ) then
    insert into public.script_versions (
      workspace_id,
      script_id,
      version_number,
      title,
      hook,
      body,
      cta,
      status,
      content_pillar_id,
      campaign_id,
      created_by
    )
    values (
      old.workspace_id,
      old.id,
      coalesce((select max(version_number) from public.script_versions where script_id = old.id), 0) + 1,
      old.title,
      old.hook,
      old.body,
      old.cta,
      old.status,
      old.content_pillar_id,
      old.campaign_id,
      (select auth.uid())
    );
  end if;

  return new;
end;
$$;

create table if not exists public.approvals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  script_id    uuid references public.scripts(id) on delete cascade not null,
  token        text not null unique default (
    replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  ),
  status       text not null check (status in ('pending','approved','requested_changes')) default 'pending',
  client_name  text,
  client_email text,
  expires_at   timestamptz,
  created_by   uuid references auth.users(id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists approvals_workspace_id_idx on public.approvals(workspace_id);
create index if not exists approvals_script_id_idx on public.approvals(script_id);
create index if not exists approvals_token_idx on public.approvals(token);
create index if not exists approvals_status_idx on public.approvals(workspace_id, status);

alter table public.approvals enable row level security;

drop policy if exists "Workspace members can select approvals" on public.approvals;
create policy "Workspace members can select approvals"
  on public.approvals for select
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can insert approvals" on public.approvals;
create policy "Workspace members can insert approvals"
  on public.approvals for insert
  to authenticated
  with check (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

drop policy if exists "Workspace members can update approvals" on public.approvals;
create policy "Workspace members can update approvals"
  on public.approvals for update
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

drop policy if exists "Workspace members can delete approvals" on public.approvals;
create policy "Workspace members can delete approvals"
  on public.approvals for delete
  to authenticated
  using (
    workspace_id in (
      select workspace_id
      from public.workspace_members
      where user_id = (select auth.uid())
    )
  );

create table if not exists public.approval_comments (
  id          uuid primary key default gen_random_uuid(),
  approval_id uuid references public.approvals(id) on delete cascade not null,
  author_name text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists approval_comments_approval_id_idx on public.approval_comments(approval_id);

alter table public.approval_comments enable row level security;

drop policy if exists "Workspace members can select approval comments" on public.approval_comments;
create policy "Workspace members can select approval comments"
  on public.approval_comments for select
  to authenticated
  using (
    approval_id in (
      select id
      from public.approvals
      where workspace_id in (
        select workspace_id
        from public.workspace_members
        where user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Workspace members can insert approval comments" on public.approval_comments;
create policy "Workspace members can insert approval comments"
  on public.approval_comments for insert
  to authenticated
  with check (
    approval_id in (
      select id
      from public.approvals
      where workspace_id in (
        select workspace_id
        from public.workspace_members
        where user_id = (select auth.uid())
      )
    )
  );

create or replace function public.ensure_approval_script_workspace()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  script_workspace_id uuid;
begin
  select workspace_id
  into script_workspace_id
  from public.scripts
  where id = new.script_id;

  if script_workspace_id is null then
    raise exception 'Script not found for approval.';
  end if;

  if script_workspace_id <> new.workspace_id then
    raise exception 'Approval and script must belong to the same workspace.';
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_approval_script_workspace_before_write on public.approvals;
create trigger ensure_approval_script_workspace_before_write
  before insert or update of workspace_id, script_id on public.approvals
  for each row
  execute function public.ensure_approval_script_workspace();

grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.approvals to authenticated;
grant select, insert on public.approval_comments to authenticated;
