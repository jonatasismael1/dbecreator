# PRD — DBE Creator

## 1. Visão Geral
O DBE Creator é um SaaS B2B/B2C focado na profissionalização da criação de conteúdo para vídeo curto (Reels/TikTok). O foco não é apenas "postar", mas sim "vender através do conteúdo estratégico".

## 2. Público-Alvo
- Freelancers de conteúdo
- Social Medias
- Experts e Infoprodutores
- Pequenos negócios que gravam Reels

## 3. Tese Central
Conteúdo que vende não nasce por acaso; ele nasce de um processo de análise de mercado, pilares estratégicos e roteirização técnica. A "Deby" (IA) atua como a camada de inteligência que valida se o esforço de gravação terá retorno.

## 4. Objetivos
- Reduzir o tempo de criação de roteiros.
- Aumentar a qualidade estratégica dos vídeos.
- Centralizar o fluxo de aprovação com clientes.
- Organizar a agenda de postagens.

## 5. Personas
- **Ana (Social Media):** Gerencia 5 clientes, precisa de agilidade e aprovação rápida.
- **Bruno (Expert):** Grava seus próprios vídeos, precisa de roteiros prontos e validados.

## 6. Módulos
1. **Autenticação:** Login via Magic Link ou Social (Supabase).
2. **Onboarding:** Coleta de dados sobre o nicho e tom de voz.
3. **Dashboard:** Visão geral de tarefas, ideias e performance.
4. **Central de Ideias:** "Banco de cérebros" para capturar insights.
5. **Materiais:** Repositório de referências, áudios e links.
6. **Mapa de Mercado:** Análise de concorrentes e diferenciais.
7. **Pilares de Conteúdo:** Definição estratégica (Ex: Autoridade, Venda, Conexão).
8. **Roteiros:** Editor focado em Gancho, Desenvolvimento e CTA.
9. **Análise Deby:** IA que dá score e feedback tático no roteiro.
10. **Calendário Editorial:** Gestão visual de datas de publicação.
11. **Campanhas:** Agrupamento de conteúdos para um lançamento ou oferta.
12. **Teleprompter:** Interface de leitura otimizada para gravação.
13. **Aprovação:** Link externo para clientes comentarem e aprovarem.
14. **Relatórios:** Dashboard de métricas manuais ou integradas (futuro).
15. **Configurações:** Perfil, Workspace e Membros.

## 7. MVP (Fase 1 a 5)
O MVP focará no fluxo: **Workspace → Ideia → Mapa/Pilar → Roteiro → Análise Deby**.

## 8. Requisitos Não Funcionais
- **Performance:** Carregamento de dashboard em < 2s.
- **Segurança:** Isolamento total entre Workspaces (RLS).
- **Mobile-First:** Teleprompter e Dashboard devem ser impecáveis no celular.

## 9. Riscos
- Alucinação da IA em nichos muito específicos.
- Complexidade excessiva no onboarding afastando usuários.
