import { withTenantContext } from '../db/pool';
import {
  QuoteInput, QuoteResult, Quote, PaperType, Machine, Finishing,
  BreakdownItem, ComparisonQuantity, FinishingSpec, PaginatedResponse,
} from '../types';
import { TenantConfig } from '../types';
import { logger } from '../utils/logger';

// ─── FORMAT TABLE (66×96 sheet standards) ──────────────────────
const FORMATOS_PADRAO = [
  { nome: 'Inteiro',    w: 66,   h: 96,   div: '1' },
  { nome: 'Formato 2',  w: 66,   h: 48,   div: '1/2' },
  { nome: 'Formato 2B', w: 33,   h: 96,   div: '1/2' },
  { nome: 'Formato 3',  w: 66,   h: 32,   div: '1/3' },
  { nome: 'Formato 3B', w: 22,   h: 96,   div: '1/3' },
  { nome: 'Formato 4',  w: 33,   h: 48,   div: '1/4' },
  { nome: 'Formato 6',  w: 33,   h: 32,   div: '1/6' },
  { nome: 'Formato 6B', w: 22,   h: 48,   div: '1/6' },
  { nome: 'Formato 8',  w: 33,   h: 24,   div: '1/8' },
  { nome: 'Formato 9',  w: 32,   h: 22,   div: '1/9' },
  { nome: 'Formato 12', w: 22,   h: 24,   div: '1/12' },
  { nome: 'Formato 16', w: 24,   h: 16.5, div: '1/16' },
  { nome: 'Formato 18', w: 22,   h: 16,   div: '1/18' },
  { nome: 'Formato 32', w: 16.5, h: 12,   div: '1/32' },
];

interface FormatoResult {
  nome: string; w: number; h: number; div: string;
  enc: number; colunas: number; orientacao: string;
  custoPorPeca: number; pecasPorFolha66x96: number;
  aproveitamento: number;
}

function calcEncaixe(fw: number, fh: number, pw: number, ph: number, pinca: number) {
  const maior = Math.max(fw, fh);
  const menor = Math.min(fw, fh);
  const dimA = maior - pinca;
  const dimB = menor;
  const cols1 = Math.floor(dimB / ph);
  const enc1 = Math.floor(dimA / pw) * cols1;
  const cols2 = Math.floor(dimB / pw);
  const enc2 = Math.floor(dimA / ph) * cols2;
  const melhor = Math.max(enc1, enc2);
  const usaEnc1 = enc1 >= enc2;
  return { enc: melhor, orientacao: usaEnc1 ? 'normal' : 'girada', colunas: usaEnc1 ? cols1 : cols2 };
}

function calcMelhoresFormatos(
  pw: number, ph: number, pinca = 1.2, aberto = false, maqFormatoStr = '36x52cm'
): FormatoResult[] {
  const maqParts = maqFormatoStr.toLowerCase().replace('cm', '').split('x').map(Number);
  const maqW = maqParts[0] || 36, maqH = maqParts[1] || 52;

  let pw2 = pw, ph2 = ph;
  if (aberto) { pw2 = Math.max(pw, ph); ph2 = Math.min(pw, ph) * 2; }

  return FORMATOS_PADRAO
    .filter(f => (f.w <= maqW && f.h <= maqH) || (f.h <= maqW && f.w <= maqH))
    .map(f => {
      const { enc, orientacao, colunas } = calcEncaixe(f.w, f.h, pw2, ph2, pinca);
      if (enc === 0) return null;
      const unidadesPorFolha66x96 = Math.round((66 * 96) / (f.w * f.h));
      const pecasPorFolha66x96 = unidadesPorFolha66x96 * enc;
      const custoPorPeca = (66 * 96) / pecasPorFolha66x96;
      const areaUtil = enc * pw2 * ph2;
      const areaFolha = (f.w - pinca) * (f.h - pinca);
      const aproveitamento = (areaUtil / areaFolha) * 100;
      return { ...f, enc, orientacao, colunas, custoPorPeca, pecasPorFolha66x96, aproveitamento };
    })
    .filter((f): f is FormatoResult => f !== null)
    .sort((a, b) => a.custoPorPeca - b.custoPorPeca);
}

function calcPapelPreco(p: PaperType): number {
  const fmts = p.formato.toLowerCase().replace('cm', '').split('x').map(Number);
  const largM = (fmts[0] || 66) / 100, altM = (fmts[1] || 96) / 100;
  const areaM2 = largM * altM;
  const gram = parseFloat(p.gramatura) || 90;
  const pesoFolhaKg = (gram * areaM2) / 1000;
  return pesoFolhaKg * (p.precoPorKg || 12);
}

function calcHorasCobradas(horasRaw: number): number {
  if (horasRaw <= 1) return 1;
  const alem = horasRaw - 1;
  return 1 + Math.ceil(alem * 2) / 2;
}

export function calculateQuote(input: QuoteInput, config: TenantConfig): QuoteResult {
  const {
    product_type, width_cm: w, height_cm: h, quantity,
    colors_front: coresF, colors_back: coresV,
    grafismo, margin_pct: margemPct, urgency_pct: urgPct,
    machine_name: maqNome, finishing_specs,
    bloco_folhas, bloco_vias, bloco_chapa_modo,
    rev_paginas, rev_capa_papel, rev_capa_gram,
    rev_capa_cores_f, rev_capa_cores_v, rev_capa_finishing,
    tira_retira: tiraNRetiraEnabled = true,
    comparison_quantities = [],
  } = input;

  const blocoAtivo = product_type === 'bloco';
  const revistaAtivo = product_type === 'revista';

  const papel = config.materials.find(
    p => p.tipo === input.paper_type && p.gramatura === input.paper_gramatura
  ) || config.materials[0];

  const maquina = config.machines.find(m => m.nome === maqNome);
  if (!maquina) throw new Error(`Machine not found: ${maqNome}`);

  const pinca = maquina.pinca || 1.2;
  const melhores = calcMelhoresFormatos(w, h, pinca, revistaAtivo, maquina.formato);
  const formatoSel = melhores[0];
  if (!formatoSel) throw new Error(`No valid format found for ${w}×${h} cm on ${maquina.formato}`);

  const pecasPorFolha = formatoSel.enc;
  const unidadesPorFormato = Math.round((66 * 96) / (formatoSel.w * formatoSel.h));
  const M = pecasPorFolha;

  // ── Tiragem ──────────────────────────────────────────────────
  let tiragem: number, numBlocos = 0, laminasPorExemplar = 1, descTiragem: string;

  if (blocoAtivo) {
    numBlocos = quantity;
    const bF = bloco_folhas || 50;
    const bV = bloco_vias || 1;
    tiragem = numBlocos * bF * bV;
    descTiragem = `${numBlocos.toLocaleString('pt-BR')} blocos × ${bF} fls × ${bV} via${bV > 1 ? 's' : ''}`;
  } else if (revistaAtivo) {
    const paginas = rev_paginas || 8;
    laminasPorExemplar = Math.ceil(paginas / 4);
    tiragem = quantity * laminasPorExemplar;
    descTiragem = `${quantity.toLocaleString('pt-BR')} exemplares × ${laminasPorExemplar} lâm.`;
  } else {
    tiragem = quantity;
    descTiragem = `${tiragem.toLocaleString('pt-BR')} un.`;
  }

  // ── Paper sheets ─────────────────────────────────────────────
  const folhasPedido = Math.ceil(tiragem / unidadesPorFormato / M);
  const setupFolhasFormato = revistaAtivo ? 60 * laminasPorExemplar : 60;
  const folhasSetup = Math.ceil(setupFolhasFormato / unidadesPorFormato);
  const folhasBrutas = folhasPedido + folhasSetup;

  // ── Capa (revista) ───────────────────────────────────────────
  let folhasCapa = 0, custoPapelCapa = 0, papelCapaObj: PaperType | null = null;
  const coresF_capa = rev_capa_cores_f ?? 4;
  const coresV_capa = rev_capa_cores_v ?? 0;
  const tiраgemCapa = revistaAtivo ? Math.round(tiragem / laminasPorExemplar) : 0;

  if (revistaAtivo && laminasPorExemplar > 0) {
    folhasCapa = Math.ceil(tiраgemCapa / unidadesPorFormato / M) + Math.ceil(60 / unidadesPorFormato);
    papelCapaObj = config.materials.find(
      p => p.tipo === rev_capa_papel && p.gramatura === rev_capa_gram
    ) || null;
    if (papelCapaObj) {
      custoPapelCapa = folhasCapa * calcPapelPreco(papelCapaObj);
    }
  }

  // ── Paper cost ───────────────────────────────────────────────
  let custoPapel = 0;
  const descPapelVias: string[] = [];

  if (blocoAtivo) {
    // handled per-via below
    custoPapel = folhasBrutas * calcPapelPreco(papel);
    descPapelVias.push(`Via 1: ${papel.tipo} ${papel.gramatura}`);
  } else if (revistaAtivo && folhasCapa > 0 && custoPapelCapa > 0) {
    custoPapel = (folhasBrutas - folhasCapa) * calcPapelPreco(papel) + custoPapelCapa;
  } else {
    custoPapel = folhasBrutas * calcPapelPreco(papel);
  }

  // ── Plates (chapas) ──────────────────────────────────────────
  let numChapas: number;

  if (blocoAtivo && (bloco_vias || 1) > 1) {
    const modo = bloco_chapa_modo || 'unica';
    numChapas = (coresF + coresV) * (modo === 'por-via' ? (bloco_vias || 1) : 1);
  } else if (revistaAtivo) {
    const laminasInt = Math.max(0, laminasPorExemplar - 1);
    const chapasInt = laminasInt > 0 ? (coresF + coresV) * laminasInt : 0;
    const chapasCapa = coresF_capa + coresV_capa;
    numChapas = chapasInt + chapasCapa;
  } else {
    const temVerso = coresV > 0;
    const colunasFormato = formatoSel.colunas || 1;
    const formatoPermiteTira = temVerso && pecasPorFolha >= 2 && colunasFormato % 2 === 0;
    const tiraNRetira = formatoPermiteTira && tiraNRetiraEnabled;
    if (tiraNRetira) {
      numChapas = Math.max(coresF, coresV);
    } else if (temVerso) {
      numChapas = coresF + coresV;
    } else {
      numChapas = coresF;
    }
  }

  const custoChapas = numChapas * (config.chapa_cost_brl || 18);
  const custoSetup = numChapas * (config.setup_cost_per_chapa_brl || 12);

  // ── Ink consumption ──────────────────────────────────────────
  const areaM2 = (w / 100) * (h / 100);
  const BASE_TINTA_G_M2 = 1.3779;
  const sg = config.ink_cost_cmyk_per_ml > 0 ? 1.0 : 1.0; // SG default

  let consumoTintaKg: number;
  if (revistaAtivo && folhasCapa > 0) {
    const fAbsCapa = papelCapaObj?.fatorAbs || papel.fatorAbs;
    const tintaCapa = areaM2 * pecasPorFolha * unidadesPorFormato * folhasCapa *
      grafismo * fAbsCapa * (coresF_capa + coresV_capa) * BASE_TINTA_G_M2 * sg / 1000;
    const tintaMiolo = areaM2 * pecasPorFolha * unidadesPorFormato * (folhasBrutas - folhasCapa) *
      grafismo * papel.fatorAbs * (coresF + coresV) * BASE_TINTA_G_M2 * sg / 1000;
    consumoTintaKg = tintaCapa + tintaMiolo;
  } else {
    consumoTintaKg = areaM2 * pecasPorFolha * unidadesPorFormato * folhasBrutas *
      grafismo * papel.fatorAbs * (coresF + coresV) * BASE_TINTA_G_M2 * sg / 1000;
  }

  // tintaCmyk stored in config as price per kg (R$/kg)
  const tintaCmykPorKg = (config.ink_cost_cmyk_per_ml || 0.048) * 1000;
  const custoTinta = consumoTintaKg * tintaCmykPorKg;

  // ── Machine time ─────────────────────────────────────────────
  let horasImpRaw: number, horasImpCobradas: number;

  if (revistaAtivo && laminasPorExemplar > 1) {
    const folhasPorLamina = folhasBrutas / laminasPorExemplar;
    const horasPorLamina = (folhasPorLamina * unidadesPorFormato) / maquina.velocidade;
    const horasCobPorLamina = calcHorasCobradas(horasPorLamina);
    horasImpRaw = horasPorLamina * laminasPorExemplar;
    horasImpCobradas = horasCobPorLamina * laminasPorExemplar;
  } else {
    horasImpRaw = (folhasBrutas * unidadesPorFormato) / maquina.velocidade;
    horasImpCobradas = calcHorasCobradas(horasImpRaw);
  }

  const custoMaquina = horasImpCobradas * maquina.custoHora;
  const custoIndireto = horasImpCobradas * (config.labor_cost_per_hour_brl || 50);

  // ── Finishing costs ──────────────────────────────────────────
  const areaM2Formato = (formatoSel.w / 100) * (formatoSel.h / 100);
  let custoAcab = 0;
  const acabSel: BreakdownItem[] = [];

  const calcAcabamento = (spec: FinishingSpec, tiраgemRef: number, prefix = ''): number => {
    const acabConfig = config.finishing.find(f => f.nome === spec.nome);
    if (!acabConfig) return 0;

    let val = 0;
    const formula = spec.formula || acabConfig.formula;

    if (formula === 'laminacao' || formula === 'verniz_total') {
      const lados = spec.lados || 1;
      val = areaM2Formato * folhasBrutas * lados * (acabConfig.valorM2 || 0);
      acabSel.push({ nome: `${prefix}${spec.nome} (${lados} lado${lados > 1 ? 's' : ''})`, val });
    } else if (formula === 'verniz_local') {
      const perc = ((spec.percArea ?? acabConfig.percArea ?? 30)) / 100;
      val = areaM2Formato * folhasBrutas * perc * (acabConfig.valorM2 || 0);
      acabSel.push({ nome: `${prefix}${spec.nome} (${Math.round(perc * 100)}% área)`, val });
    } else if (formula === 'corte_vinco') {
      const setup = spec.setup ?? acabConfig.setup ?? 80;
      const milVal = spec.valorMil ?? acabConfig.valorMil ?? 100;
      const faca = spec.faca ?? 0;
      const mils = Math.ceil(tiраgemRef / 1000);
      val = setup + mils * milVal + faca;
      acabSel.push({ nome: `${prefix}${spec.nome} (setup + ${mils} mil.)`, val });
    } else if (formula === 'por_mil') {
      const mils = Math.ceil(tiраgemRef / 1000);
      val = mils * (acabConfig.valorMil || 0);
      acabSel.push({ nome: `${prefix}${spec.nome} (${mils} mil.)`, val });
    } else if (formula === 'fixo') {
      val = acabConfig.valor || 0;
      acabSel.push({ nome: `${prefix}${spec.nome}`, val });
    }
    return val;
  };

  for (const spec of finishing_specs) {
    custoAcab += calcAcabamento(spec, tiragem);
  }

  if (revistaAtivo && rev_capa_finishing && rev_capa_finishing.length > 0) {
    for (const spec of rev_capa_finishing) {
      custoAcab += calcAcabamento(spec, tiраgemCapa, 'Capa — ');
    }
  }

  // ── Totals ───────────────────────────────────────────────────
  const subtotal = custoPapel + custoChapas + custoSetup + custoTinta + custoMaquina + custoIndireto + custoAcab;
  const adUrgencia = subtotal * (urgPct / 100);
  const baseUrg = subtotal + adUrgencia;
  const margem = baseUrg * (margemPct / 100);
  const total = baseUrg + margem;

  let unitario: number;
  if (blocoAtivo) unitario = total / Math.max(1, numBlocos);
  else if (revistaAtivo) unitario = total / Math.max(1, quantity);
  else unitario = total / Math.max(1, tiragem);

  if (urgPct > 0) {
    acabSel.push({ nome: `Urgência (${urgPct}%)`, val: adUrgencia });
  }

  // ── Comparison quantities ────────────────────────────────────
  let comparisonData: ComparisonQuantity[] | undefined;
  if (comparison_quantities.length > 0) {
    comparisonData = comparison_quantities.map(qty => {
      const altInput = { ...input, quantity: qty, comparison_quantities: [] };
      try {
        const altResult = calculateQuote(altInput, config);
        return {
          tiраgemInput: qty,
          total: altResult.total,
          unitario: altResult.unitario,
          subtotal: altResult.subtotal,
        };
      } catch {
        return { tiраgemInput: qty, total: 0, unitario: 0, subtotal: 0 };
      }
    });
  }

  const tiraRetiraFinal = !blocoAtivo && !revistaAtivo && coresV > 0 &&
    pecasPorFolha >= 2 && (formatoSel.colunas || 1) % 2 === 0 && tiraNRetiraEnabled;

  return {
    tiragem, folhas_brutas: folhasBrutas, folhas_capa: folhasCapa,
    resmas: folhasBrutas / 500, num_chapas: numChapas, num_blocos: numBlocos,
    laminas_por_exemplar: laminasPorExemplar, pecas_por_folha: pecasPorFolha,
    consumo_tinta_kg: consumoTintaKg, horas_maquina: horasImpCobradas,
    custo_papel: custoPapel, custo_chapas: custoChapas, custo_setup: custoSetup,
    custo_tinta: custoTinta, custo_maquina: custoMaquina, custo_indireto: custoIndireto,
    custo_acabamentos: custoAcab, subtotal, margem, total, unitario,
    breakdown_items: acabSel, comparison_quantities: comparisonData,
    desc_tiragem: descTiragem, tira_retira: tiraRetiraFinal,
    formato_nome: formatoSel.nome, formato_w: formatoSel.w, formato_h: formatoSel.h,
  };
}

// ─── DB Operations ───────────────────────────────────────────
export class QuoteService {
  async create(tenantId: string, userId: string, input: QuoteInput, config: TenantConfig): Promise<Quote> {
    const result = calculateQuote(input, config);

    return withTenantContext(tenantId, userId, async (client) => {
      // Auto-generate reference number
      let refNumber = input.reference_number;
      if (!refNumber) {
        const { rows: maxRef } = await client.query<{ max: string }>(
          `SELECT MAX(reference_number) as max FROM quotes WHERE tenant_id = $1`,
          [tenantId]
        );
        const maxNum = parseInt((maxRef[0]?.max || '').replace(/\D/g, '') || '0');
        refNumber = String(maxNum + 1).padStart(5, '0');
      }

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 7);

      const { rows } = await client.query<Quote>(
        `INSERT INTO quotes (
          tenant_id, client_id, reference_number, description, product_type,
          paper_type, paper_gramatura, width_mm, height_mm, quantity,
          colors_front, colors_back, finishing_specs, num_sheets, num_plates,
          ink_per_color_ml, total_labor_hours, subtotal_brl, breakdown_items,
          total_brl, unit_price_brl, comparison_quantities, status, validity_days,
          valid_until, created_by, raw_entry
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
        RETURNING *`,
        [
          tenantId, input.client_id || null,
          refNumber, input.description || null,
          input.product_type, input.paper_type, input.paper_gramatura,
          input.width_cm * 10, input.height_cm * 10, input.quantity,
          input.colors_front, input.colors_back,
          JSON.stringify(input.finishing_specs),
          result.folhas_brutas, result.num_chapas,
          result.consumo_tinta_kg * 1000 / Math.max(1, input.colors_front + input.colors_back),
          result.horas_maquina,
          result.subtotal, JSON.stringify(result.breakdown_items),
          result.total, result.unitario,
          result.comparison_quantities ? JSON.stringify(result.comparison_quantities) : null,
          'draft', 7, validUntil, userId,
          input.raw_entry ? JSON.stringify(input.raw_entry) : null,
        ]
      );

      logger.info('Quote created', { tenantId, quoteId: rows[0].id, total: result.total });
      return rows[0];
    });
  }

  async findById(tenantId: string, userId: string, quoteId: string): Promise<Quote> {
    return withTenantContext(tenantId, userId, async (client) => {
      const { rows } = await client.query<Quote>(
        `SELECT q.*, c.name as client_name FROM quotes q
         LEFT JOIN clients c ON c.id = q.client_id
         WHERE q.id = $1 AND q.tenant_id = $2`,
        [quoteId, tenantId]
      );
      if (!rows[0]) {
        throw Object.assign(new Error('Quote not found'), { status: 404, code: 'NOT_FOUND' });
      }
      return rows[0];
    });
  }

  async list(
    tenantId: string, userId: string,
    { page = 1, limit = 20, status, search }: { page?: number; limit?: number; status?: string; search?: string }
  ): Promise<PaginatedResponse<Quote>> {
    return withTenantContext(tenantId, userId, async (client) => {
      const offset = (page - 1) * limit;
      const conditions: string[] = ['q.tenant_id = $1'];
      const params: unknown[] = [tenantId];
      let pIdx = 2;

      if (status) { conditions.push(`q.status = $${pIdx++}`); params.push(status); }
      if (search) {
        conditions.push(`(q.reference_number ILIKE $${pIdx} OR q.description ILIKE $${pIdx} OR c.name ILIKE $${pIdx})`);
        params.push(`%${search}%`); pIdx++;
      }

      const where = conditions.join(' AND ');
      const { rows: countRows } = await client.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM quotes q LEFT JOIN clients c ON c.id = q.client_id WHERE ${where}`,
        params
      );
      const total = parseInt(countRows[0].count);

      params.push(limit, offset);
      const { rows } = await client.query<Quote>(
        `SELECT q.*, c.name as client_name FROM quotes q
         LEFT JOIN clients c ON c.id = q.client_id
         WHERE ${where} ORDER BY q.created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
        params
      );

      return { items: rows, total, page, limit, pages: Math.ceil(total / limit) };
    });
  }

  async update(tenantId: string, userId: string, quoteId: string, updates: Partial<Quote> & { raw_entry?: unknown }): Promise<Quote> {
    return withTenantContext(tenantId, userId, async (client) => {
      const { rows } = await client.query<Quote>(
        `UPDATE quotes SET
           status = COALESCE($3, status),
           description = COALESCE($4, description),
           raw_entry = COALESCE($5, raw_entry),
           updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [quoteId, tenantId, updates.status, updates.description,
         updates.raw_entry ? JSON.stringify(updates.raw_entry) : null]
      );
      if (!rows[0]) {
        throw Object.assign(new Error('Quote not found'), { status: 404, code: 'NOT_FOUND' });
      }
      return rows[0];
    });
  }

  async archive(tenantId: string, userId: string, quoteId: string): Promise<void> {
    await withTenantContext(tenantId, userId, async (client) => {
      const { rowCount } = await client.query(
        `UPDATE quotes SET status = 'archived' WHERE id = $1 AND tenant_id = $2`,
        [quoteId, tenantId]
      );
      if (!rowCount) {
        throw Object.assign(new Error('Quote not found'), { status: 404, code: 'NOT_FOUND' });
      }
    });
  }
}
