#!/usr/bin/env bash
# deploy.sh — build local + deploy para VM de produção
# Uso: ./scripts/deploy.sh
# Pré-requisito: rodar a partir da raiz do repositório

set -e

SSH_KEY="$HOME/.oci/mohrsys_vm"
VM="ubuntu@163.176.140.220"
CONTAINER="mohrsys-ui-1"

echo "🔨 Build..."
cd "$(dirname "$0")/../offsetcalc-ui"
npm run build
cd ..

echo "📤 Enviando para VM..."
rsync -az --delete -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  offsetcalc-ui/dist/ "$VM":/tmp/ui_dist/

echo "🐳 Copiando para container..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VM" "
  docker cp /tmp/ui_dist/index.html $CONTAINER:/usr/share/nginx/html/index.html &&
  docker exec $CONTAINER rm -rf /usr/share/nginx/html/assets &&
  docker exec $CONTAINER mkdir -p /usr/share/nginx/html/assets &&
  docker cp /tmp/ui_dist/assets/. $CONTAINER:/usr/share/nginx/html/assets/ &&
  docker exec $CONTAINER nginx -s reload
"

VERSION=$(node -p "require('./offsetcalc-ui/package.json').version")
echo ""
echo "✅ Deploy v$VERSION concluído — mohrsys.novusti.com.br"
