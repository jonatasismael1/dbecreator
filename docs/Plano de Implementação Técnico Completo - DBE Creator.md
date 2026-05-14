# Plano de Implementação Técnico Completo — DBE Creator

## 1. Propósito

Este documento é o guia de execução técnica para o agente **Codex/Antigravity** implementar as melhorias do DBE Creator. Traduz os requisitos do PRD em especificações acionáveis de banco de dados, API e frontend.

**Regra de uso:** Leia este documento na íntegra antes de escrever qualquer linha de código. Se algo estiver ambíguo ou conflitar com o estado atual do codebase, pare e sinalize antes de assumir qualquer coisa.

---

## 2. Pré-condição Obrigatória (antes de qualquer fase)

Antes de iniciar a Fase P0, mapeie:

1. **Schema atual do banco:** leia as migrations existentes ou o `schema.sql`. Identifique as tabelas `scripts`, `approvals`, `workspaces`, `users` e suas colunas reais.
2. **Componentes existentes:** mapeie os arquivos `approvals-page.tsx`, `script-modal.tsx`, `deby-page.tsx`, `public-batch-approval-page.tsx`, `settings-page.tsx`, `campaigns-page.tsx`, `reports-page.tsx`, `dashboard-page.tsx`, `market-map-page.tsx`.
3. **Padrão de chamada de API:** identifique como as chamadas de API estão estruturadas hoje (fetch direto, React Query, SWR, etc.).
4. **Padrão de autenticação:** identifique como o `user` e o `workspace_id` são obtidos nos componentes.

Só prossiga após este mapeamento. Se algum arquivo não existir, sinalize antes de criar.

---

## 3. FASE P0 — Estabilidade e Integração Crítica

> Execute nesta ordem exata: P0.1 → P0.2 → P0.3. A P0.3 depende dos padrões visuais definidos na P0.2.

---

### P0.1 — Estabilidade na Geração de Links de Aprovação

**Objetivo:** Corrigir falhas de timeout e erro silencioso no fluxo de geração de links públicos de aprovação.

#### Banco de Dados

**Tabela `approvals`** — verificar/garantir a existência das colunas:

| Coluna | Tipo | Restrições | Notas |
|---|---|---|---|
| `id` | UUID | PK, default `gen_random_uuid()` | — |
| `script_id` | UUID | FK → `scripts.id`, NOT NULL | — |
| `client_name` | TEXT | NOT NULL | — |
| `public_link_id` | UUID | UNIQUE, NOT NULL, default `gen_random_uuid()` | Identificador público do link |
| `status` | TEXT | NOT NULL, default `'PENDENTE'` | Valores: `PENDENTE`, `APROVADO`, `REJEITADO` |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Data de expiração do link |
| `created_at` | TIMESTAMPTZ | NOT NULL, default `now()` | — |

Adicionar índice em `public_link_id` se não existir:
```sql
CREATE INDEX IF NOT EXISTS idx_approvals_public_link_id ON approvals(public_link_id);
```

**Tabela `scripts`** — verificar/garantir coluna:

| Coluna | Tipo | Notas |
|---|---|---|
| `approval_status` | TEXT | Valores: `RASCUNHO`, `ENVIADO_PARA_APROVACAO`, `APROVADO`, `REJEITADO` |

#### API

**Rota:** `POST /api/approvals/generate-link`

**Payload:**
```typescript
{
  script_id: string;   // UUID
  client_name: string; // Min 2 chars
}
```

**Lógica (passo a passo):**
1. Validar `script_id` (UUID válido, script pertence ao workspace do usuário autenticado).
2. Validar `client_name` (não vazio, mínimo 2 caracteres).
3. Verificar se já existe um link ativo (`status = 'PENDENTE'` e `expires_at > now()`) para este `script_id`. Se sim, retornar o link existente sem criar duplicata.
4. Gerar `public_link_id` via `gen_random_uuid()`.
5. Inserir registro em `approvals` com `expires_at = now() + interval '7 days'`.
6. Atualizar `scripts.approval_status = 'ENVIADO_PARA_APROVACAO'` para o `script_id`.
7. Retornar:
```typescript
{
  success: true;
  approval_id: string;
  public_url: string; // ex: "https://dbecreator.netlify.app/aprovacao/{public_link_id}"
  expires_at: string;
}
```

**Tratamento de erros:**
- Script não encontrado → 404 com mensagem clara.
- Script não pertence ao usuário → 403.
- Falha no banco → 500 com log detalhado (não expor detalhes internos ao cliente).
- Timeout → configurar `statement_timeout` no cliente Supabase para esta operação (máx. 10s).

**Rota:** `GET /api/aprovacao/[public_link_id]` (página pública)

**Lógica:**
1. Buscar `approvals` onde `public_link_id = :id` e `expires_at > now()`.
2. Se não encontrado ou expirado → renderizar página de erro amigável.
3. Retornar dados do roteiro para exibição pública.

#### Frontend — `approvals-page.tsx`

**Estados do botão "Gerar Link":**
- Idle: botão ativo com texto "Gerar link de aprovação".
- Loading: botão desabilitado com spinner + texto "Gerando link...".
- Sucesso: exibir link copiável + toast de sucesso + botão "Copiar link".
- Erro: toast de erro com mensagem amigável + botão "Tentar novamente".

**Após geração com sucesso:**
- O novo item aparece na lista de aprovações pendentes sem necessidade de recarregar a página.
- O status do roteiro na lista reflete "Enviado para Aprovação".

#### Testes

- [ ] Teste de integração: `POST /api/approvals/generate-link` com payload válido.
- [ ] Teste de integração: `POST` com script_id inválido → espera 404.
- [ ] Teste E2E: fluxo completo (login → abrir roteiro → gerar link → copiar link → acessar link como cliente).
- [ ] Teste: geração com link ativo já existente → retorna link existente, não cria duplicata.

---

### P0.2 — Feedback Visual para Análise da Deby IA

**Objetivo:** Padronizar os estados visuais de todas as invocações da IA (loading, sucesso, erro). Este padrão será reutilizado em P0.3 e em todas as fases seguintes.

#### Banco de Dados
N/A.

#### Componente Compartilhado

Criar (ou verificar se já existe) um componente reutilizável `DebyAnalysisResult`:

```typescript
// Estrutura de props sugerida
interface DebyAnalysisResultProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: {
    score?: number;           // 0–100
    risks?: string[];
    improvements?: string[];
    raw_text?: string;        // fallback se a IA retornar texto não estruturado
  };
  errorMessage?: string;
  onRetry?: () => void;
}
```

**Estado `loading`:**
- Spinner centralizado.
- Texto: "Analisando com a Deby..." (ou contextual ao tipo de análise).

**Estado `success`:**
- Seção "Score de Retenção": badge numérico colorido (verde ≥ 70, amarelo 40–69, vermelho < 40).
- Seção "Riscos Identificados": lista com ícone de alerta.
- Seção "Sugestões de Melhoria": lista com ícone de check.
- Se a resposta da IA não for JSON estruturado, exibir em `raw_text` em um bloco de texto simples.

**Estado `error`:**
- Ícone de erro + mensagem: "Não foi possível analisar o roteiro. Verifique sua conexão e tente novamente."
- Botão "Tentar novamente" se `onRetry` for fornecido.

#### Frontend — `deby-page.tsx`

Substituir qualquer estado de análise atual pelo componente `DebyAnalysisResult`.

#### Testes

- [ ] Teste visual (Storybook ou equivalente) para cada estado do `DebyAnalysisResult`.
- [ ] Teste: simular timeout na API de IA → estado de erro é exibido corretamente.

---

### P0.3 — IA Inline no Editor de Roteiros

**Objetivo:** Integrar a Deby diretamente no `script-modal`, eliminando a necessidade de navegar para outra página durante a criação do roteiro.

#### Banco de Dados

Nenhuma alteração de schema. A tabela `scripts` é a fonte dos dados.

**Considerar cache:** se `scripts.updated_at` não mudou desde a última análise, retornar resultado cacheado em vez de chamar a IA novamente.

#### API

**Rota:** `POST /api/deby/analyze-script-inline`

**Payload:**
```typescript
{
  script_id?: string;   // opcional, para cache e contexto
  section: 'GANCHO' | 'DESENVOLVIMENTO' | 'CTA' | 'FULL';
  content: string;      // conteúdo da seção ou do roteiro completo
}
```

**Lógica:**
1. Verificar cache: se `script_id` fornecido e `updated_at` não mudou → retornar resultado cacheado.
2. Construir prompt baseado na `section`:
   - `GANCHO`: "Analise este gancho para Reels. Avalie se gera curiosidade nos primeiros 3 segundos. Retorne JSON com `score` (0-100), `risks` (array de strings) e `improvements` (array de strings)."
   - `DESENVOLVIMENTO`: "Analise este desenvolvimento de roteiro para Reels. Avalie clareza, concisão e progressão lógica. Retorne JSON com `score`, `risks`, `improvements`."
   - `CTA`: "Analise este CTA para Reels. Avalie clareza da chamada para ação e alinhamento com o objetivo do criador. Retorne JSON com `score`, `risks`, `improvements`."
   - `FULL`: análise completa do roteiro.
3. Invocar a API do LLM com timeout de 15s.
4. Parsear resposta como JSON. Se falhar o parse, retornar `{ raw_text: <resposta_completa> }`.
5. Armazenar resultado em cache (Redis ou in-memory com TTL de 5 minutos atrelado ao `script_id` + `updated_at`).

**Resposta:**
```typescript
{
  success: true;
  section: string;
  analysis: {
    score?: number;
    risks?: string[];
    improvements?: string[];
    raw_text?: string;
  };
  cached: boolean;
}
```

#### Frontend — `script-modal.tsx`

**Botão inline por campo:**
- Adicionar ícone de IA (ex: ícone de raio ou logo Deby) no canto superior direito de cada textarea.
- Tooltip: "Analisar [Gancho/Desenvolvimento/CTA] com Deby".
- Ao clicar: invocar `POST /api/deby/analyze-script-inline` com a `section` correspondente.

**Botão geral:**
- Botão "Analisar roteiro completo" no rodapé do modal.
- Envia `section: 'FULL'` com o conteúdo completo.

**Exibição de resultado:**
- Usar o componente `DebyAnalysisResult` (criado em P0.2).
- Resultado exibido em um painel colapsável abaixo do campo analisado (ou em painel lateral, se o layout permitir).
- O painel pode ser fechado sem perder o conteúdo do editor.

**Nota importante:** não bloquear o editor durante o processamento. O usuário deve poder continuar escrevendo enquanto a IA processa.

#### Testes

- [ ] Teste de integração: análise de gancho retorna estrutura JSON correta.
- [ ] Teste: análise com conteúdo vazio → retorna erro de validação (não chama a IA).
- [ ] Teste: o editor permanece editável durante o processamento da IA.
- [ ] Teste: resultado do cache é retornado quando o conteúdo não mudou.

---

## 4. FASE P1 — Onboarding e Produtividade

> Só iniciar após autorização explícita do responsável. Executar em sequência: P1.1 → P1.2 → P1.3 → P1.4 → P1.5.

---

### P1.1 — AI Wizard para Onboarding e Mapa de Mercado

#### Banco de Dados

**Tabela `users`** — adicionar coluna:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
```

**Tabela `market_map`** — verificar existência das colunas: `niche`, `audience`, `pain`, `competitors`, `differentials`, `tone_of_voice`. Se a tabela não existir, criar conforme schema definido na pré-condição.

#### API

**Rota:** `POST /api/deby/market-map-wizard`

**Payload:**
```typescript
{ niche: string } // Ex: "Médico dermatologista com foco em rejuvenescimento"
```

**Lógica:**
1. Receber `niche`.
2. Invocar LLM com prompt: "Para um profissional com o seguinte nicho: '{niche}', gere sugestões para: público-alvo (audience), principais dores do público (pain), 3 concorrentes típicos (competitors), diferenciais competitivos (differentials) e tom de voz recomendado (tone_of_voice). Retorne JSON com essas chaves."
3. Parsear e retornar JSON.

#### Frontend — `dashboard-page.tsx` e `market-map-page.tsx`

**Lógica de ativação:**
- Verificar `onboarding_completed` ao carregar o dashboard.
- Se `false`: exibir modal de boas-vindas com botão "Configurar meu espaço" que inicia o wizard.
- O modal tem botão "Fazer depois" (fecha e não reaparece por 24h via localStorage; após 24h, reaparece até conclusão).

**Fluxo do wizard (modal multi-step):**
1. Step 1: campo "Qual é o seu nicho?" + botão "Avançar".
2. Step 2 (após "Avançar"): botão "Preencher com Deby IA" — ao clicar, chama a API e preenche os campos. Loading spinner durante a chamada. O usuário pode editar qualquer campo.
3. Step 3: revisão dos dados preenchidos + botão "Salvar e começar".
4. Ao salvar: persistir no banco e marcar `onboarding_completed = true`.

---

### P1.2 — Estimador de Tempo e Dicas de Escrita

#### Frontend — `script-modal.tsx`

**Implementação (puro frontend, sem API):**

```typescript
// Função de estimativa
function estimateReadingTime(text: string): { words: number; seconds: number } {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const seconds = Math.round((words / 130) * 60); // 130 palavras/minuto (fala em vídeo)
  return { words, seconds };
}
```

**UI:**
- Texto auxiliar abaixo de cada textarea: `"X palavras · ~Ys"` — atualizado a cada keystroke via `onChange`.
- Dicas como texto de placeholder ou tooltip `title`:
  - Gancho: "Gancho: menos de 3 segundos gera curiosidade imediata."
  - Desenvolvimento: "Desenvolvimento: apresente prova e contexto. Mantenha conciso para Reels."
  - CTA: "CTA: uma única chamada para ação, clara e direta."

---

### P1.3 — Branding do Workspace na Página de Aprovação

#### Banco de Dados

```sql
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS logo_url TEXT;
```

#### API

**Rota:** `POST /api/workspaces/{workspace_id}/upload-logo`

**Payload:** `multipart/form-data` com campo `logo`.

**Validações:**
- Tipos aceitos: `image/png`, `image/jpeg`, `image/webp`.
- Tamanho máximo: 2 MB.

**Lógica:**
1. Validar tipo e tamanho.
2. Upload para Supabase Storage em bucket `workspace-logos/{workspace_id}/logo.{ext}`.
3. Obter URL pública.
4. Atualizar `workspaces.logo_url`.
5. Retornar `{ logo_url: string }`.

**Rota:** `GET /api/workspaces/{workspace_id}` — garantir que inclua `logo_url` na resposta.

#### Frontend

**`settings-page.tsx`:**
- Campo de upload com preview da imagem atual (se houver).
- Botão "Alterar logo" abre file picker.
- Preview imediato antes de salvar.
- Botão "Remover logo" (opcional) que limpa `logo_url`.

**`public-batch-approval-page.tsx`:**
- Buscar `logo_url` do workspace ao carregar.
- Se existir: exibir `<img>` no cabeçalho com alt text.
- Se não existir: exibir nome do workspace em texto.

---

### P1.4 — Visualização de Roteiros dentro de Campanhas

#### API

**Rota:** `GET /api/campaigns/{campaign_id}/scripts`

**Query params opcionais:** `status`, `pillar_id`, `sort_by` (`created_at` | `title`), `sort_order` (`asc` | `desc`).

**Resposta:**
```typescript
{
  scripts: Array<{
    id: string;
    title: string;
    approval_status: string;
    pillar_id?: string;
    pillar_name?: string;
    created_at: string;
  }>;
}
```

#### Frontend — `campaigns-page.tsx`

- Seção "Roteiros da Campanha" com cards compactos.
- Badge de status com cor semântica (cinza=Rascunho, amarelo=Em aprovação, verde=Aprovado, vermelho=Rejeitado).
- Ações rápidas: "Visualizar" (abre modal read-only) e "Editar" (abre script-modal).
- Filtros: dropdown de status + dropdown de pilar.
- Ordenação: toggle por data ou título.

---

### P1.5 — Editor de Roteiros Aprimorado

#### Banco de Dados

Verificar tipo da coluna de conteúdo nos campos Gancho, Desenvolvimento e CTA na tabela `scripts`. Se forem `TEXT` simples, o editor rico pode salvar HTML diretamente — apenas garantir que o campo aceite HTML (sem truncamento de tamanho).

> ⚠️ Testar migração de conteúdo existente: o HTML gerado pelo editor rico deve ser renderizável nos componentes que hoje exibem esses campos (página de aprovação, teleprompter).

#### Frontend — `script-modal.tsx`

**Biblioteca recomendada:** Quill.js (leve, sem dependências pesadas, fácil de integrar).

**Toolbar mínima:** Negrito | Itálico | Sublinhado | Lista ordenada | Lista não-ordenada | Link.

**Itens a validar após integração:**
- Conteúdo salvo como HTML é renderizado corretamente na `public-batch-approval-page`.
- Conteúdo é renderizado corretamente no teleprompter (stripping de tags HTML se necessário).
- O estimador de tempo da P1.2 funciona com o texto extraído do HTML (usar `innerText` ou equivalente).

---

## 5. FASE P2 — Retenção e Valor Percebido

> Só iniciar após autorização explícita. Executar em sequência: P2.1 → P2.2 → P2.3 → P2.4.

---

### P2.1 — Aprovação em Lote

#### Banco de Dados

**Tabela `approvals`** — adicionar coluna opcional:
```sql
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);
```

Ou criar tabela `batch_approvals` se o modelo de dados exigir agrupamento explícito. Avaliar após leitura do schema atual.

#### API

**Rota:** `POST /api/approvals/batch-approve`

**Payload:**
```typescript
{
  approval_ids?: string[];  // aprovação de roteiros específicos
  campaign_id?: string;     // aprovação de campanha inteira
  client_name: string;
  client_signature?: string; // opcional, para registro
}
```

**Lógica:** validar IDs, atualizar status de todos para `APROVADO`, registrar `client_name` e timestamp.

#### Frontend — `public-batch-approval-page.tsx`

- Checkboxes em cada roteiro para seleção individual.
- Botão "Aprovar Selecionados" (ativo quando ao menos 1 selecionado).
- Botão "Aprovar Campanha Inteira" (se a página for de campanha).
- Modal de confirmação antes de executar a ação.
- Campo `client_name` obrigatório antes da confirmação.

---

### P2.2 — Expansão dos Recursos da Deby IA

#### API — Novos endpoints

**`POST /api/deby/suggest-hook`**
- Payload: `{ topic: string, context?: string }`
- Retorna: `{ hooks: string[] }` — 3 a 5 sugestões de gancho.

**`POST /api/deby/optimize-cta`**
- Payload: `{ cta_text: string, goal: string }`
- Retorna: `{ optimized_cta: string, explanation: string }`

**`POST /api/deby/generate-ideas`**
- Payload: `{ pillar_id: string, count: number }` — count: 1–10.
- Retorna: `{ ideas: Array<{ title: string, hook_suggestion: string, pillar: string }> }`

#### Frontend

- **`script-modal.tsx`:** botões "Sugestão de Gancho" e "Otimizar CTA" nos campos correspondentes.
- **`ideas-page.tsx`:** formulário de seleção de pilar + botão "Gerar com Deby" + exibição de cards de ideias com botão "Criar roteiro a partir desta ideia".

---

### P2.3 — Comentários por Bloco na Aprovação

#### Banco de Dados

```sql
CREATE TABLE IF NOT EXISTS approval_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('GANCHO', 'DESENVOLVIMENTO', 'CTA', 'GERAL')),
  created_by TEXT NOT NULL, -- nome do cliente (anônimo)
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_comments_approval_id ON approval_comments(approval_id);
```

#### API

**`POST /api/approvals/{approval_id}/comments`**
- Payload: `{ comment_text: string, section: string, created_by: string }`

**`GET /api/approvals/{approval_id}/comments`**
- Retorna comentários agrupados por seção.

**`PATCH /api/approvals/{approval_id}/comments/{comment_id}`**
- Payload: `{ resolved: boolean }` — apenas o criador pode marcar como resolvido.

#### Frontend

- **`public-batch-approval-page.tsx`:** campo de comentário abaixo de cada seção.
- **`approvals-page.tsx`:** exibição dos comentários agrupados por seção com badge de quantidade e botão "Resolver".

---

### P2.4 — Relatórios com Insights da Deby e Exportação em PDF

#### Banco de Dados

```sql
CREATE TABLE IF NOT EXISTS report_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  insight_text TEXT NOT NULL,
  recommendation_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### API

**`POST /api/reports/{report_id}/generate-ai-insights`**
- Payload: `{ instagram_data: JSON }`
- Lógica: invocar LLM com dados do Instagram para gerar 3–5 insights estratégicos. Persistir em `report_insights`.

**`GET /api/reports/{report_id}/export-pdf`**
- Lógica: gerar PDF com dados do relatório + insights da Deby.
- Biblioteca recomendada: Puppeteer (renderizar HTML para PDF no backend) ou jsPDF (frontend).
- O PDF inclui logo do workspace se disponível.

#### Frontend — `reports-page.tsx`

- Seção "Insights da Deby" com cards de insight.
- Botão "Atualizar Insights" (re-gera com dados mais recentes).
- Botão "Exportar PDF" — inicia download.

---

## 6. FASE P3 — Diferencial Competitivo

> Só iniciar após autorização explícita. Estas funcionalidades têm maior complexidade e devem ser planejadas individualmente com estimativas de esforço antes de execução.

| # | Funcionalidade | Complexidade | Dependências externas |
|---|---|---|---|
| P3.1 | Biblioteca de Templates | Média | Nenhuma |
| P3.2 | Colaboração em Tempo Real | Alta | Yjs, WebSockets ou Supabase Realtime |
| P3.3 | Integração com Outras Plataformas | Alta por plataforma | OAuth 2.0 de cada plataforma |
| P3.4 | Análise de Concorrência via IA | Alta | API de busca ou scraping ético |
| P3.5 | Gerador de Ideias Robusto | Média | Dados de tendências (web search tool) |

Para cada item da P3, antes de iniciar: apresentar uma proposta de arquitetura resumida e aguardar aprovação.

---

## 7. Requisitos Não Funcionais (Todas as Fases)

- **Performance:** APIs síncronas com resposta < 2s. Cache em análises de IA (TTL: 5 min, invalidado por `updated_at`). Lazy loading em listas longas.
- **Segurança:** Validação de entrada em todas as rotas. Uploads com validação de tipo e tamanho. Segredos nunca no frontend. RLS (Row Level Security) no Supabase para todas as tabelas com dados de usuário.
- **Responsividade:** Todas as interfaces funcionais em desktop, tablet e mobile. Atenção especial ao teleprompter em mobile.
- **Observabilidade:** Logging de erros em produção (Sentry ou equivalente). Alertas para falhas em fluxos críticos.
- **Testes:** Unitários para lógica de negócio, integração para rotas de API, E2E para fluxos críticos. Cobertura mínima de 70% para código novo.
- **Manutenibilidade:** ESLint + Prettier configurados. Componentes reutilizáveis. Nenhum `any` sem comentário justificando.

---

## 8. Protocolo de Reporte

Ao concluir cada fase, apresentar:

```
## Relatório de Conclusão — Fase [X]

### O que foi feito
- [tarefa]: [descrição]

### Arquivos modificados
- [caminho/arquivo.tsx] — [motivo]

### Migrações executadas
- [SQL ou "N/A"]

### Testes executados e resultado
- [descrição do teste] → [passou / falhou / pendente]

### Dívida técnica identificada
- [se houver]

### Aguardando autorização para Fase [X+1]
```

---

## Referências

[1] Auditoria Manus AI — Relatório Crítico de Produto, UX, Clareza, Usabilidade e Valor Percebido.  
[2] Auditoria Gemini Flash — Análise Profunda do Código-Fonte, Fluxos de Lógica, Arquitetura de Informação e Interface Visual.
