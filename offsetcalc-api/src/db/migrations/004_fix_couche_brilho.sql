-- MohrSys -- Migration 004
-- Corrige estado do banco: deduplica materiais, renomeia Couche* para Couche Brilho, insere 170g
-- Usa chr(234) para o caractere e-circunflexo, evitando problemas de encoding no arquivo SQL

BEGIN;

-- Passo 1: deduplica + renomeia usando LIKE (sem depender de encoding especial)
UPDATE configs
SET materials = (
  SELECT jsonb_agg(fixed_elem ORDER BY
    CASE
      WHEN (fixed_elem->>'tipo') LIKE '%Brilho%' THEN 0
      WHEN (fixed_elem->>'tipo') LIKE '%Fosco%'  THEN 1
      WHEN (fixed_elem->>'tipo') LIKE 'Offset%'  THEN 2
      WHEN (fixed_elem->>'tipo') LIKE 'Recicl%'  THEN 3
      WHEN (fixed_elem->>'tipo') LIKE 'Kraft%'   THEN 4
      WHEN (fixed_elem->>'tipo') LIKE 'Duplex%'  THEN 5
      ELSE 99
    END,
    (regexp_replace(fixed_elem->>'gramatura', '[^0-9.]', '', 'g')::numeric)
  )
  FROM (
    SELECT DISTINCT ON ((elem->>'tipo'), (elem->>'gramatura'))
      CASE
        WHEN (elem->>'tipo') LIKE 'Couch%'
         AND (elem->>'tipo') NOT LIKE '%Fosco%'
         AND (elem->>'tipo') NOT LIKE '%Brilho%'
          THEN jsonb_set(elem, '{tipo}',
                 to_jsonb(('Couch' || chr(234) || ' Brilho')::text))
        ELSE elem
      END AS fixed_elem
    FROM jsonb_array_elements(materials) AS elem
    ORDER BY (elem->>'tipo'), (elem->>'gramatura')
  ) sub
)
WHERE materials::text LIKE '%Couch%';

-- Passo 2: insere 170g onde nao existir ainda
UPDATE configs
SET materials = (
  SELECT jsonb_agg(elem ORDER BY
    CASE
      WHEN (elem->>'tipo') LIKE '%Brilho%' THEN 0
      WHEN (elem->>'tipo') LIKE '%Fosco%'  THEN 1
      WHEN (elem->>'tipo') LIKE 'Offset%'  THEN 2
      WHEN (elem->>'tipo') LIKE 'Recicl%'  THEN 3
      WHEN (elem->>'tipo') LIKE 'Kraft%'   THEN 4
      WHEN (elem->>'tipo') LIKE 'Duplex%'  THEN 5
      ELSE 99
    END,
    (regexp_replace(elem->>'gramatura', '[^0-9.]', '', 'g')::numeric)
  )
  FROM jsonb_array_elements(
    materials || jsonb_build_array(
      jsonb_build_object(
        'tipo',      'Couch' || chr(234) || ' Brilho',
        'gramatura', '170g',
        'formato',   '66x96cm',
        'precoPorKg', 12.00,
        'fatorAbs',   1.0
      )
    )
  ) AS elem
)
WHERE materials::text LIKE '%Brilho%'
  AND materials::text NOT LIKE '%170g%';

COMMIT;
