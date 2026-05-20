---
name: feedback-commits
description: "Regras de commit e branching para MohrSys — nunca na main, sempre feature/ ou fix/"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f4aa2509-ebfa-4a9a-bf17-3e1f75187821
---

Commits devem SEMPRE ser feitos em branches de feature ou fix, nunca diretamente na main.

**Why:** Instrução explícita do usuário — "os commits no github devem sempre ser através de feature ou fix, de acordo com o cenário, nunca direto na main".

**How to apply:**
- Antes de qualquer commit, verificar se está em branch feature/* ou fix/*
- Branch ativa de desenvolvimento: `feature/ui-fidelity-complete`
- Criar PR para merge na main quando fase estiver completa
- Nome de branches: `feature/<descricao>` ou `fix/<descricao>`

Memória também deve ir para o GitHub — incluir arquivos de memória nos commits.

**Why:** Instrução explícita — "a memoria também deve ir para o github".

**How to apply:** Incluir a pasta `/home/amilton/.claude/projects/-mnt-c-Windows-System32/memory/` nos commits do repo, copiando os arquivos para dentro do repositório em uma pasta `.claude/memory/`.
