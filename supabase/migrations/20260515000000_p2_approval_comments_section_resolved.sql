-- P2.3 — Comentários por Bloco na Aprovação
-- Adiciona section e resolved à tabela approval_comments existente

ALTER TABLE public.approval_comments
  ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'GERAL'
    CHECK (section IN ('GANCHO', 'DESENVOLVIMENTO', 'CTA', 'GERAL')),
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT false;

-- Policy para anon inserir comentários em aprovações públicas
-- (necessário para que o cliente possa comentar sem conta)
DROP POLICY IF EXISTS "Anyone can insert approval comments" ON public.approval_comments;
CREATE POLICY "Anyone can insert approval comments"
  ON public.approval_comments FOR INSERT
  TO anon
  WITH CHECK (
    approval_id IN (
      SELECT id FROM public.approvals
      WHERE expires_at IS NULL OR expires_at > now()
    )
  );

-- Policy para workspace members resolverem comentários
DROP POLICY IF EXISTS "Workspace members can update approval comments" ON public.approval_comments;
CREATE POLICY "Workspace members can update approval comments"
  ON public.approval_comments FOR UPDATE
  TO authenticated
  USING (
    approval_id IN (
      SELECT id FROM public.approvals
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    approval_id IN (
      SELECT id FROM public.approvals
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.approval_comments TO anon;
