# Design System — DBE Creator

## 🎨 Direção Visual
- **Conceito:** "Cockpit Criativo Premium".
- **Estética:** Dark Mode elegante, minimalista, com foco em legibilidade e tipografia moderna.
- **Sensação:** Ferramenta profissional, rápida e inteligente.

## 🌈 Paleta de Cores

### Neutros
- **Background Principal:** `#080B12` (Deep Space)
- **Background Cards/Sidebar:** `#0E1628` (Navy Dark)
- **Bordas:** `#1E293B`
- **Texto Primário:** `#F8FAFC` (Slate 50)
- **Texto Secundário:** `#94A3B8` (Slate 400)

### Destaques (Ações e Branding)
- **Principal (Azul):** `#2563EB` (Electric Blue)
- **Sucesso/DBE (Verde):** `#10B981` (Emerald)
- **Criatividade/IA (Roxo):** `#8B5CF6` (Violet)
- **Alerta:** `#F59E0B` (Amber)
- **Erro:** `#EF4444` (Red)

## ✍️ Tipografia
- **Títulos:** Inter ou Outfit (Bold/Semibold)
- **Corpo:** Inter (Regular)
- **Mono (Código/Scripts):** JetBrains Mono (para o editor de roteiros)

## 🧊 Componentes Base

### Cards
- Fundo: `bg-[#0E1628]`
- Borda: `border border-[#1E293B]`
- Hover: `hover:border-blue-500/50 transition-all`

### Botões
- **Primary:** Gradient Blue to Indigo.
- **Secondary:** Ghost style com borda sutil.
- **IA (Deby):** Gradient Purple to Pink com efeito de brilho.

### Inputs
- Background escuro, borda sutil, foco com anel azul ou roxo.

## 📱 Mobile-First
- Toda funcionalidade deve ser operável com uma mão (especialmente Teleprompter e Dashboard).
- Uso de Bottom Sheets para ações rápidas no mobile.

## ✨ Micro-animações
- Transições de rota suaves (Fade in).
- Progress bars animadas para o score da Deby.
- Efeito "Glassmorphism" sutil em modais.
