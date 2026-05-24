-- MohrSys — Migration 003
-- Renomeia 'Couchê' → 'Couchê Brilho' e insere gramatura 170g nos dados existentes

BEGIN;

-- Passo 1: renomeia 'Couchê' → 'Couchê Brilho' em todos os configs
UPDATE configs
SET materials = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'tipo' = 'Couchê'
        THEN jsonb_set(elem, '{tipo}', '"Couchê Brilho"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(materials) AS elem
)
WHERE materials @> '[{"tipo":"Couchê"}]';

-- Passo 2: insere 170g onde não existir e reordena por tipo e gramatura
UPDATE configs
SET materials = (
  SELECT jsonb_agg(elem ORDER BY
    CASE elem->>'tipo'
      WHEN 'Couchê Brilho' THEN 0
      WHEN 'Couchê Fosco'  THEN 1
      WHEN 'Offset'        THEN 2
      WHEN 'Reciclato'     THEN 3
      WHEN 'Kraft'         THEN 4
      WHEN 'Duplex'        THEN 5
      ELSE 99
    END,
    (regexp_replace(elem->>'gramatura', '[^0-9.]', '', 'g')::numeric)
  )
  FROM jsonb_array_elements(
    materials || '[{"tipo":"Couchê Brilho","gramatura":"170g","formato":"66x96cm","precoPorKg":12.00,"fatorAbs":1.0}]'::jsonb
  ) AS elem
)
WHERE materials @> '[{"tipo":"Couchê Brilho"}]'
  AND NOT materials @> '[{"tipo":"Couchê Brilho","gramatura":"170g"}]';

COMMIT;
