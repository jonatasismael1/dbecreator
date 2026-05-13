-- =============================================
-- DBE Creator - Migration v9: Market Map Deby Insights
-- =============================================

alter table public.market_maps
  add column if not exists deby_insights jsonb,
  add column if not exists last_insights_at timestamptz;
