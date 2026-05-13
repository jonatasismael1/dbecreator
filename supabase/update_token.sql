-- Local helper only. Do not commit real Meta tokens.
-- Prefer connecting Instagram from Settings so each workspace stores its own token.
update public.workspace_integrations
set access_token = '<META_ACCESS_TOKEN>',
    updated_at = now()
where platform = 'instagram'
  and workspace_id = '<WORKSPACE_ID>';
