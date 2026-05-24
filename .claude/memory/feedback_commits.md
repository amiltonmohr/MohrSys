---
name: feedback-commits
description: "Regras de branching, commit e deploy para MohrSys — nunca na main, build sempre local, memória vai para o GitHub"
metadata:
  type: feedback
---

## Branching e commits

Commits SEMPRE em branches `feature/<desc>` ou `fix/<desc>`, nunca diretamente na main.

**Why:** Instrução explícita — "os commits no github devem sempre ser através de feature ou fix, de acordo com o cenário, nunca direto na main".

**How to apply:**
- Antes de qualquer commit: confirmar que está em branch feature/* ou fix/*
- Merge na main sempre via PR com `gh pr merge --merge --delete-branch`
- Após merge: retornar para main local com `git checkout main && git pull`

## Deploy — build SEMPRE local

Build (`npm run build`) NUNCA deve rodar na VM de produção.

**Why:** VM tem apenas 1 GB de RAM — o processo de build do Vite/TypeScript mata a instância.

**How to apply:** Sempre build local → rsync → docker cp → nginx reload. Ver fluxo completo em [[project-mohrsys]].

## Memória vai para o GitHub

Os arquivos de memória (`.claude/memory/`) devem ser commitados no repositório MohrSys.

**Why:** Instrução explícita — "a memória também deve ir para o github". Garante continuidade entre sessões.

**How to apply:**
- Ao atualizar memórias: incluir `.claude/memory/` no commit ou abrir PR dedicado `fix/update-memory`
- Caminho local dos arquivos: `/home/ismael/MohrSys/.claude/memory/`
