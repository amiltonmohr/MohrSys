#!/usr/bin/env bash
# release.sh — bumpa versão, commita, tagueia e pusha
# Uso: ./scripts/release.sh [patch|minor|major]
# Padrão: patch

set -e

TYPE=${1:-patch}

if [[ "$TYPE" != "patch" && "$TYPE" != "minor" && "$TYPE" != "major" ]]; then
  echo "Uso: $0 [patch|minor|major]"
  exit 1
fi

# Garante que está na main e limpa
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "Erro: execute na branch main (atual: $BRANCH)"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Erro: há mudanças não commitadas. Commite antes de fazer release."
  git status --short
  exit 1
fi

git pull origin main

# Bumpa versão no package.json (sem criar tag git ainda)
cd "$(dirname "$0")/../offsetcalc-ui"
npm version "$TYPE" --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")
cd ..

# Commita a mudança do package.json
git add offsetcalc-ui/package.json
git commit -m "chore: release v$VERSION"

# Cria tag anotada
git tag -a "v$VERSION" -m "Release v$VERSION"

# Pusha commit e tag
git push origin main
git push origin "v$VERSION"

echo ""
echo "✅ v$VERSION publicado com sucesso!"
echo "   Tag: v$VERSION"
echo "   Para fazer deploy: cd offsetcalc-ui && npm run build && ./scripts/deploy.sh"
echo "   Para rollback:     ./scripts/rollback.sh v<versao-anterior>"
