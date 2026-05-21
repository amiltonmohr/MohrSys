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
- `feature/calculo-page-completa` (criada em 2026-05-20) — aguardando PR para main
- PR #1 já mergeado (feature/ui-fidelity-complete → main)
- **Nunca commitar direto na main** — sempre via feature/ ou fix/

## Progresso de implementação (atualizado 2026-05-20)

### ✅ Concluído (na main)
1. **`src/utils/calculator.ts`** — Engine de cálculo portada do HTML para TypeScript puro
   - `calcMelhoresFormatos()`, `calcular()`, `configDefault`, `PRESETS`
   - Tipos: `CalculatorInput`, `CalculatorResult`, `AppConfig`, `AcabamentoParam`, `PapelVia`, etc.
   - ATENÇÃO: propriedade `tiраgemInput` em CalculatorInput usa caracteres Cirílicos (р=U+0440, а=U+0430)

2. **`src/context/AppContext.tsx`** — Context global React (localStorage + sync API)

3. **`src/App.tsx`** — Navegação 5 abas + logo SVG MOHR + prop `onGoTo: (s: Secao) => void`

4. **`src/index.css`** — CSS completo com variáveis, componentes, responsive

5. Backend API completo: auth, quotes, clients, config, dashboard (routes + services)

### ✅ Concluído (branch feature/calculo-page-completa, aguardando PR)
6. **`src/pages/CalculoPage.tsx`** — REESCRITA COMPLETA, cálculo 100% client-side
   - 3 modos: Simples / Bloco (vias, chapas, papéis por slot) / Revista (páginas, capa)
   - Presets por tipo via PRESETS do calculator.ts
   - Formato de impressão dinâmico via calcMelhoresFormatos()
   - Tira/Retira com detecção automática de elegibilidade
   - Modal de acabamentos: laminação (lados), verniz local (%área), corte/vinco (setup/R$mil/faca)
   - Breakdown completo de custos + detalhes técnicos (jobLines)
   - Comparativo de tiragens on-demand (500/1k/2k/3k/5k/10k)
   - Autocomplete de cliente do AppContext
   - Salvar orçamento → addOrcamento() + redirect para histórico

### 🔲 Pendente (próximas implementações)
7. `src/pages/ConfigPage.tsx` — Falta: abas chapas/tintas/acabamentos/custos indiretos, edição in-line de papéis
8. `src/pages/ClientesPage.tsx` — Falta: busca/autocomplete melhorado, botão "→ Orçamento"
9. `src/pages/HistoricoPage.tsx` — Falta: OP (HTML nova janela), PDF/Proposta, editar, duplicar
10. `src/pages/DashboardPage.tsx` — Falta: 4 gráficos Chart.js (barras, doughnut, horizontal, stacked)

## Módulos do HTML original que DEVEM estar no front (100% fiel)
1. **Cálculo** — layout 3 colunas; tipos simples/bloco/revista; presets; formato-impressão dinâmico; tira/retira; modal de acabamentos com parâmetros; comparativo de tiragens; salvar orçamento
2. **Clientes** — cadastro nome+tel; busca; dropdown autocomplete no orçamento; "→ Orçamento"
3. **Configurações** — tabela papéis editável; chapas; tintas; máquinas; acabamentos; custos indiretos
4. **Orçamentos** — lista; aprovar; OP (HTML para nova janela); PDF/Proposta; editar; duplicar
5. **Dashboard** — 6 KPIs; 4 gráficos Chart.js (barras, doughnut, horizontal, stacked)

**Why:** O HTML original (offsetcalc_5.html) é o produto funcional validado com cliente — a migração para React deve ser 100% fiel em design e funcionalidade.
**How to apply:** Sempre comparar qualquer página com o HTML antes de considerar pronto. A lógica de cálculo em calculator.ts deve produzir os mesmos resultados que o HTML.
