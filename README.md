# MohrSys — OffsetCalc SaaS

Sistema de orçamento para gráficas offset — plataforma SaaS multi-tenancy.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| API | Node.js + Express + TypeScript |
| Database | PostgreSQL 14+ com Row-Level Security (RLS) |
| Cache | Redis |
| Auth | JWT (15min) + Refresh Token (7 dias) |
| CI/CD | GitHub Actions + Docker |

## Estrutura do Projeto

```
MohrSys/
├── offsetcalc-api/          # Backend REST API
│   ├── src/
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── db/              # Pool, migrations
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # JWT, logger, response helpers
│   ├── tests/               # Jest tests
│   └── Dockerfile
├── offsetcalc-ui/           # React SPA
│   ├── src/
│   │   ├── pages/           # Páginas principais
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── services/        # API calls (axios)
│   │   ├── hooks/           # React hooks
│   │   ├── store/           # Zustand state
│   │   └── types/           # TypeScript interfaces
│   └── Dockerfile
├── docker-compose.yml       # Dev environment
└── .github/workflows/       # CI/CD
```

## Setup Rápido (Docker)

```bash
# 1. Clone o repo
git clone https://github.com/amiltonmohr/MohrSys.git
cd MohrSys

# 2. Suba todos os serviços
docker-compose up --build

# 3. Acesse
# Frontend: http://localhost:5173
# API:      http://localhost:3000
# Health:   http://localhost:3000/health
```

## Setup Manual (Desenvolvimento)

### 1. PostgreSQL

```bash
psql postgresql://offsetcalc:offsetcalc123@localhost:5432/offsetcalc \
  -f offsetcalc-api/src/db/migrations/001_initial_schema.sql
```

### 2. API

```bash
cd offsetcalc-api
cp .env.example .env   # edite as variáveis
npm install
npm run dev            # porta 3000
```

### 3. Frontend

```bash
cd offsetcalc-ui
cp .env.example .env.local
npm install
npm run dev            # porta 5173
```

## Autenticação

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mohr.com","password":"Admin@123"}'

# Usar o token
curl http://localhost:3000/api/v1/quotes \
  -H "Authorization: Bearer <access_token>"
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Login → JWT |
| POST | `/api/v1/auth/refresh` | Renovar token |
| GET | `/api/v1/auth/me` | Perfil do usuário |
| POST | `/api/v1/quotes/calculate` | Calcular (sem salvar) |
| POST | `/api/v1/quotes` | Calcular e salvar |
| GET | `/api/v1/quotes` | Listar orçamentos |
| GET | `/api/v1/quotes/:id` | Detalhes |
| PUT | `/api/v1/quotes/:id` | Atualizar status |
| DELETE | `/api/v1/quotes/:id` | Arquivar |
| GET | `/api/v1/config` | Configuração do tenant |
| PUT | `/api/v1/config` | Atualizar config (admin) |
| GET | `/api/v1/clients` | Listar clientes |
| POST | `/api/v1/clients` | Criar cliente |

## Testes

```bash
cd offsetcalc-api && npm test      # Jest + coverage
cd offsetcalc-ui  && npm test      # Vitest + coverage
```

## Multi-Tenancy & Segurança

- **RLS (Row-Level Security)**: PostgreSQL filtra automaticamente por `tenant_id`
- **JWT**: Tokens de 15 min + refresh de 7 dias
- **RBAC**: admin, manager, user, viewer
- **Rate limiting**: 100 req/min por IP
- **Helmet**: Headers de segurança
- **CORS**: Origens configuráveis por `.env`

## Variáveis de Ambiente

Veja `.env.example` em cada subprojeto.

---

Desenvolvido com Claude Code · MOHR/SYS · Brasil
