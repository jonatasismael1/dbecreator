# 🤖 AGENTS.md — Manual do Agente DBE Creator

Este documento é o guia definitivo para qualquer agente de IA ou desenvolvedor que atue no projeto **DBE Creator**. Siga estas diretrizes para manter a consistência, segurança e qualidade.

## 🎯 Visão do Produto
O **DBE Creator** é um "Sistema Operacional" para criação de conteúdo estratégico, focado em Reels que vendem. Ele transforma o caos da criação em um fluxo lógico e orientado por dados.

## 🔄 Fluxo Central
`Ideia → Roteiro → Análise Deby (IA) → Calendário → Gravação → Publicação → Performance`

## 🛠 Stack Tecnológica
- **Frontend:** React + TypeScript + Vite
- **Estilização:** Tailwind CSS + shadcn/ui + Framer Motion
- **Ícones:** Lucide Icons
- **Estado/Dados:** TanStack Query + Zod + React Hook Form
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- **IA:** OpenRouter (LLM flexível)

## 📁 Padrão de Pastas (Atomic/Feature based)
- `src/app/`: Rotas, providers e layouts globais.
- `src/components/`: Componentes UI (shadcn) e componentes de domínio específicos.
- `src/features/`: Lógica de negócio isolada por módulo (Auth, Scripts, etc).
- `src/lib/`: Configurações de bibliotecas externas (Supabase, AI Client).
- `src/hooks/`: Hooks customizados e reutilizáveis.
- `src/types/`: Definições de tipos TypeScript.

## ⚖️ Regras de Desenvolvimento
1. **Multi-workspace:** Toda tabela e chamada de dados deve considerar o `workspace_id`.
2. **Segurança:** Nunca exponha chaves sensíveis (Service Role ou API Keys de IA) no frontend.
3. **IA:** Chamadas de IA devem passar obrigatoriamente por Supabase Edge Functions.
4. **UI Premium:** Design escuro, moderno, com micro-interações e feedback visual claro.
5. **Componentização:** Se um elemento se repete ou é complexo, extraia para `components/`.

## 🧠 Regras da IA Deby
- Deby é uma **Diretora de Conteúdo**, não um chat de suporte.
- Ela deve ser crítica, técnica e estratégica.
- Toda análise deve seguir o schema JSON definido em `docs/AI_DEBY.md`.

## 🚫 O que NÃO fazer
- Não implementar Instagram API/Publicação automática no MVP.
- Não implementar pagamentos na fase de fundação.
- Não criar componentes gigantes (acima de 250 linhas, considere quebrar).
- Não usar cores "padrão" (red-500); use a paleta definida no `docs/DESIGN_SYSTEM.md`.

## 🚀 Ordem de Implementação
Siga rigorosamente a ordem definida em `docs/ROADMAP.md`. Não pule para a IA antes de ter a fundação de layout e autenticação pronta.
