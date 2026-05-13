# Controle de Tarefas - DBE Creator

## Status Atual
**Fase:** Etapa 6 - Calendario Editorial concluida  
**Progresso:** calendario custom, drag and drop, filtros e ajustes de sincronizacao da Deby implementados

## Etapa 1 - Fundacao
- [x] Inicializar projeto Vite + React + TS
- [x] Configurar Tailwind CSS
- [x] Configurar Supabase Client
- [x] Criar componentes base (Button, Card, Badge, etc.)
- [x] Criar Layout Root com Sidebar Navegavel
- [x] Criar Topbar com menu mobile
- [x] Implementar Tela de Login
- [x] Implementar Tela de Registro
- [x] Implementar Dashboard com StatCards e Empty States
- [x] Configurar React Router
- [x] Responsividade mobile

## Etapa 2 - Ideias e Materiais
- [x] CRUD de Central de Ideias
- [ ] Biblioteca de Materiais
- [x] Tags em ideias

## Etapa 3 - Mapa de Mercado e Pilares
- [x] Formulario de Mapa de Mercado
- [x] Definicao de Pilares de Conteudo
- [x] Visualizacao estrategica inicial no dashboard
- [x] Finalizacao do mapa sincronizada com Supabase
- [x] Insights da Deby apos completar o mapa de mercado

## Etapa 4 - Sistema de Roteiros
- [x] Migration `scripts` com `workspace_id`, RLS e vinculo com `content_pillars`
- [x] CRUD de roteiros com titulo, gancho, desenvolvimento, CTA e pilar de conteudo
- [x] Kanban de status: Rascunho, Pronto, Gravado
- [x] Versoes de Roteiro com snapshots automaticos em edicoes

## Etapa 5 - Deby V1
- [x] Migration `ai_analyses` com `workspace_id`, RLS e historico
- [x] Supabase Edge Function `analyze-script`
- [x] Supabase Edge Function `analyze-market-map`
- [x] Integracao OpenRouter somente na Edge Function
- [x] Interface `/deby` para analisar roteiros
- [x] Historico de analises
- [x] Score Deby em escala 0-10
- [x] Botao para atualizar roteiro com melhorias da Deby

## Etapa 6 - Calendario Editorial
- [x] Migration `calendar_items` com `workspace_id` e RLS
- [x] Visao mensal custom
- [x] Drag and drop de roteiros para agendamento
- [x] Drag and drop para mover itens entre dias
- [x] Filtros por plataforma

## Verificacao
- [x] `npm run build`
- [x] `npm run lint`
- [x] Aplicar migrations no Supabase remoto vinculado
- [x] Confirmar `script_versions` disponivel via API REST do Supabase
- [x] Deploy remoto da Edge Function `analyze-script`
- [x] Teste integrado real da Deby com roteiro temporario e retorno `200`
- [x] Confirmar conversao remota do score 55 para 5.5
- [x] Aplicar migration `market_map_deby_insights` no Supabase remoto
- [x] Deploy remoto da Edge Function `analyze-market-map`
- [ ] Aplicar migration localmente: bloqueado porque o Docker/Supabase local nao esta ativo neste ambiente.

## Proximos Passos
1. Iniciar Etapa 7 - Campanhas.
2. Melhorar experiencia mobile do drag and drop com fallback por menu, se necessario.

---

### Regras de Ouro
1. Nao avance para a IA antes de concluir a Etapa 4.
2. Nunca exponha chaves sensiveis no frontend.
3. Toda entidade de negocio deve respeitar `workspace_id`.
