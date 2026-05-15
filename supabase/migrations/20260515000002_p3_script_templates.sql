-- P3.1 — Biblioteca de Templates
-- Cria a tabela de templates de roteiros

CREATE TABLE IF NOT EXISTS public.script_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  hook_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  cta_template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.script_templates ENABLE ROW LEVEL SECURITY;

-- Política de leitura: qualquer usuário autenticado pode ler templates globais
CREATE POLICY "Authenticated users can select templates"
  ON public.script_templates FOR SELECT
  TO authenticated
  USING (true);

-- Política de inserção/update/delete: restrita (pode ser admin, mas por agora permitiremos todos para facilitar ou deixaremos insert restrito)
-- Como são templates globais do sistema, normalmente apenas admin insere, mas vamos permitir leitura para todos.
-- Para o MVP, inseriremos os templates via SQL direto.

-- Inserindo templates padrão
INSERT INTO public.script_templates (title, category, hook_template, body_template, cta_template)
VALUES
  (
    'Roteiro de Venda Direta',
    'Venda',
    'Você está cometendo ESSE erro que te impede de [Resultado Desejado]? Preste atenção.',
    'O maior problema que vejo profissionais cometerem é [Ação Incorreta]. Isso acontece porque [Explicação do Problema].\n\nA solução real não é [Tentativa Comum], mas sim [Seu Método/Produto]. Quando você aplica isso, o resultado é [Benefício Principal].',
    'Se você quer parar de perder tempo e resolver isso hoje, comente "EU QUERO" aqui embaixo que te mando o link no direct.'
  ),
  (
    'Tutorial Rápido (3 Passos)',
    'Tutorial',
    'Como fazer [Ação Difícil] em apenas 3 passos simples (o passo 2 é o mais importante!).',
    'Passo 1: [Primeira Ação]. Isso vai garantir a base.\n\nPasso 2: [Segunda Ação]. Aqui é onde a mágica acontece, certifique-se de [Detalhe Importante].\n\nPasso 3: [Terceira Ação]. Agora é só finalizar.',
    'Gostou da dica? Já salva esse vídeo para não perder quando for fazer!'
  ),
  (
    'Storytelling / Superação',
    'Storytelling',
    'Foi assim que eu saí de [Pior Cenário] para [Cenário Ideal] em apenas [Tempo].',
    'Há um tempo atrás, eu estava exatamente onde você está hoje. Eu tentava [Tentativa Frustrada] e nada dava certo. O ponto de virada foi quando eu descobri [Epifania/Descoberta].\n\nEu apliquei [Método] e os resultados começaram a aparecer. Não foi sorte, foi estratégia.',
    'Se você quer conhecer o método exato que eu usei, clica no link da minha bio.'
  );

GRANT SELECT ON public.script_templates TO authenticated;
