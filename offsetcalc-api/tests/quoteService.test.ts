import { calculateQuote } from '../src/services/QuoteService';
import { QuoteInput, TenantConfig } from '../src/types';

const mockConfig: TenantConfig = {
  id: 'test-config',
  tenant_id: 'test-tenant',
  version: 1,
  status: 'active',
  materials: [
    { tipo: 'Couchê', gramatura: '115g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Offset', gramatura: '75g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
  ],
  machines: [
    { nome: 'GTO 52 (4 cores)', formato: '36x52cm', custoHora: 140, velocidade: 5000, pinca: 1.2 },
  ],
  finishing: [
    { nome: 'Laminação Fosca', formula: 'laminacao', valorM2: 1.80 },
    { nome: 'Dobra Simples', formula: 'por_mil', valorMil: 40 },
    { nome: 'Corte e Vinco', formula: 'corte_vinco', setup: 80, valorMil: 100 },
    { nome: 'Relevo Seco', formula: 'fixo', valor: 350 },
  ],
  formatos: [],
  chapa_cost_brl: 18.00,
  ink_cost_cmyk_per_ml: 0.048,
  ink_cost_pantone_per_ml: 0.090,
  labor_cost_per_hour_brl: 50.00,
  setup_cost_per_chapa_brl: 12.00,
  overhead_pct: 35.00,
  margin_pct: 30.00,
  imposto_pct: 0,
  ci_aluguel_brl: 0,
  ci_energia_brl: 0,
  ci_manutencao_brl: 0,
  ci_outros_brl: 0,
  ci_horas_mes: 176,
  tinta_cmyk_sg: 1.0,
  tinta_uv_per_ml: 0.090,
  tinta_uv_sg: 1.0,
  tinta_pantone_sg: 1.0,
  created_at: new Date(),
  updated_at: new Date(),
};

const baseInput: QuoteInput = {
  product_type: 'simples',
  paper_type: 'Couchê',
  paper_gramatura: '115g',
  width_cm: 15,
  height_cm: 21,
  quantity: 1000,
  colors_front: 4,
  colors_back: 4,
  grafismo: 0.7,
  margin_pct: 30,
  urgency_pct: 0,
  machine_name: 'GTO 52 (4 cores)',
  finishing_specs: [],
  comparison_quantities: [],
  tira_retira: true,
};

describe('QuoteService.calculateQuote', () => {
  test('calculates a basic 4×4 folder quote', () => {
    const result = calculateQuote(baseInput, mockConfig);
    expect(result.total).toBeGreaterThan(0);
    expect(result.subtotal).toBeGreaterThan(0);
    expect(result.unitario).toBeGreaterThan(0);
    expect(result.unitario).toBeLessThan(result.total);
    expect(result.num_chapas).toBeGreaterThan(0);
    expect(result.folhas_brutas).toBeGreaterThan(0);
  });

  test('total = subtotal + margem', () => {
    const result = calculateQuote(baseInput, mockConfig);
    expect(result.total).toBeCloseTo(result.subtotal + result.margem, 2);
  });

  test('margin calculation is correct', () => {
    const result = calculateQuote(baseInput, mockConfig);
    // subtotal + urgency (0%) → baseUrg = subtotal, margem = subtotal * 30%
    expect(result.margem).toBeCloseTo(result.subtotal * 0.3, 1);
  });

  test('tira/retira uses max(front, back) plates for symmetric color count', () => {
    // 10×8cm results in Formato 4 with even columns (4 pieces, normal orientation)
    const input = { ...baseInput, width_cm: 10, height_cm: 8, colors_front: 4, colors_back: 4 };
    const result = calculateQuote(input, mockConfig);
    // With tira/retira enabled: chapas = max(4,4) = 4
    expect(result.num_chapas).toBe(4);
    expect(result.tira_retira).toBe(true);
  });

  test('no tira/retira when no back colors', () => {
    const input = { ...baseInput, colors_back: 0 };
    const result = calculateQuote(input, mockConfig);
    expect(result.tira_retira).toBe(false);
    expect(result.num_chapas).toBe(4); // only front
  });

  test('front+back plates when tira/retira disabled', () => {
    const input = { ...baseInput, tira_retira: false };
    const result = calculateQuote(input, mockConfig);
    expect(result.tira_retira).toBe(false);
    expect(result.num_chapas).toBe(8); // 4 + 4
  });

  test('bloco product type', () => {
    const input: QuoteInput = {
      ...baseInput,
      product_type: 'bloco',
      paper_type: 'Offset',
      paper_gramatura: '75g',
      width_cm: 15, height_cm: 21,
      quantity: 500, // 500 blocos
      colors_front: 1, colors_back: 0,
      bloco_folhas: 50, bloco_vias: 1,
    };
    const result = calculateQuote(input, mockConfig);
    expect(result.num_blocos).toBe(500);
    expect(result.tiragem).toBe(500 * 50 * 1);
    expect(result.total).toBeGreaterThan(0);
  });

  test('revista product type', () => {
    const input: QuoteInput = {
      ...baseInput,
      product_type: 'revista',
      width_cm: 21, height_cm: 15,
      quantity: 1000,
      colors_front: 4, colors_back: 4,
      rev_paginas: 16,
      rev_capa_papel: 'Couchê',
      rev_capa_gram: '115g',
    };
    const result = calculateQuote(input, mockConfig);
    expect(result.laminas_por_exemplar).toBe(4); // 16 pages ÷ 4 pages/sheet
    expect(result.tiragem).toBe(1000 * 4); // exemplares × lâminas
    expect(result.total).toBeGreaterThan(0);
  });

  test('urgency adds to cost', () => {
    const noUrg = calculateQuote({ ...baseInput, urgency_pct: 0 }, mockConfig);
    const withUrg = calculateQuote({ ...baseInput, urgency_pct: 20 }, mockConfig);
    expect(withUrg.total).toBeGreaterThan(noUrg.total);
  });

  test('higher margin means higher total', () => {
    const low = calculateQuote({ ...baseInput, margin_pct: 20 }, mockConfig);
    const high = calculateQuote({ ...baseInput, margin_pct: 50 }, mockConfig);
    expect(high.total).toBeGreaterThan(low.total);
  });

  test('comparison_quantities returns results for each qty', () => {
    const input = { ...baseInput, comparison_quantities: [500, 2000, 5000] };
    const result = calculateQuote(input, mockConfig);
    expect(result.comparison_quantities).toHaveLength(3);
    result.comparison_quantities!.forEach(c => {
      expect(c.total).toBeGreaterThan(0);
      expect(c.unitario).toBeGreaterThan(0);
    });
  });

  test('larger quantity has lower unit price', () => {
    const small = calculateQuote({ ...baseInput, quantity: 500 }, mockConfig);
    const large = calculateQuote({ ...baseInput, quantity: 10000 }, mockConfig);
    expect(large.unitario).toBeLessThan(small.unitario);
  });

  test('throws when machine not found', () => {
    const input = { ...baseInput, machine_name: 'Non-Existent Machine' };
    expect(() => calculateQuote(input, mockConfig)).toThrow('Machine not found');
  });
});
