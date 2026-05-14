-- DBE Creator - Update campaign status constraint

alter table public.campaigns
  drop constraint if exists campaigns_status_check;

alter table public.campaigns
  add constraint campaigns_status_check
  check (status in ('planning', 'active', 'completed', 'paused', 'in_approval'));
