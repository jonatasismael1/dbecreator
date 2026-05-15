# 🗺️ Mapa Completo — DBE Creator

Este documento serve como o Guia Definitivo (PRD, Arquitetura e Design) do **DBE Creator**. Ele detalha o que o produto é, como ele funciona e como foi construído.

---

## 🎯 1. Visão do Produto

O **DBE Creator** não é apenas um editor de roteiros; é um **Sistema Operacional para Criadores de Conteúdo Estratégico**. Seu objetivo principal é transformar o caos da criação de Reels em um fluxo lógico, orientado por dados e focado em conversão (vendas).

### Tese Central
> "Conteúdo que vende não nasce por acaso; ele nasce de um processo de análise de mercado, pilares estratégicos e roteirização técnica."

*   **Público-Alvo:** Social Medias, Infoprodutores, Freelancers de Conteúdo e Pequenos Negócios.
*   **Problema Resolvido:** Bloqueio criativo, falta de estratégia nos vídeos e processos de aprovação lentos.

---

## 🚀 2. Módulos e Features

O sistema é composto por módulos integrados que cobrem todo o ciclo de vida do conteúdo:

### A. Estratégia (A Fundação)
1.  **Mapa de Mercado:** Ferramenta de diagnóstico para definir nicho, concorrentes, diferenciais e a "dor principal" do público.
2.  **Pilares de Conteúdo:** Categorização estratégica dos vídeos (Autoridade, Venda, Conexão, Educação).

### B. Criação (O Motor)
3.  **Central de Ideias:** "Cérebro" do workspace para capturar insights rápidos antes que sumam.
4.  **Editor de Roteiros:** Editor técnico dividido em Gancho (Hook), Desenvolvimento e CTA.
5.  **Biblioteca de Materiais:** Repositório de referências (links, áudios, arquivos) para apoiar a criação.
6.  **Campanhas:** Agrupamento de roteiros para lançamentos ou ofertas específicas.

### C. Inteligência (A Validação)
7.  **Análise Deby (IA):** Camada de IA que atua como uma Diretora de Conteúdo, avaliando o roteiro, dando uma nota (Score) e sugerindo melhorias técnicas.

### D. Operação (A Entrega)
8.  **Calendário Editorial:** Visão visual e arrastável da programação de postagens.
9.  **Link de Aprovação:** Interface externa simplificada para clientes aprovarem ou solicitarem alterações sem precisar de login.
10. **Teleprompter:** Modo de leitura otimizado para gravação em dispositivos móveis.

---

## 🔄 3. Fluxo de Trabalho Central (The Golden Path)

`Ideia → Definição de Pilar → Roteirização → Análise Deby → Aprovação (opcional) → Agendamento → Gravação (Teleprompter)`

---

## 🛠 4. Arquitetura Técnica

O DBE Creator foi construído com as tecnologias mais modernas para garantir performance e escalabilidade.

### Stack Principal
*   **Frontend:** React (Vite) + TypeScript.
*   **Estilização:** Tailwind CSS + shadcn/ui + Framer Motion (animações).
*   **Estado/Dados:** TanStack Query (Server State) + Zod (Validação) + React Hook Form.
*   **Backend-as-a-Service:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
*   **IA:** OpenRouter (acesso a múltiplos LLMs como GPT-4o e Claude 3.5 Sonnet).

### Padrão de Pastas
O projeto utiliza uma estrutura organizada por **Features**:
*   `src/features/`: Lógica isolada (Ex: `auth`, `scripts`, `ideas`).
*   `src/components/`: UI pura e componentes compartilhados.
*   `src/app/`: Configurações globais, providers e rotas.
*   `supabase/functions/`: Lógica server-side (IA e Integrações).

---

## 📊 5. Estrutura de Dados (Entidades)

O banco de dados é **Multi-tenant**, garantindo isolamento total via `workspace_id`.

*   **Workspaces:** A unidade central (Empresa/Projeto).
*   **Profiles:** Dados do usuário.
*   **Market Maps:** Diagnóstico estratégico único por workspace.
*   **Scripts:** O coração do conteúdo, vinculado a ideias e pilares.
*   **AI Analyses:** Logs de todas as análises feitas pela Deby.
*   **Calendar Items:** Datas e plataformas de publicação.

---

## 🎨 6. Design & UX

### Direção Visual: "Creative Cockpit"
O design é inspirado em painéis de alta performance e softwares premium (Apple-like).
*   **Modo:** Dark Mode nativo (Deep Space).
*   **Paleta:** Marinho escuro (`#080B12`), Azul Elétrico (`#2563EB`) e Emerald (`#10B981`).
*   **Tipografia:** Inter e Outfit para um visual moderno e limpo.
*   **Componentes:** Cards com bordas sutis, glassmorphism e micro-interações.

### Princípios de UX
1.  **Redução de Carga Cognitiva:** Informação apenas onde é necessária.
2.  **Mobile-First:** Teleprompter e Dashboard operáveis com uma mão.
3.  **Feedback Instantâneo:** Animações de loading e toasts informativos.

---

## 🧠 7. A Inteligência: Deby

A **Deby** não é um chat generativo comum. Ela é configurada via System Prompt para ser:
*   **Crítica:** Ela não elogia roteiros ruins.
*   **Técnica:** Focada em retenção e psicologia de consumo de vídeos curtos.
*   **Estratégica:** Ela cruza o roteiro com o Mapa de Mercado e o Pilar de Conteúdo.

---

## 🔐 8. Segurança e Privacidade

*   **Row Level Security (RLS):** Nenhuma query no frontend pode acessar dados de outro workspace.
*   **Edge Functions:** Chaves de API sensíveis nunca tocam o navegador do usuário.
*   **Isolamento:** Usuários podem pertencer a múltiplos workspaces com permissões diferentes (Admin, Editor, Viewer).

---

> [!NOTE]
> Este mapa é um documento vivo e deve ser atualizado a cada grande mudança na arquitetura ou visão do produto.
