update public.workspace_integrations
set
  access_token = null,
  updated_at = now()
where platform = 'instagram'
  and access_token is not null;
