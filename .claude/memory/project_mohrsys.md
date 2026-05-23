---
name: project-mohrsys
description: "MohrSys SaaS - sistema de orçamento para gráficas offset, multi-tenancy, stack, estado atual e progresso de implementação"
metadata: 
  node_type: memory
  type: project
  originSessionId: f2c77630-3c1c-43ad-82e8-daa6c46ff264
---

Sistema de orçamento para gráficas offset — plataforma SaaS multi-tenant vendível.

**Repositório:** github.com/amiltonmohr/MohrSys (acesso via SSH)
**HTML de referência:** offsetcalc_5.html (design e lógica originais — 3778 linhas, base da integração)

## Stack Atual (pós feat/api-integration)
- Frontend: **HTML puro + JS vanilla** (sem React, sem Vite) — arquivo único `offsetcalc-ui/index.html` (~4256 linhas)
- UI server: nginx:alpine servindo o HTML + proxy /api → container API
- Backend: Node.js + Express + TypeScript (porta 3000)
- DB: PostgreSQL 16 com RLS (Row-Level Security)
- Auth: JWT 15min + Refresh Token 7 dias (armazenados em sessionStorage)
- Cache: Redis 7

## Estrutura Docker (ambiente pronto)
- `docker compose up --build -d` sobe tudo: postgres + redis + api + ui
- UI em http://localhost:5173 — nginx serve HTML e proxia /api → container api
- API em http://localhost:3000 — healthcheck em /health
- Credenciais: admin@mohr.com / Admin@123

## Arquitetura de Dados (implementada)
- Config: API `GET/PUT /api/v1/config` — mapeamento campos API↔frontend documentado abaixo
- Clientes: API `GET/POST/PUT/DELETE /api/v1/clients`
- Histórico de orçamentos: API `GET/POST/PUT/DELETE /api/v1/quotes`
- Cálculo: **roda 100% client-side** — sem latência de rede
- `raw_entry`: campo JSONB na tabela quotes para restauração fiel dos orçamentos no frontend
- Extras de config (imposto, CI breakdown, colsOrc): `localStorage` key `ms_cfg_extras`
- Tokens JWT: `sessionStorage` keys `ms_jwt` e `ms_refresh`

## Mapeamento de campos crítico

### Config API → Frontend
| API | Frontend |
|-----|---------|
| `materials` | `papeis` |
| `machines` | `maquinas` |
| `finishing` | `acabamentos` |
| `chapa_cost_brl` | `chapaCusto` |
| `ink_cost_cmyk_per_ml` | `tintaCmyk` |
| `labor_cost_per_hour_brl` | `ciPorHora` |

### Clientes API → Frontend
| API | Frontend |
|-----|---------|
| `name` | `nome` |
| `phone` | `tel` |
| `address` | `rua`+`num`+`bairro` |
| `city` | `cidade` |
| `state` | `estado` |
| `zip_code` | `cep` |
| `notes` | `obs` |

## Integração Frontend (index.html)
- **Login overlay**: exibido ao iniciar, some após auth bem-sucedida
- **`initApp()`**: carrega dados via API, renderiza tudo
- **`loadData()`**: GET /api/v1/config + GET /api/v1/quotes?limit=500
- **`salvarOrcamento()`**: POST/PUT /api/v1/quotes com raw_entry completo
- **`salvarCliente()`**: POST/PUT /api/v1/clients
- **`salvarConfig()`**: PUT /api/v1/config (fire-and-forget)
- **Mobile**: CSS responsivo com breakpoints 1100/768/480px + hambúrguer

## Backend — raw_entry
- `QuoteService.ts`: INSERT/UPDATE com raw_entry como JSONB
- `validation.ts`: `raw_entry: Joi.object().unknown(true).allow(null)`
- `types/index.ts`: `raw_entry?: Record<string, unknown> | null` em QuoteInput
- Migration: `ALTER TABLE quotes ADD COLUMN IF NOT EXISTS raw_entry JSONB`

## VM de Produção (OCI Oracle Cloud — sa-saopaulo-1)
- IP: 163.176.140.220
- OCID: ocid1.instance.oc1.sa-saopaulo-1.antxeljrz5upguicx6cn2bml54gll6xgznw5sj5fjwg5wztnvhnoaiu4raua
- Domínio: mohrsys.novusti.com.br (Cloudflare)
- **Status deploy:** pendente — imagens Docker criadas localmente, deploy ainda não realizado
- OCI CLI configurado em /home/ismael/.oci/config (chave API em Downloads)

## Branch ativa de desenvolvimento
- **Nunca commitar direto na main** — sempre via feature/ ou fix/
- Branch atual: feat/api-integration → merge para main via PR

## Atenção: Cyrílicos em tiраgemInput
- Propriedade `tiраgemInput` em ComparisonQuantity usa caracteres cirílicos (р=U+0440, а=U+0430)
- SEMPRE copiar os bytes diretamente, nunca redigitar
