# MohrSys — OffsetCalc SaaS

Sistema de orçamento para gráficas offset — plataforma SaaS multi-tenancy.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite (CSS puro, sem Tailwind) |
| API | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 com Row-Level Security (RLS) |
| Cache | Redis 7 |
| Auth | JWT (15min) + Refresh Token (7 dias) |
| Deploy | Docker + Docker Compose |

## Páginas implementadas

| Página | Descrição |
|--------|-----------|
| **Login** | Autenticação JWT via API |
| **Cálculo** | Orçamento offset: simples / bloco / revista — 100% client-side |
| **Clientes** | CRUD de clientes com busca e integração com cálculo |
| **Configurações** | Papéis, máquinas, acabamentos, chapas, tintas, custos indiretos |
| **Orçamentos** | Histórico, OP, Proposta PDF, duplicar, aprovar, editar status |
| **Dashboard** | 6 KPIs + 4 gráficos recharts (barras, pizza, horizontal, área) |

## Setup Rápido (Docker) ✅

```bash
# 1. Clone o repo
git clone git@github.com:amiltonmohr/MohrSys.git
cd MohrSys

# 2. Build e suba todos os serviços
docker compose up --build -d

# 3. Acesse
# Frontend: http://localhost:5173
# API:      http://localhost:3000
# Health:   http://localhost:3000/health
```

**Credenciais padrão:** `admin@mohr.com` / `Admin@123`

> **Nota Docker:** Requer Docker Engine 24+ com o plugin `docker compose` (v2).  
> No WSL2 (Ubuntu), instale com: `sudo apt-get install docker-ce docker-compose-plugin`

## Estrutura do Projeto

```
MohrSys/
├── offsetcalc-api/              # Backend REST API
│   ├── src/
│   │   ├── routes/              # Express routers (auth, quotes, config, clients, health)
│   │   ├── services/            # Business logic (AuthService)
│   │   ├── middleware/          # Auth JWT, errorHandler
│   │   ├── db/                  # Pool pg, migrations SQL
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # JWT, logger, response helpers
│   ├── Dockerfile               # Multi-stage: builder (tsc) + runner (node:alpine)
│   └── package.json
├── offsetcalc-ui/               # React SPA
│   ├── src/
│   │   ├── pages/               # CalculoPage, ConfigPage, ClientesPage,
│   │   │                        # HistoricoPage, DashboardPage, LoginPage
│   │   ├── context/             # AppContext (localStorage + API sync)
│   │   ├── utils/               # calculator.ts — engine de cálculo client-side
│   │   └── index.css            # CSS puro com variáveis CSS
│   ├── nginx.conf               # Serve SPA + proxy /api → API container
│   └── Dockerfile               # Multi-stage: builder (vite build) + runner (nginx)
├── docker-compose.yml           # postgres + redis + api + ui
└── .claude/memory/              # Memória de desenvolvimento (Claude Code)
```

## Setup Manual (Desenvolvimento WSL)

### 1. PostgreSQL local

```bash
# A migration já cria o schema e o usuário admin
psql postgresql://offsetcalc:offsetcalc123@localhost:5432/offsetcalc \
  -f offsetcalc-api/src/db/migrations/001_initial_schema.sql
```

### 2. API

```bash
cd offsetcalc-api
npm install
npm run dev            # ts-node-dev, porta 3000
```

### 3. Frontend

```bash
cd offsetcalc-ui
npm install
npm run dev            # Vite, porta 5173
```

## Variáveis de Ambiente (docker-compose)

| Variável | Valor padrão | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | `postgresql://offsetcalc:offsetcalc123@postgres:5432/offsetcalc` | Conexão PostgreSQL |
| `JWT_SECRET` | `dev-jwt-secret-key-minimum-32-characters` | Segredo JWT (troque em prod) |
| `REFRESH_TOKEN_SECRET` | `dev-refresh-secret-key-minimum-32-chars` | Segredo refresh (troque em prod) |
| `CORS_ORIGINS` | `http://localhost:5173` | Origens CORS permitidas |

## Autenticação

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mohr.com","password":"Admin@123"}'

# Usar token
curl http://localhost:3000/api/v1/config \
  -H "Authorization: Bearer <access_token>"
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check (db + uptime) |
| POST | `/api/v1/auth/login` | Login → JWT + refresh token |
| POST | `/api/v1/auth/refresh` | Renovar access token |
| GET | `/api/v1/auth/me` | Perfil do usuário autenticado |
| GET | `/api/v1/config` | Configuração do tenant |
| PUT | `/api/v1/config` | Atualizar configuração (admin) |
| GET | `/api/v1/clients` | Listar clientes |
| POST | `/api/v1/clients` | Criar cliente |
| GET | `/api/v1/quotes` | Listar orçamentos |
| POST | `/api/v1/quotes` | Salvar orçamento |
| PUT | `/api/v1/quotes/:id` | Atualizar status |
| DELETE | `/api/v1/quotes/:id` | Remover orçamento |

## Arquitetura de Dados

- **Cálculo**: 100% client-side via `calculator.ts` — sem latência de rede
- **Config / Clientes / Histórico**: `localStorage` + React Context (AppContext)
- **Sync API**: opcional — funciona offline, sincroniza quando disponível
- **Multi-tenancy**: PostgreSQL RLS filtra por `tenant_id` automaticamente

## Segurança

- **RLS**: Row-Level Security no PostgreSQL por tenant
- **JWT**: Access token 15min + refresh 7 dias
- **Helmet**: Headers de segurança HTTP
- **Rate limiting**: 100 req/min por IP
- **CORS**: Origens configuráveis via env

---

Desenvolvido com Claude Code · MOHR/SYS · Brasil
