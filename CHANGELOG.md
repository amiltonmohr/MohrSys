# Changelog

Todas as mudanças notáveis do MohrSys são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
Versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.0] — 2026-05-24

### Adicionado
- Frontend React 18 + TypeScript + Vite (substituição do HTML vanilla)
- Sistema de autenticação com JWT (login/logout, tokens em localStorage)
- **CalculoPage**: cálculo de orçamentos para Impressão Simples, Bloco e Revista
  - Número do job auto-incrementado a partir do histórico (#00001, #00002...)
  - Tipo de material com cards visuais (🖨 Simples / 📋 Bloco / 📖 Revista)
  - Acabamentos em card separado com resumo de tags
  - Result section: 3 KPIs + tags + breakdown em 2 colunas (Job + Custo)
  - Comparativo de tiragens
  - Geração de Proposta PDF + WhatsApp
  - Geração de Ordem de Produção
- **ClientesPage**: cadastro completo com auto-fill CNPJ (BrasilAPI) e CEP (ViaCEP)
- **HistoricoPage**: tabela de orçamentos com seleção múltipla, menu de ações, busca
- **ConfigPage**: configuração de papéis, chapas, máquinas, acabamentos, CI, impostos
- **DashboardPage**: 6 KPIs + 4 gráficos com filtro de período (Recharts)
- Header 3 colunas: logo / nav centrada / logout
- Footer com versão semântica
- UI 100% fiel ao HTML de referência `offsetcalc_5.html`
- Deploy em VM OCI (163.176.140.220) via Docker + nginx
- Scripts de automação: `release.sh`, `deploy.sh`, `rollback.sh`

### Infraestrutura
- nginx: no-cache para `index.html`, cache imutável (1 ano) para `/assets/`
- Docker Compose: ui (nginx) + api (node) + postgres + redis
- CI/CD: build local → rsync → docker cp → nginx reload
