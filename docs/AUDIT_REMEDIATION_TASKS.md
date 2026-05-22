# Auditoria e remediacao - DBE Creator

Data: 2026-05-22

## Entregue nesta rodada

- [x] Criar migration real de `materials` com RLS, indices e grants.
- [x] Corrigir policy insegura de `workspace_members` que permitia autoentrada em workspace alheio.
- [x] Substituir onboarding bloqueante por guia nao bloqueante de primeiros passos no Dashboard.
- [x] Persistir comentarios por secao em aprovacao publica por lote.
- [x] Impedir reprocessamento de aprovacoes publicas ja revisadas.
- [x] Proteger updates/deletes de ideias, materiais, pilares e metricas por `workspace_id`.
- [x] Validar workspace antes de criar lote de aprovacao.
- [x] Aplicar migrations no Supabase remoto.
- [x] Revogar privilegios perigosos de roles de browser em tabelas publicas.
- [x] Corrigir perda silenciosa de dados ao navegar entre passos do Mapa de Mercado.
- [x] Exibir erro de salvamento no Mapa de Mercado.
- [x] Corrigir erros de lint existentes.
- [x] Aplicar code splitting nas rotas principais.
- [x] Tornar o item "Perfil" do menu superior navegavel para Configuracoes.

## Backlog recomendado

- [ ] Trocar `alert`/`confirm` nativos por dialog/toast da UI em todos os fluxos destrutivos.
- [ ] Mover criacao de lote para Edge Function/RPC transacional caso o volume de uso aumente.
- [ ] Criar painel administrativo de membros/invites antes de abrir convites externos.
- [ ] Adicionar testes E2E para aprovacao publica individual e em lote.
- [ ] Revisar bundle de bibliotecas pesadas (`docx`, PDF/export e integracoes) com lazy loading mais granular.

## Candidatos a exclusao ou revisao

- [ ] Remover migrations vazias/duplicadas somente se ainda nao tiverem sido aplicadas no Supabase remoto.
- [ ] Remover endpoints/debugs de integracao que nao tenham uso de produto ou protege-los por flag de ambiente.
- [ ] Remover codigo legado de onboarding wizard se o novo guia de primeiros passos virar o fluxo definitivo.
