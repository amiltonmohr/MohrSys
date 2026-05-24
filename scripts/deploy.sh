#!/usr/bin/env bash
# deploy.sh — build local + deploy para VM de produção
# Uso: ./scripts/deploy.sh
# Pré-requisito: rodar a partir da raiz do repositório

set -e

SSH_KEY="$HOME/.oci/mohrsys_vm"
VM="ubuntu@163.176.140.220"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🔨 Build do frontend..."
cd "$ROOT/offsetcalc-ui"
npm run build

echo "📤 Enviando Dockerfile + dist para VM..."
rsync -az --delete -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  "$ROOT/offsetcalc-ui/dist/"       "$VM":/tmp/ui_dist/
rsync -az -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  "$ROOT/offsetcalc-ui/Dockerfile"  "$VM":~/MohrSys/offsetcalc-ui/Dockerfile
rsync -az -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  "$ROOT/offsetcalc-ui/nginx.conf"  "$VM":~/MohrSys/offsetcalc-ui/nginx.conf

echo "🐳 Rebuild da imagem UI na VM..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$VM" "
  cp -r /tmp/ui_dist ~/MohrSys/offsetcalc-ui/dist
  cd ~/MohrSys
  docker build -t mohrsys-ui:latest ./offsetcalc-ui
  docker stop mohrsys-ui-1 && docker rm mohrsys-ui-1
  docker run -d --name mohrsys-ui-1 --restart unless-stopped \
    -p 8080:80 \
    --network mohrsys_default \
    mohrsys-ui:latest
"

VERSION=$(node -p "require('$ROOT/offsetcalc-ui/package.json').version")
echo ""
echo "✅ Deploy v$VERSION concluído — mohrsys.novusti.com.br"
