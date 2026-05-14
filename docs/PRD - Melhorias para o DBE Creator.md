# PRD — Melhorias para o DBE Creator

## 1. Introdução

Este documento consolida as descobertas de duas auditorias independentes do DBE Creator — uma realizada pela Manus AI (foco em experiência do usuário e estabilidade de fluxos) e outra pela Gemini Flash (foco em arquitetura interna, lógica de fluxo e integração de IA) — em um plano de ação claro e priorizado para implementação pelo agente Codex/Antigravity.

**Stack de referência:** TypeScript / React (frontend) · Supabase (PostgreSQL + Storage + Auth) · API da Meta (relatórios) · LLM via API (Deby IA).

---

## 2. Contexto do Produto

O DBE Creator é um SaaS de criação e gestão de roteiros de vídeo (especialmente Reels), com dois públicos principais:

- **Social media / criador profissional:** organiza campanhas, roteiros e aprovações para clientes.
- **Prestador de serviço, expert ou dono de negócio:** cria conteúdo para si mesmo, usando IA para acelerar.

As auditorias revelaram uma base técnica e visual sólida, com pontos de fricção significativos que precisam ser resolvidos antes do lançamento para usuários reais.

---

## 3. Diagnóstico Consolidado

**Pontos fortes:**
- Design "premium dark" moderno e consistente, com estados vazios bem desenhados.
- Estrutura de roteiro em Gancho / Desenvolvimento / CTA como diferencial estratégico real.
- Navegação lateral clara e consistente.
- Pilares de conteúdo como base estratégica.
- Aprovação em lote já concebida como funcionalidade central.
- Teleprompter funcional e bem implementado.
- Relatórios com dados reais via API da Meta.

**Problemas críticos identificados:**
- Geração de links de aprovação com falha recorrente (timeout/erro silencioso).
- Deby IA isolada em página separada, sem integração no fluxo de trabalho.
- Ausência de feedback visual durante processamento da IA.
- Onboarding passivo — o usuário se perde sem condução proativa.

---

## 4. Problemas e Requisitos (Priorizados)

### P0 — Corrigir antes de apresentar para usuários reais

#### P0.1 — Estabilidade na Geração de Links de Aprovação

**Problema:** O fluxo de geração de links públicos de aprovação falha repetidamente, impedindo o fluxo de trabalho central do produto.

**Requisito:** O link de aprovação deve ser gerado e acessível sem falhas. O fluxo completo — geração, cópia do link, acesso pelo cliente — deve funcionar de forma estável.

**Critérios de aceite:**
- Clicar em "Gerar link" sempre resulta em um link válido ou em uma mensagem de erro clara.
- O botão exibe estado de loading durante o processamento.
- O link gerado aparece na lista de aprovações pendentes imediatamente após a criação.
- Em caso de falha, a mensagem de erro é amigável e orientada para ação (ex: "Não foi possível gerar o link. Tente novamente.").
- O link permanece acessível por 7 dias.

**Impacto:** Essencial. Sem isso, o produto não pode ser apresentado a clientes reais.

---

#### P0.2 — Feedback Visual para Análise da Deby IA

**Problema:** Após clicar em "Analisar com Deby", não há indicação de processamento nem de conclusão. O usuário não sabe se algo aconteceu.

**Requisito:** Toda invocação da Deby IA deve ter estados visuais claros: loading, sucesso e erro.

**Critérios de aceite:**
- Loading: spinner ou skeleton visível enquanto a API processa.
- Sucesso: resultados exibidos em seções nomeadas (ex: "Score de Retenção", "Riscos", "Sugestões").
- Erro: mensagem amigável com opção de tentar novamente.
- O padrão visual é consistente em todas as telas onde a IA é invocada (`deby-page`, `script-modal`).

**Impacto:** Crítico para a percepção de funcionalidade e confiança na IA.

---

#### P0.3 — IA Inline no Editor de Roteiros

**Problema:** A Deby IA está em uma página separada. O usuário precisa sair do editor para usá-la, quebrando o fluxo de trabalho.

**Requisito:** Integrar a funcionalidade da Deby diretamente no modal de edição de roteiros, com botão de análise por campo (Gancho, Desenvolvimento, CTA) e/ou análise geral do roteiro.

**Critérios de aceite:**
- Botão "Analisar com Deby" visível no editor sem poluir a interface.
- A análise pode ser feita por campo individual ou pelo roteiro completo.
- As sugestões são exibidas de forma não-intrusiva (tooltip, popover ou painel colapsável).
- O usuário pode ignorar a sugestão sem perder o que estava escrevendo.
- Usa os mesmos padrões visuais de loading/erro definidos em P0.2.

**Impacto:** Transforma a IA de ferramenta secundária em co-piloto de criação.

---

### P1 — Melhorias importantes para vender melhor

#### P1.1 — AI Wizard para Onboarding e Mapa de Mercado

**Problema:** O checklist do dashboard não impede que novos usuários se percam. O Mapa de Mercado (6 passos) intimida e tem baixa taxa de conclusão.

**Requisito:** No primeiro acesso (ou enquanto `onboarding_completed = false`), guiar o usuário pelo Mapa de Mercado com suporte da IA. O usuário informa apenas o nicho e a IA sugere os demais campos.

**Critérios de aceite:**
- Tour guiado aparece automaticamente no primeiro acesso.
- O tour pode ser ignorado (não-bloqueante).
- Após informar o nicho, o botão "Preencher com Deby" gera sugestões para os campos restantes.
- O usuário pode editar qualquer sugestão antes de salvar.
- Ao finalizar, `onboarding_completed` é marcado como `true` e o tour não reaparece.

**Impacto:** Reduz fricção no primeiro uso e aumenta taxa de ativação.

---

#### P1.2 — Estimador de Tempo e Dicas de Escrita no Editor

**Problema:** O editor não fornece métricas de tempo estimado nem orientações de escrita, deixando o criador sem referência para otimizar o conteúdo para o formato Reel.

**Requisito:** Adicionar contador de palavras/segundos estimados abaixo de cada campo do roteiro, com dicas contextuais ao focar em cada campo.

**Critérios de aceite:**
- Contador exibe formato "X palavras · ~Ys" atualizado em tempo real.
- Dicas aparecem ao focar no campo (tooltip ou texto auxiliar), sem bloquear a escrita.
- Dicas por campo:
  - Gancho: "Um bom gancho tem menos de 3 segundos e gera curiosidade imediata."
  - Desenvolvimento: "Apresente prova e contexto. Mantenha conciso para Reels."
  - CTA: "Uma única chamada para ação, clara e direta."
- A estimativa de tempo usa ~130 palavras/minuto (fala em vídeo).

**Impacto:** Aumenta a qualidade dos roteiros produzidos.

---

#### P1.3 — Branding do Workspace na Página de Aprovação

**Problema:** A página de aprovação pública é funcional, mas genérica — sem identidade visual do criador ou agência, transmitindo pouco profissionalismo ao cliente.

**Requisito:** Permitir upload de logo do workspace nas configurações. Esse logo deve aparecer no cabeçalho da página pública de aprovação.

**Critérios de aceite:**
- Campo de upload de logo nas configurações do workspace, com preview.
- Validação de tipo (PNG, JPG) e tamanho máximo (2 MB).
- Logo armazenado no Supabase Storage e URL salva em `workspaces.logo_url`.
- Logo exibido na página pública de aprovação quando disponível; sem logo, exibe nome do workspace.
- Logo responsivo em desktop e mobile.

**Impacto:** Fortalece a marca do criador perante seus clientes.

---

#### P1.4 — Melhoria na Visualização de Roteiros dentro de Campanhas

**Problema:** A visualização de roteiros associados a uma campanha não é imediatamente clara, dificultando o acompanhamento de progresso.

**Requisito:** Exibir roteiros da campanha como cards compactos com status, pilar e ações rápidas. Incluir filtros por status e pilar.

**Critérios de aceite:**
- Seção "Roteiros da Campanha" visível no detalhe de cada campanha.
- Cada card exibe: título, status atual (com badge colorido), pilar associado.
- Ações rápidas: "Visualizar" e "Editar" acessíveis diretamente no card.
- Filtros funcionais por status e por pilar.
- Ordenação por data de criação e por título.

**Impacto:** Facilita a gestão de campanhas com muitos roteiros.

---

#### P1.5 — Editor de Roteiros Aprimorado (Formatação e Mídia)

**Problema:** O editor atual é básico (textareas simples), sem suporte a formatação ou inserção de mídia.

**Requisito:** Substituir os textareas por um editor de texto rico leve (ex: Quill.js), com formatação básica e suporte a inserção de links.

**Critérios de aceite:**
- Formatação disponível: negrito, itálico, sublinhado, listas ordenadas e não ordenadas.
- Inserção de links funcional.
- O conteúdo formatado é renderizado corretamente na página de aprovação e no teleprompter.
- A troca de editor não quebra roteiros existentes (migração de conteúdo testada).
- O editor é responsivo em mobile.

**Impacto:** Aumenta a qualidade e riqueza dos roteiros produzidos.

---

### P2 — Melhorias para retenção

#### P2.1 — Aprovação em Lote

**Problema:** O cliente precisa aprovar roteiro por roteiro. Para campanhas grandes, isso é impraticável.

**Requisito:** Permitir aprovação de múltiplos roteiros ou de uma campanha inteira em uma única ação na página pública de aprovação.

**Critérios de aceite:**
- Checkboxes para seleção de múltiplos roteiros.
- Botão "Aprovar Selecionados" e "Aprovar Campanha Inteira" (quando aplicável).
- Campo para nome do cliente registrar quem aprovou.
- Status de todos os roteiros selecionados atualizado para `APROVADO` no banco.
- Confirmação visual clara antes da aprovação (modal de confirmação).

---

#### P2.2 — Expansão dos Recursos da Deby IA

**Problema:** A Deby IA se limita a análise geral. Não oferece sugestões proativas de gancho/CTA nem geração de ideias por pilar.

**Requisito:** Adicionar endpoints e UI para: sugestão de ganchos, otimização de CTA e geração de ideias por pilar.

**Critérios de aceite:**
- Botão "Sugestão de Gancho" no campo Gancho do editor: retorna 3–5 opções.
- Botão "Otimizar CTA" no campo CTA: retorna versão otimizada com base no objetivo do roteiro.
- Botão "Gerar Ideias com Deby" na página de Ideias: permite selecionar pilar e retorna lista de ideias.
- Todas as sugestões são exibidas com os padrões visuais de loading/erro da P0.2.

---

#### P2.3 — Comentários por Bloco na Aprovação

**Problema:** O cliente não consegue dar feedback específico por seção do roteiro. Observações gerais dificultam a revisão.

**Requisito:** Permitir que o cliente adicione comentários diretamente em cada seção (Gancho, Desenvolvimento, CTA) na página de aprovação pública. O criador visualiza os comentários agrupados por seção no dashboard.

**Critérios de aceite:**
- Campo de comentário visível abaixo de cada seção na página de aprovação pública.
- Comentários salvos com a seção de origem (`section: GANCHO | DESENVOLVIMENTO | CTA`).
- No dashboard do criador, comentários exibidos agrupados por seção.
- O criador pode marcar um comentário como "resolvido".
- Notificação ao criador quando novo comentário é adicionado (in-app ou email).

---

#### P2.4 — Relatórios com Insights da Deby e Exportação em PDF

**Problema:** Os relatórios exibem dados, mas não geram insights acionáveis. Não há como exportar para compartilhar com o cliente.

**Requisito:** Adicionar insights estratégicos gerados pela Deby com base nos dados do Instagram, e botão de exportação em PDF.

**Critérios de aceite:**
- Insights exibidos em destaque na página de relatórios (ex: "Seus vídeos do pilar 'Venda' têm 20% mais engajamento. Considere criar mais 2 roteiros desta semana.").
- Botão "Exportar PDF" funcional, que gera e baixa o relatório formatado.
- O PDF inclui dados do Instagram e os insights da Deby.
- O PDF tem identidade visual básica (logo do workspace, se disponível).

---

### P3 — Diferenciais futuros (longo prazo)

| # | Funcionalidade | Descrição resumida |
|---|---|---|
| P3.1 | Biblioteca de Templates | Templates de roteiros pré-definidos por categoria (Venda, Tutorial, Storytelling). |
| P3.2 | Colaboração em Tempo Real | Múltiplos usuários editando o mesmo roteiro simultaneamente (Yjs + WebSockets). |
| P3.3 | Integração com Outras Plataformas | Conexão com TikTok, YouTube, Facebook para relatórios e publicação. |
| P3.4 | Análise de Concorrência via IA | Análise de perfis concorrentes para identificar tendências e lacunas. |
| P3.5 | Gerador de Ideias Robusto | Geração de ideias por nicho, pilares e tendências de mercado. |

---

## 5. Roadmap Resumido

| Fase | Foco | Itens |
|---|---|---|
| **Fase 1 (P0)** | Estabilidade e IA crítica | P0.1, P0.2, P0.3 |
| **Fase 1 (P1)** | Onboarding e produtividade | P1.1, P1.2, P1.3, P1.4, P1.5 |
| **Fase 2 (P2)** | Retenção e valor percebido | P2.1, P2.2, P2.3, P2.4 |
| **Fase 3 (P3)** | Diferencial competitivo | P3.1 → P3.5 |

---

## 6. Requisitos Não Funcionais

- **Performance:** Tempos de resposta de API < 2s para operações síncronas. Cache em análises de IA para roteiros não alterados.
- **Segurança:** Validação de entrada em todas as rotas. Upload de arquivos com validação de tipo e tamanho. Segredos nunca expostos no frontend.
- **Responsividade:** Todas as interfaces funcionais em desktop, tablet e mobile.
- **Observabilidade:** Logging de erros em produção (Sentry ou equivalente). Alertas para falhas nos fluxos críticos (geração de link, chamadas de IA).
- **Testabilidade:** Testes unitários para lógica de negócio, testes de integração para rotas de API, testes E2E para fluxos críticos (login → criar roteiro → gerar link → aprovação).

---

## 7. Métricas de Sucesso

- **Taxa de Ativação:** % de novos usuários que completam o onboarding e criam o primeiro roteiro.
- **Engajamento com IA:** Frequência de uso da Deby por sessão.
- **Estabilidade de Aprovação:** Taxa de sucesso na geração de links (meta: > 99%).
- **Retenção:** Retenção D7 e D30 de usuários pagantes.
- **NPS do fluxo de aprovação:** Satisfação do cliente final com a página de aprovação.

---

## Referências

[1] Auditoria Manus AI — Relatório Crítico de Produto, UX, Clareza, Usabilidade e Valor Percebido.  
[2] Auditoria Gemini Flash — Análise Profunda do Código-Fonte, Fluxos de Lógica, Arquitetura de Informação e Interface Visual.
