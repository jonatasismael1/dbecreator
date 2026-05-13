# Arquitetura Técnica — DBE Creator

## 1. Arquitetura Geral
O projeto segue uma arquitetura de **Single Page Application (SPA)** com um Backend-as-a-Service (BaaS).

## 2. Frontend
- **React (Vite):** Para uma experiência de usuário rápida e reativa.
- **Tailwind CSS:** Para estilização utilitária e responsiva.
- **shadcn/ui:** Biblioteca de componentes acessíveis e customizáveis.
- **TanStack Query:** Gerenciamento de estado de servidor e cache.
- **Framer Motion:** Animações fluidas para feedback de interface.

## 3. Backend (Supabase)
- **Auth:** Gerenciamento de usuários e sessões.
- **PostgreSQL:** Banco de dados relacional com suporte a JSONB.
- **RLS (Row Level Security):** Garantia de que usuários só acessam dados de seu próprio workspace.
- **Edge Functions:** Funções serverless em TypeScript para lógica sensível e integração com IA.

## 4. Banco de Dados
O modelo é **Multi-tenant** (Multi-workspace).
- Cada entidade (Ideia, Roteiro, etc.) possui um `workspace_id`.
- A tabela `workspace_members` define quem tem acesso a qual workspace e com qual nível de permissão.

## 5. Fluxo da IA (Deby)
1. Frontend envia o roteiro e contexto para uma **Supabase Edge Function**.
2. A Edge Function autentica a requisição e recupera a `OPENROUTER_API_KEY` do cofre do Supabase.
3. A função chama a API do **OpenRouter** enviando o System Prompt da Deby.
4. A resposta (JSON) é processada, logada no banco e retornada ao frontend.

## 6. Segurança
- **Client-Side:** Chave `ANON` pública, mas limitada pelo RLS.
- **Server-Side:** Chave `SERVICE_ROLE` usada apenas em ambiente controlado (Edge Functions).
- **IA:** Nunca trafegar chaves de IA no navegador.

## 7. Estratégia de Escala
- **Banco:** Índices em `workspace_id` e `user_id`.
- **Cache:** Uso intensivo de `staleTime` no TanStack Query.
- **IA:** Facilidade de trocar o modelo no OpenRouter alterando apenas uma variável de ambiente no Supabase.
