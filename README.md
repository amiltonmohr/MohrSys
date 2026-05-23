# MohrSys — OffsetCalc SaaS

Sistema de orçamento para gráficas offset — plataforma SaaS multi-tenancy.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML puro + JS vanilla (sem framework), servido por nginx |
| API | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 com Row-Level Security (RLS) |
| Cache | Redis 7 |
| Auth | JWT (15min) + Refresh Token (7 dias) |
| Deploy | Docker + Docker Compose |

## Páginas implementadas

| Página | Descrição |
|--------|-----------|
| **Login** | Autenticação JWT via API, overlay sobre o app |
| **Cálculo** | Orçamento offset: simples / bloco / revista — 100% client-side |
| **Clientes** | CRUD de clientes com busca e integração com cálculo |
| **Configurações** | Papéis, máquinas, acabamentos, chapas, tintas, custos indiretos |
| **Orçamentos** | Histórico, OP, Proposta PDF, duplicar, aprovar, editar status |
| **Dashboard** | 6 KPIs + 4 gráficos (barras, pizza, horizontal, área) |

## Setup Rápido (Docker)

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
│   │   ├── services/            # Business logic (QuoteService, AuthService)
│   │   ├── middleware/          # Auth JWT, errorHandler
│   │   ├── db/                  # Pool pg, migrations SQL
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/               # JWT, logger, response helpers, validation
│   ├── Dockerfile               # Multi-stage: builder (tsc) + runner (node:alpine)
│   └── package.json
├── offsetcalc-ui/               # Frontend HTML puro
│   ├── index.html               # SPA completo (~4256 linhas) — toda lógica inline
│   ├── nginx.conf               # Serve HTML + proxy /api → API container
│   └── Dockerfile               # nginx:alpine + index.html (~10MB)
├── docker-compose.yml           # postgres + redis + api + ui
└── .claude/memory/              # Memória de desenvolvimento (Claude Code)
```

## Arquitetura de Dados

- **Cálculo**: 100% client-side — sem latência de rede
- **Config / Clientes / Histórico**: integrados com API (`/api/v1/`)
- **raw_entry**: orçamentos salvam o estado completo do frontend como JSONB para restauração fiel
- **Multi-tenancy**: PostgreSQL RLS filtra por `tenant_id` automaticamente

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
| PUT | `/api/v1/clients/:id` | Atualizar cliente |
| DELETE | `/api/v1/clients/:id` | Remover cliente |
| GET | `/api/v1/quotes` | Listar orçamentos |
| POST | `/api/v1/quotes` | Salvar orçamento |
| PUT | `/api/v1/quotes/:id` | Atualizar status |
| DELETE | `/api/v1/quotes/:id` | Remover orçamento |

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

## Segurança

- **RLS**: Row-Level Security no PostgreSQL por tenant
- **JWT**: Access token 15min + refresh 7 dias
- **Helmet**: Headers de segurança HTTP
- **Rate limiting**: 100 req/min por IP
- **CORS**: Origens configuráveis via env

---

Desenvolvido com Claude Code · MOHR/SYS · Brasil
