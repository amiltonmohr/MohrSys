-- MohrSys — Schema v2
-- Adiciona colunas que o frontend precisa mas estavam faltando no banco

-- ── quotes: raw_entry + prazo ────────────────────────────────
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS raw_entry   JSONB,
  ADD COLUMN IF NOT EXISTS prazo       DATE;

-- ── configs: campos de custo indireto, impostos, formatos e tinta ─
ALTER TABLE configs
  ADD COLUMN IF NOT EXISTS imposto_pct        DECIMAL(5,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ci_aluguel_brl     DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ci_energia_brl     DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ci_manutencao_brl  DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ci_outros_brl      DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ci_horas_mes       INT           NOT NULL DEFAULT 176,
  ADD COLUMN IF NOT EXISTS formatos           JSONB         NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tinta_cmyk_sg      DECIMAL(8,4)  NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS tinta_uv_per_ml    DECIMAL(8,4)  NOT NULL DEFAULT 0.090,
  ADD COLUMN IF NOT EXISTS tinta_uv_sg        DECIMAL(8,4)  NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS tinta_pantone_sg   DECIMAL(8,4)  NOT NULL DEFAULT 1.0;

-- ── clients: metadata já existe desde 001 — sem alteração ──────
