#!/usr/bin/env bash
# rollback.sh — volta para uma versão anterior e faz redeploy
# Uso: ./scripts/rollback.sh v1.0.0
#      ./scripts/rollback.sh          (lista as últimas 10 tags)

set -e

SSH_KEY="$HOME/.oci/mohrsys_vm"
VM="ubuntu@163.176.140.220"
CONTAINER="mohrsys-ui-1"

if [[ -z "$1" ]]; then
  echo "Versões disponíveis:"
  git tag -l "v*" | sort -V | tail -10
  echo ""
  echo "Uso: $0 <tag>   ex: $0 v1.0.0"
  exit 0
fi

TAG="$1"

# Valida que a tag existe
if ! git rev-parse "$TAG" &>/dev/null; then
  echo "Erro: tag '$TAG' não encontrada."
  echo ""
  echo "Versões disponíveis:"
  git tag -l "v*" | sort -V | tail -10
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "⚠️  Rollback para $TAG — isso vai rebuildar e redeployar."
echo "   Branch atual: $CURRENT_BRANCH"
read -rp "   Confirmar? [s/N] " CONFIRM
if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
  echo "Cancelado."
  exit 0
fi

echo ""
echo "📌 Checkout $TAG..."
git checkout "$TAG"

echo "🔨 Build..."
cd offsetcalc-ui
npm ci --silent
npm run build
cd ..

echo "📤 Enviando para VM..."
rsync -az --delete -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  offsetcalc-ui/dist/ "$VM":/tmp/ui_dist/

echo "🐳 Copiando para container..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VM" "
  docker cp /tmp/ui_dist/index.html $CONTAINER:/usr/share/nginx/html/index.html &&
  docker cp /tmp/ui_dist/assets     $CONTAINER:/usr/share/nginx/html/ &&
  docker exec $CONTAINER nginx -s reload
"

echo ""
echo "✅ Rollback para $TAG concluído — mohrsys.novusti.com.br"
echo ""

# Volta para a branch original
git checkout "$CURRENT_BRANCH"
echo "↩️  Voltou para branch $CURRENT_BRANCH"
