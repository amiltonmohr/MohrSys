# /ship — Fluxo Git: branch → commit → PR → merge

Você é responsável por executar o fluxo completo de publicação de mudanças no repositório. Sempre que mudanças precisam ser commitadas, siga este fluxo obrigatório:

**branch → commit → PR para main → merge**

## Argumentos opcionais

`$ARGUMENTS` pode conter:
- O tipo: `feature` ou `hotfix` (padrão: detectar pelo contexto)
- Uma descrição curta em kebab-case: ex. `feature/novo-calculo`, `hotfix/login-crash`
- Se não fornecido, deduza pelo contexto das mudanças (hotfix = bug urgente, feature = funcionalidade nova)

## Passos obrigatórios (execute sempre nesta ordem)

### 1. Verificar ponto de partida

```bash
git status
git branch --show-current
git log --oneline -5
```

Se não estiver em `main`, avise o usuário e pergunte se deve voltar para main antes de continuar. Se sim: `git checkout main && git pull origin main`.

### 2. Determinar tipo e nome da branch

- Analise `git diff` e `git status` para entender o que mudou
- Se `$ARGUMENTS` tiver tipo/nome, use-o
- Caso contrário, deduza:
  - Mudanças de CSS/UI/layout → `feature/`
  - Correção de bug crítico → `hotfix/`
  - Nova funcionalidade → `feature/`
- Gere um slug curto (2-4 palavras, kebab-case) descrevendo as mudanças
- Exemplo: `feature/layout-full-screen`, `hotfix/auth-token-expiry`

### 3. Criar e ir para a branch

```bash
git checkout -b <tipo>/<slug>
```

### 4. Staged + commit

- Analise `git diff` para escrever uma mensagem de commit clara
- Adicione apenas arquivos relevantes (nunca `.env`, segredos, `node_modules`)
- Use o formato:
  ```
  <tipo>(<escopo>): <descrição curta em português>
  
  <detalhes do que mudou e por quê — 2-4 linhas>
  
  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  ```
- Execute:
  ```bash
  git add <arquivos relevantes>
  git commit -m "..."
  ```

### 5. Push da branch

```bash
git push -u origin <branch>
```

### 6. Abrir Pull Request para main

Use `gh pr create`:
```bash
gh pr create \
  --base main \
  --title "<tipo>: <descrição>" \
  --body "$(cat <<'EOF'
## Resumo
- <bullet 1>
- <bullet 2>

## Como testar
- <passo 1>
- <passo 2>

🤖 Gerado com [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 7. Merge do PR

```bash
gh pr merge --merge --delete-branch
```

Se houver conflitos, resolva antes do merge.

### 8. Voltar para main e atualizar

```bash
git checkout main
git pull origin main
```

### 9. Relatório final

Informe ao usuário:
- Branch criada: `<nome>`
- Commit: `<hash curto> — <mensagem>`
- PR: `<URL do PR>`
- Status: merged ✓

## Regras

- NUNCA commite direto em `main`
- NUNCA use `--no-verify` ou `--force-push` para main
- NUNCA inclua arquivos `.env`, chaves privadas ou credenciais
- Se o PR falhar no merge por conflito, pare e explique o conflito ao usuário
- Se não houver mudanças (`git status` limpo), informe o usuário e não crie branch
