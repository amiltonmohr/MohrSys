#!/bin/bash
set -e

echo "════════════════════════════════════════════════════"
echo "🚀 OffsetCalc SaaS — Setup Completo"
echo "════════════════════════════════════════════════════"

# 1. PostgreSQL Setup
echo ""
echo "📦 [1/3] Instalando PostgreSQL 16..."
sudo apt update >/dev/null 2>&1 && \
sudo DEBIAN_FRONTEND=noninteractive apt install -y postgresql postgresql-contrib >/dev/null 2>&1 && \
echo "✅ PostgreSQL instalado"

echo "🗄️  Iniciando serviço..."
sudo service postgresql start >/dev/null 2>&1 && echo "✅ Serviço iniciado"

echo "👤 Criando usuário e banco..."
sudo -u postgres psql -c "CREATE USER offsetcalc WITH PASSWORD 'offsetcalc123';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE offsetcalc OWNER offsetcalc;" 2>/dev/null || true
echo "✅ Usuário e banco criados"

echo "🔧 Rodando migrations SQL..."
sleep 2
psql -U offsetcalc -d offsetcalc -h localhost -f /home/amilton/mohrsys/offsetcalc-api/src/db/migrations/001_initial_schema.sql 2>/dev/null || {
  echo "⚠️  Nota: Se a migration falhar, execute manualmente:"
  echo "   psql -U offsetcalc -d offsetcalc -h localhost < offsetcalc-api/src/db/migrations/001_initial_schema.sql"
}
echo "✅ Banco de dados pronto"

# 2. API Ready
echo ""
echo "🖥️  [2/3] API pronta para rodar em terminal separado:"
echo "   cd /home/amilton/mohrsys/offsetcalc-api && npm run dev"

# 3. UI Ready
echo ""
echo "🎨 [3/3] UI pronta para rodar em terminal separado:"
echo "   cd /home/amilton/mohrsys/offsetcalc-ui && npm run dev"

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ SETUP COMPLETO!"
echo "════════════════════════════════════════════════════"
echo ""
echo "📋 Próximos passos:"
echo "   1. Abra 2 terminais novos (tmux/split ou guias)"
echo "   2. Terminal A: cd /home/amilton/mohrsys/offsetcalc-api && npm run dev"
echo "   3. Terminal B: cd /home/amilton/mohrsys/offsetcalc-ui && npm run dev"
echo "   4. Navegador: http://localhost:5173"
echo ""
echo "🔐 Credenciais:"
echo "   Email:    admin@mohr.com"
echo "   Senha:    senha123"
echo ""
