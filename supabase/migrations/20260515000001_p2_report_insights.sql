-- P2.4 — Tabela de Insights da Deby para Relatórios

CREATE TABLE IF NOT EXISTS public.report_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  insight_text TEXT NOT NULL,
  recommendation_text TEXT,
  data_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_insights_workspace_id_idx ON public.report_insights(workspace_id);
CREATE INDEX IF NOT EXISTS report_insights_created_at_idx ON public.report_insights(workspace_id, created_at DESC);

ALTER TABLE public.report_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can select report insights" ON public.report_insights;
CREATE POLICY "Workspace members can select report insights"
  ON public.report_insights FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Workspace members can insert report insights" ON public.report_insights;
CREATE POLICY "Workspace members can insert report insights"
  ON public.report_insights FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Workspace members can delete report insights" ON public.report_insights;
CREATE POLICY "Workspace members can delete report insights"
  ON public.report_insights FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

GRANT SELECT, INSERT, DELETE ON public.report_insights TO authenticated;
