---
name: project-mohrsys
description: "MohrSys SaaS - sistema de orçamento para gráficas offset, multi-tenancy, stack, estado atual e progresso de implementação"
metadata: 
  node_type: memory
  type: project
  originSessionId: f4aa2509-ebfa-4a9a-bf17-3e1f75187821
---

Sistema de orçamento para gráficas offset — plataforma SaaS multi-tenant vendível.

**Repositório:** github.com/amiltonmohr/MohrSys (acesso via SSH)
**HTML de referência:** C:\Users\Amilton\Documents\MohrSys\offsetcalc_5.html (design e lógica originais que devem ser replicados 100%)

## Stack
- Frontend: React 18 + TypeScript + Vite (porta 5173) — SEM Tailwind, usa CSS puro com variáveis CSS
- Backend: Node.js + Express + TypeScript (porta 3000, rodando com ts-node-dev)
- DB: PostgreSQL 18 com RLS (Row-Level Security) para isolamento de tenants
- Auth: JWT 15min + Refresh Token 7 dias
- UI server em prod: Express server.mjs servindo /dist

## Estrutura WSL (projeto rodando)
- Projeto em: /home/amilton/mohrsys/
- API em: /home/amilton/mohrsys/offsetcalc-api/
- UI em: /home/amilton/mohrsys/offsetcalc-ui/
- Acesso: http://localhost:5173/app.html
- Usuario dev: admin@mohr.com / Admin@123

## Arquitetura de Dados (decisão de design)
- Config: localStorage + API sync (GET/PUT /api/v1/config)
- Clientes: localStorage + React state (AppContext)
- Histórico de orçamentos: localStorage + React state (AppContext)
- Cálculo: **roda client-side** usando config carregada — sem lag de rede
- Persistência API: opcional/eventual, funciona offline

## Branch ativa de desenvolvimento
- `feature/ui-fidelity-complete` (criada em 2026-05-19)
- **Nunca commitar direto na main** — sempre via feature/ ou fix/

## Progresso de implementação (2026-05-19)

### ✅ Concluído
1. **`src/utils/calculator.ts`** — Engine de cálculo portada do HTML para TypeScript puro
   - `calcMelhoresFormatos()` — encaixe de peças nos formatos 66×96
   - `calcular()` — função principal com todos os tipos (simples/bloco/revista)
   - `configDefault` — configuração padrão com todos os papéis, máquinas e acabamentos
   - `PRESETS` — atalhos de formatos pré-definidos
   - Tipos: `CalculatorInput`, `CalculatorResult`, `AppConfig`, etc.

2. **`src/context/AppContext.tsx`** — Context global React
   - Estado: config, clientes, historico, toastMsg
   - Persistência: localStorage com sync opcional para API
   - Funções: addCliente, editCliente, removeCliente, addOrcamento, updateOrcamento, removeOrcamento, toggleAprovado, toast

3. **`src/App.tsx`** — App principal refatorado
   - Logo SVG original da MOHR integrado
   - Navegação com 5 abas (Cálculo, Clientes, Configurações, Orçamentos, Dashboard)
   - Botão Sair
   - AppProvider envolvendo tudo
   - Passa prop `onGoTo` para navegação entre páginas

4. **`src/index.css`** — CSS completo idêntico ao HTML
   - Todas as variáveis CSS do HTML
   - Componentes: header, nav-tabs, card, field, btn, result, tag, toast, data-table, tipo-material-card, preset-btn, check-row, modal-pop
   - Responsive breakpoints

### 🔲 Pendente (próximas implementações)
5. `src/pages/CalculoPage.tsx` — Página principal de cálculo (3 colunas, todos os modos)
6. `src/pages/ConfigPage.tsx` — Configurações completas
7. `src/pages/ClientesPage.tsx` — Clientes completo
8. `src/pages/HistoricoPage.tsx` — Histórico com OP/PDF
9. `src/pages/DashboardPage.tsx` — KPIs + 4 gráficos Chart.js

## Módulos do HTML original que DEVEM estar no front (100% fiel)
1. **Cálculo** — layout 3 colunas; tipos simples/bloco/revista; presets; formato-impressão dinâmico; tira/retira; modal de acabamentos com parâmetros; comparativo de tiragens; salvar orçamento
2. **Clientes** — cadastro nome+tel; busca; dropdown autocomplete no orçamento; "→ Orçamento"
3. **Configurações** — tabela papéis editável; chapas; tintas; máquinas; acabamentos; custos indiretos
4. **Orçamentos** — lista; aprovar; OP (HTML para nova janela); PDF/Proposta; editar; duplicar
5. **Dashboard** — 6 KPIs; 4 gráficos Chart.js (barras, doughnut, horizontal, stacked)

**Why:** O HTML original (offsetcalc_5.html) é o produto funcional validado com cliente — a migração para React deve ser 100% fiel em design e funcionalidade.
**How to apply:** Sempre comparar qualquer página com o HTML antes de considerar pronto. A lógica de cálculo em calculator.ts deve produzir os mesmos resultados que o HTML.
