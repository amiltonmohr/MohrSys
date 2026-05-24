---
name: project-mohrsys
description: "MohrSys — sistema de orçamento para gráficas offset: stack React+TS, dados localStorage, deploy VM OCI ativo, UI idêntica ao HTML de referência"
metadata:
  type: project
---

Sistema de orçamento para gráficas offset — futura plataforma SaaS multi-tenant.

**Repositório:** github.com/amiltonmohr/MohrSys (acesso via SSH)
**HTML de referência:** `/mnt/c/Users/Ismael/Downloads/offsetcalc_5.html` — fonte da verdade para design e lógica de cálculo (3778+ linhas, vanilla JS)

## Stack Atual

### Frontend (`offsetcalc-ui/`)
- React 18 + TypeScript + Vite
- Build local: `npm run build` → `dist/`
- CSS: `src/index.css` (classes idênticas ao HTML de referência)
- Fontes: Space Grotesk (display) + DM Mono (mono) + DM Sans (sans) via Google Fonts
- Tema: light — `--bg:#f0eef5`, `--accent:#7c3aed`, `--accent2:#06b6d4`
- Páginas: CalculoPage, ClientesPage, ConfigPage, HistoricoPage, DashboardPage, LoginPage

### Backend (`offsetcalc-api/`)
- Node.js + Express + TypeScript (porta 3000)
- PostgreSQL 16 (`offsetcalc` db, user `offsetcalc`, pass `offsetcalc123`)
- Redis 7 (cache/sessões)
- JWT auth: access_token + refresh_token em `localStorage`

### Docker (projeto `mohrsys`)
- `mohrsys-ui-1`: nginx:alpine, porta 8080→80
- `mohrsys-api-1`: node, porta 3000
- `mohrsys-postgres-1` + `mohrsys-redis-1`
- nginx proxia `/api` → `http://api:3000`

## Arquitetura de Dados — IMPORTANTE

**TODOS os dados ficam em localStorage, NÃO na API.**
- `AppContext` (`src/context/AppContext.tsx`) gerencia tudo via localStorage
- `config` (papéis, chapas, máquinas, acabamentos, impostos, CI) → `localStorage`
- `clientes` → `localStorage`
- `historico` (orçamentos) → `localStorage`
- Auth tokens (`access_token`, `refresh_token`) → `localStorage`
- A API existe mas não é usada para dados de negócio ainda (futura integração)

## VM de Produção

- **IP:** 163.176.140.220
- **Domínio:** mohrsys.novusti.com.br (DNS Cloudflare)
- **Provedor:** OCI Oracle Cloud — sa-saopaulo-1
- **SSH key:** `/home/ismael/.oci/mohrsys_vm`
- **RAM:** 1 GB — **BUILD NUNCA pode rodar na VM**, sempre local
- **Status:** ATIVO e em produção

## Fluxo de Deploy (imutável)

1. `npm run build` na máquina local (WSL)
2. `rsync -az --delete -e "ssh -i ~/.oci/mohrsys_vm" dist/ ubuntu@163.176.140.220:/tmp/ui_dist/`
3. `docker cp /tmp/ui_dist/index.html mohrsys-ui-1:/usr/share/nginx/html/index.html`
4. `docker cp /tmp/ui_dist/assets mohrsys-ui-1:/usr/share/nginx/html/`
5. `docker exec mohrsys-ui-1 nginx -s reload`

## Estratégia nginx de cache

- `index.html`: `no-cache, no-store, must-revalidate` (sempre busca o HTML novo)
- `/assets/`: `public, immutable` (cache 1 ano — hash de conteúdo no nome do arquivo)

## UI — Fidelidade ao HTML de referência (concluído 2026-05-24)

Toda a UI React agora é idêntica ao `offsetcalc_5.html`. PRs #10, #11 e commits diretos entregaram:

### Header/Footer
- Grid 3 colunas: `minmax(280px,340px) minmax(0,1fr) minmax(0,1.5fr)`
- Logo SVG col 1, nav-tabs centradas col 2, logout alinhado à direita col 3
- Footer: `V1.0 · Todos os direitos reservados · MOHR/SYS · Brasil`

### CalculoPage (`src/pages/CalculoPage.tsx`)
- **Número do job**: display `#00001` auto-incrementado a partir do histórico (como `proximoNumero()` da referência)
- **Descrição do Produto**: no card Identificação (col 1), com botão `↺ auto` inline
- **Tipo de Material**: `.tipo-material-card` com ícones 🖨/📋/📖, nome e desc
- **Acabamentos**: card separado em col 2, botão flex+`+`, tags `.tag-teal` no resumo
- **Result section**: `result-grid` (4 col CSS padrão, 3 KPIs) → tags → 2-col `result-breakdown` (Composição do Job + Composição do Custo)
- Botões de ação: Salvar Orçamento / Proposta / Tiragens

### ClientesPage (`src/pages/ClientesPage.tsx`)
- Grid-2: formulário sempre visível à esquerda, lista à direita
- `.cli-row` com `.cli-info`, `.cli-nome`, `.cli-tel`, `.cli-actions`
- Ícones emoji: 📞 tel, ✉ email, 📍 endereço
- Badge PJ inline no nome
- Auto-fill CNPJ via BrasilAPI, auto-fill CEP via ViaCEP

### HistoricoPage (`src/pages/HistoricoPage.tsx`)
- `.hist-table` com checkbox de seleção, menu `•••`, badges de status
- Unitário sempre exibido (sem condição `> 0`)
- Ações: Aprovar, OP, Proposta PDF, Duplicar, Editar, Remover

### DashboardPage
- 6 KPIs em `result-grid`, 4 gráficos (Recharts)
- Filtro por período: todos / 30d / 90d / 365d

## Atenção: Cirílicos em tiраgemInput

Propriedade `tiраgemInput` usa caracteres cirílicos (р=U+0440, а=U+0430).
**SEMPRE copiar os bytes diretamente, nunca redigitar.**

## Histórico de PRs relevantes

- PR #10: Header, footer, ClientesPage, CalculoPage (tipo material + result section)
- PR #11: Histórico unitário sempre visível, result-grid 4 colunas; CalculoPage número auto, desc col 1, card Acabamentos separado
