#!/usr/bin/env bash
# run_migration.sh — aplica uma migration SQL no PostgreSQL da VM
# Uso: ./scripts/run_migration.sh 003_couche_brilho.sql

set -e

SSH_KEY="$HOME/.oci/mohrsys_vm"
VM="ubuntu@163.176.140.220"
MIGRATION="${1:?Informe o arquivo de migration. Ex: 003_couche_brilho.sql}"
MIGRATION_FILE="$(cd "$(dirname "$0")/../offsetcalc-api/src/db/migrations" && pwd)/$MIGRATION"

if [[ ! -f "$MIGRATION_FILE" ]]; then
  echo "Erro: arquivo não encontrado — $MIGRATION_FILE"
  exit 1
fi

echo "📤 Enviando migration para VM..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
  "$MIGRATION_FILE" "$VM":/tmp/"$MIGRATION"

echo "🐘 Aplicando migration no PostgreSQL..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VM" "
  docker cp /tmp/$MIGRATION mohrsys-postgres-1:/tmp/$MIGRATION
  docker exec mohrsys-postgres-1 psql -U offsetcalc -d offsetcalc -f /tmp/$MIGRATION
"

echo ""
echo "✅ Migration $MIGRATION aplicada com sucesso."
