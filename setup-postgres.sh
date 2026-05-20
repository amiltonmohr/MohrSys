#!/bin/bash
set -e

echo "📦 Instalando PostgreSQL 16..."
sudo apt update
sudo DEBIAN_FRONTEND=noninteractive apt install -y postgresql postgresql-contrib

echo "🗄️ Iniciando serviço PostgreSQL..."
sudo service postgresql start

echo "👤 Criando usuário offsetcalc..."
sudo -u postgres psql -c "CREATE USER offsetcalc WITH PASSWORD 'offsetcalc123';" 2>/dev/null || true

echo "📁 Criando banco de dados..."
sudo -u postgres psql -c "CREATE DATABASE offsetcalc OWNER offsetcalc;" 2>/dev/null || true

echo "🔧 Rodando migrations..."
sleep 2
psql -U offsetcalc -d offsetcalc -h localhost -f /home/amilton/mohrsys/offsetcalc-api/src/db/migrations/001_initial_schema.sql

echo "✅ PostgreSQL configurado com sucesso!"
echo "   User: offsetcalc"
echo "   Pass: offsetcalc123"
echo "   DB:   offsetcalc"
