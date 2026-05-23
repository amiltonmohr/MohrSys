// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PapelConfig {
  tipo: string;
  gramatura: string;
  formato: string;
  precoPorKg: number;
  fatorAbs: number;
}

export interface MaquinaConfig {
  nome: string;
  formato: string;
  custoHora: number;
  velocidade: number;
  pinca: number;
}

export interface AcabamentoConfig {
  nome: string;
  formula: 'laminacao' | 'verniz_total' | 'verniz_local' | 'corte_vinco' | 'por_mil' | 'fixo';
  valorM2?: number;
  valorMil?: number;
  setup?: number;
  faca?: number;
  valor?: number;
  percArea?: number;
}

export interface FormatoConfig {
  nome: string;
  w: number;
  h: number;
  div: string;
  obs?: string;
}

export interface AppConfig {
  papeis: PapelConfig[];
  chapaCusto: number;
  setupPorChapa: number;
  tintaCmyk: number;
  tintaCmykSg: number;
  tintaPantone: number;
  tintaPantoneSg: number;
  tintaUv: number;
  tintaUvSg: number;
  maquinas: MaquinaConfig[];
  acabamentos: AcabamentoConfig[];
  formatos: FormatoConfig[];
  imposto: number;
  ciAluguel: number;
  ciEnergia: number;
  ciManutencao: number;
  ciOutros: number;
  ciHoras: number;
  ciPorHora: number;
}

export interface AcabamentoParam {
  index: number;
  lados?: number;
  percArea?: number;
  setup?: number;
  valorMil?: number;
  faca?: number;
}

export interface PapelVia {
  id: string;
  label: string;
  tipo: string;
  gram: string;
}

export interface CalculatorInput {
  tipoAtivo: 'simples' | 'bloco' | 'revista';
  tiраgemInput: number;
  // bloco
  blocoFolhas: number;
  blocoVias: number;
  blocoChapaModo: 'unica' | 'por-via';
  blocoPapeis: PapelVia[];
  // revista
  revPaginas: number;
  revCapaPapel: string;
  revCapaGram: string;
  revCapaCoresF: number;
  revCapaCoresV: number;
  revCapaAcabamentos: AcabamentoParam[];
  // papel (simples / miolo)
  tipoPapel: string;
  gramPapel: string;
  // dimensões
  w: number;
  h: number;
  // formato de impressão selecionado
  formatoNome: string;
  // cores
  coresF: number;
  coresV: number;
  tiraNRetiraEnabled: boolean;
  grafismo: number;
  // máquina
  maquinaNome: string;
  // preços
  margemPct: number;
  urgPct: number;
  refugoPct: number;
  // acabamentos
  acabSelecionados: AcabamentoParam[];
}

export interface BreakdownItem {
  nome: string;
  val: number;
}

export interface FormatoResult {
  nome: string;
  w: number;
  h: number;
  div: string;
  enc: number;
  orientacao: string;
  colunas: number;
  custoPorPeca: number;
  pecasPorFolha66x96: number;
  aproveitamento: number;
  sobra: number;
}

export interface CalculatorResult {
  // totais
  subtotal: number;
  margem: number;
  total: number;
  unitario: number;
  unitarioLabel: string;
  adUrgencia: number;
  // detalhes de custo
  custoPapel: number;
  custoChapas: number;
  custoSetup: number;
  custoTinta: number;
  custoMaquina: number;
  custoIndireto: number;
  custoAcab: number;
  // operacionais
  tiragem: number;
  tiраgemInput: number;
  numBlocos: number;
  laminasPorExemplar: number;
  blocoFolhas: number;
  blocoVias: number;
  folhasBrutas: number;
  folhasPedido: number;
  folhasSetup: number;
  folhasCapa: number;
  resmas: number;
  numChapas: number;
  pecasPorFolha: number;
  unidadesPorFormato: number;
  consumoTintaKg: number;
  horasImpRaw: number;
  horasImpCobradas: number;
  descTiragem: string;
  descChapas: string;
  descPapelVias: string[];
  // configurações
  tipoPapel: string;
  gramPapel: string;
  coresF: number;
  coresV: number;
  w: number;
  h: number;
  grafismo: number;
  urgPct: number;
  margemPct: number;
  refugoPct: number;
  tiraNRetira: boolean;
  blocoAtivo: boolean;
  revistaAtivo: boolean;
  maqNome: string;
  maqVelocidade: number;
  maqFormato: string;
  formatoNome: string;
  formatoW: number;
  formatoH: number;
  formatoColunas: number;
  formatoLinhas: number;
  formatoOrientacao: string;
  acabSel: BreakdownItem[];
  coresF_capa: number;
  coresV_capa: number;
  papelCapaDesc: string;
  acabCapaNomes: string[];
  // composição do job (linhas)
  jobLines: { label: string; value: string }[];
  // formato-impressao options para o select
  formatosDisponiveis: FormatoResult[];
  // erros
  erro?: string;
}

// ─── Formatos Padrão 66×96 ────────────────────────────────────────────────────

const FORMATOS_PADRAO = [
  { nome: 'Inteiro',    w: 66,   h: 96,   div: '1'    },
  { nome: 'Formato 2',  w: 66,   h: 48,   div: '1/2'  },
  { nome: 'Formato 2B', w: 33,   h: 96,   div: '1/2'  },
  { nome: 'Formato 3',  w: 66,   h: 32,   div: '1/3'  },
  { nome: 'Formato 3B', w: 22,   h: 96,   div: '1/3'  },
  { nome: 'Formato 4',  w: 33,   h: 48,   div: '1/4'  },
  { nome: 'Formato 6',  w: 33,   h: 32,   div: '1/6'  },
  { nome: 'Formato 6B', w: 22,   h: 48,   div: '1/6'  },
  { nome: 'Formato 8',  w: 33,   h: 24,   div: '1/8'  },
  { nome: 'Formato 9',  w: 32,   h: 22,   div: '1/9'  },
  { nome: 'Formato 12', w: 22,   h: 24,   div: '1/12' },
  { nome: 'Formato 16', w: 24,   h: 16.5, div: '1/16' },
  { nome: 'Formato 18', w: 22,   h: 16,   div: '1/18' },
  { nome: 'Formato 32', w: 16.5, h: 12,   div: '1/32' },
];

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

export function calcMelhoresFormatos(
  pw: number, ph: number, pinca = 1.2, aberto = false, maqFormatoStr = '36x52cm',
  customFormatos?: FormatoConfig[]
): FormatoResult[] {
  const formatosSrc = (customFormatos && customFormatos.length > 0) ? customFormatos : FORMATOS_PADRAO;
  const maqParts = maqFormatoStr.toLowerCase().replace('cm', '').split('x').map(s => parseFloat(s.trim()));
  const maqW = maqParts[0] || 36, maqH = maqParts[1] || 52;
  let pw2 = pw, ph2 = ph;
  if (aberto) { pw2 = Math.max(pw, ph); ph2 = Math.min(pw, ph) * 2; }
  return formatosSrc
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
      const sobra = areaFolha - areaUtil;
      return { ...f, enc, orientacao, colunas, custoPorPeca, pecasPorFolha66x96, aproveitamento, sobra };
    })
    .filter((f): f is FormatoResult => f !== null)
    .sort((a, b) => a.custoPorPeca - b.custoPorPeca);
}

function calcPapelPreco(p: PapelConfig): number {
  const fmts = p.formato.toLowerCase().replace('cm', '').split('x').map(s => parseFloat(s.trim()));
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

// ─── Função principal de cálculo ─────────────────────────────────────────────

export function calcular(input: CalculatorInput, cfg: AppConfig): CalculatorResult {
  const {
    tipoAtivo, tiраgemInput, blocoFolhas, blocoVias, blocoChapaModo, blocoPapeis,
    revPaginas, revCapaPapel, revCapaGram, revCapaCoresF, revCapaCoresV, revCapaAcabamentos,
    tipoPapel, gramPapel, w, h, formatoNome, coresF, coresV, tiraNRetiraEnabled,
    grafismo, maquinaNome, margemPct, urgPct, refugoPct, acabSelecionados,
  } = input;

  const blocoAtivo = tipoAtivo === 'bloco';
  const revistaAtivo = tipoAtivo === 'revista';

  const papel = cfg.papeis.find(p => p.tipo === tipoPapel && p.gramatura === gramPapel) || cfg.papeis[0];
  const maquina = cfg.maquinas.find(m => m.nome === maquinaNome);
  if (!maquina) return { erro: 'Selecione uma máquina' } as CalculatorResult;
  if (!blocoAtivo && (!papel)) return { erro: 'Papel não encontrado' } as CalculatorResult;

  const pinca = maquina.pinca || 1.2;
  const isAberto = revistaAtivo;

  // Formatos disponíveis
  const formatosDisponiveis = calcMelhoresFormatos(w, h, pinca, isAberto, maquina.formato, cfg.formatos);
  const formatoSel = formatosDisponiveis.find(f => f.nome === formatoNome) || formatosDisponiveis[0];
  if (!formatoSel) return { erro: 'Nenhum formato compatível' } as CalculatorResult;

  const pecasPorFolha = formatoSel.enc;
  const unidadesPorFormato = Math.round((66 * 96) / (formatoSel.w * formatoSel.h));
  const M = pecasPorFolha;

  // Tiragem efetiva
  let tiragem: number, numBlocos = 0, laminasPorExemplar = 1, descTiragem: string;
  if (blocoAtivo) {
    numBlocos = tiраgemInput;
    tiragem = numBlocos * blocoFolhas * blocoVias;
    descTiragem = `${numBlocos.toLocaleString('pt-BR')} blocos × ${blocoFolhas} fls × ${blocoVias} ${blocoVias > 1 ? 'vias' : 'via'}`;
  } else if (revistaAtivo) {
    laminasPorExemplar = revPaginas > 0 ? Math.ceil(revPaginas / 4) : 1;
    tiragem = tiраgemInput * laminasPorExemplar;
    descTiragem = `${tiраgemInput.toLocaleString('pt-BR')} exemplares × ${laminasPorExemplar} lâm.`;
  } else {
    tiragem = tiраgemInput;
    descTiragem = tiragem.toLocaleString('pt-BR') + ' un.';
  }

  // Folhas
  const folhasPedido = Math.ceil(tiragem / unidadesPorFormato / M);
  const setupFolhasFormato = revistaAtivo ? 60 * laminasPorExemplar : 60;
  const folhasSetup = Math.ceil(setupFolhasFormato / unidadesPorFormato);
  const folhasBrutas = folhasPedido + folhasSetup;

  // Capa da revista
  let folhasCapa = 0, custoPapelCapa = 0, papelCapaDesc = '', papelCapaObj: PapelConfig | null = null;
  const coresF_capa = revistaAtivo ? revCapaCoresF : coresF;
  const coresV_capa = revistaAtivo ? revCapaCoresV : coresV;
  const tiраgemCapa = revistaAtivo && laminasPorExemplar > 0 ? Math.round(tiragem / laminasPorExemplar) : 0;
  if (revistaAtivo && laminasPorExemplar > 0) {
    folhasCapa = Math.ceil(tiраgemCapa / unidadesPorFormato / M) + Math.ceil(60 / unidadesPorFormato);
    papelCapaObj = cfg.papeis.find(p => p.tipo === revCapaPapel && p.gramatura === revCapaGram) || null;
    if (papelCapaObj) {
      custoPapelCapa = folhasCapa * calcPapelPreco(papelCapaObj);
      papelCapaDesc = `${revCapaPapel} ${revCapaGram}`;
    }
  }

  // Custo de papel
  const descPapelVias: string[] = [];
  let custoPapel = 0;
  if (blocoAtivo) {
    const papeisPorId: Record<string, PapelConfig | undefined> = {};
    blocoPapeis.forEach(pv => {
      papeisPorId[pv.id] = cfg.papeis.find(p => p.tipo === pv.tipo && p.gramatura === pv.gram);
    });
    if (blocoVias === 1) {
      const pCapa = papeisPorId['capa'];
      if (pCapa) {
        const folhasContra = Math.ceil(numBlocos / unidadesPorFormato / M);
        custoPapel += folhasContra * calcPapelPreco(pCapa);
        descPapelVias.push(`Contracapa: ${pCapa.tipo} ${pCapa.gramatura} (${folhasContra} fls)`);
      }
      const pVia1 = papeisPorId['via-1'];
      if (pVia1) {
        custoPapel += folhasBrutas * calcPapelPreco(pVia1);
        descPapelVias.push(`Via 1: ${pVia1.tipo} ${pVia1.gramatura} (${folhasBrutas} fls)`);
      }
    } else {
      const pCapa = papeisPorId['capa'];
      if (pCapa) {
        const folhasCapaTotal = Math.ceil(numBlocos * 2 / unidadesPorFormato / M);
        custoPapel += folhasCapaTotal * calcPapelPreco(pCapa);
        descPapelVias.push(`Capa/Contracapa: ${pCapa.tipo} ${pCapa.gramatura} (${folhasCapaTotal} fls)`);
      }
      const folhasPorVia = Math.ceil(folhasPedido / blocoVias) + folhasSetup;
      for (let i = 1; i <= blocoVias; i++) {
        const pv = papeisPorId[`via-${i}`];
        if (pv) {
          custoPapel += folhasPorVia * calcPapelPreco(pv);
          descPapelVias.push(`Via ${i}: ${pv.tipo} ${pv.gramatura} (${folhasPorVia} fls)`);
        }
      }
    }
    if (custoPapel === 0 && papel) {
      custoPapel = folhasBrutas * calcPapelPreco(papel);
    }
  } else {
    const pRef = papel || cfg.papeis[0];
    if (revistaAtivo && folhasCapa > 0 && custoPapelCapa > 0) {
      custoPapel = (folhasBrutas - folhasCapa) * calcPapelPreco(pRef) + custoPapelCapa;
      descPapelVias.push(`Miolo: ${tipoPapel} ${gramPapel} (${folhasBrutas - folhasCapa} fls)`);
      descPapelVias.push(`Capa: ${papelCapaDesc} (${folhasCapa} fls)`);
    } else {
      custoPapel = folhasBrutas * calcPapelPreco(pRef);
    }
  }

  // Tira/Retira
  const temVerso = coresV > 0;
  const colunasFormato = formatoSel.colunas || 1;
  const formatoPermiteTira = !blocoAtivo && !revistaAtivo && temVerso && pecasPorFolha >= 2 && colunasFormato % 2 === 0;
  const tiraNRetira = formatoPermiteTira && tiraNRetiraEnabled;

  // Chapas
  let numChapas = 0, descChapas = '';
  if (blocoAtivo && blocoVias > 1) {
    numChapas = (coresF + coresV) * (blocoChapaModo === 'por-via' ? blocoVias : 1);
    descChapas = blocoChapaModo === 'por-via'
      ? `${numChapas} chapas — ${coresF + coresV} cores × ${blocoVias} vias`
      : `${numChapas} chapas — mesma arte em todas as vias`;
  } else if (revistaAtivo) {
    if (folhasCapa > 0) {
      const laminasInt = Math.max(0, laminasPorExemplar - 1);
      const chapasInt = laminasInt > 0 ? (coresF + coresV) * laminasInt : 0;
      const chapasCapa = coresF_capa + coresV_capa;
      numChapas = chapasInt + chapasCapa;
      const detInt = laminasInt > 0 ? `miolo: ${chapasInt} ch.` : 'sem miolo';
      descChapas = `${numChapas} chapas — ${detInt} · capa: ${chapasCapa} ch.`;
    } else {
      const pares = Math.floor(laminasPorExemplar / 2);
      const impar = laminasPorExemplar % 2;
      numChapas = Math.max(coresF, coresV) * (pares * 2 + impar);
      descChapas = `${numChapas} chapas — ${pares} par(es) + ${impar} isolada`;
    }
  } else if (tiraNRetira) {
    numChapas = Math.max(coresF, coresV);
    descChapas = `${numChapas} chapas — tira/retira`;
  } else if (temVerso) {
    numChapas = coresF + coresV;
    descChapas = `${numChapas} chapas — ${coresF} frente + ${coresV} verso`;
  } else {
    numChapas = coresF;
    descChapas = `${numChapas} chapas — só frente`;
  }

  const custoChapas = numChapas * cfg.chapaCusto;
  const custoSetup = numChapas * (cfg.setupPorChapa || 12);

  // Tinta
  const areaM2 = (w / 100) * (h / 100);
  const BASE_TINTA_G_M2 = 1.3779;
  const sg = cfg.tintaCmykSg;
  let consumoTintaKg: number;
  if (revistaAtivo && folhasCapa > 0 && papelCapaObj) {
    const fAbsCapa = papelCapaObj.fatorAbs;
    const tintaCapa = areaM2 * pecasPorFolha * unidadesPorFormato * folhasCapa * grafismo * fAbsCapa * (coresF_capa + coresV_capa) * BASE_TINTA_G_M2 * sg / 1000;
    const tintaMiolo = areaM2 * pecasPorFolha * unidadesPorFormato * (folhasBrutas - folhasCapa) * grafismo * (papel?.fatorAbs || 1) * (coresF + coresV) * BASE_TINTA_G_M2 * sg / 1000;
    consumoTintaKg = tintaCapa + tintaMiolo;
  } else {
    consumoTintaKg = areaM2 * pecasPorFolha * unidadesPorFormato * folhasBrutas * grafismo * (papel?.fatorAbs || 1) * (coresF + coresV) * BASE_TINTA_G_M2 * sg / 1000;
  }
  const custoTinta = consumoTintaKg * cfg.tintaCmyk;

  // Máquina
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
  const custoIndireto = horasImpCobradas * (cfg.ciPorHora || 52.84);

  // Acabamentos
  const areaM2Formato = (formatoSel.w / 100) * (formatoSel.h / 100);
  const acabSel: BreakdownItem[] = [];
  let custoAcab = 0;

  acabSelecionados.forEach(sel => {
    const a = cfg.acabamentos[sel.index];
    if (!a) return;
    let val = 0;
    let nome = a.nome;
    const p = sel;
    if (a.formula === 'laminacao' || a.formula === 'verniz_total') {
      const lados = p.lados || 1;
      val = areaM2Formato * folhasBrutas * lados * (a.valorM2 || 0);
      nome = `${a.nome} (${lados} lado${lados > 1 ? 's' : ''})`;
    } else if (a.formula === 'verniz_local') {
      const perc = (p.percArea ?? a.percArea ?? 30) / 100;
      val = areaM2Formato * folhasBrutas * perc * (a.valorM2 || 0);
      nome = `${a.nome} (${Math.round(perc * 100)}% área)`;
    } else if (a.formula === 'corte_vinco') {
      const setup = p.setup ?? a.setup ?? 80;
      const milVal = p.valorMil ?? a.valorMil ?? 100;
      const faca = p.faca ?? a.faca ?? 0;
      const mils = Math.ceil(tiragem / 1000);
      val = setup + mils * milVal + faca;
      nome = `${a.nome} (setup + ${mils} mil.${faca > 0 ? ' + faca' : ''})`;
    } else if (a.formula === 'por_mil') {
      const mils = Math.ceil(tiragem / 1000);
      val = mils * (a.valorMil || 0);
      nome = `${a.nome} (${mils} mil.)`;
    } else if (a.formula === 'fixo') {
      val = a.valor || 0;
    }
    custoAcab += val;
    acabSel.push({ nome, val });
  });

  // Acabamentos da capa (revista)
  const acabCapaNomes: string[] = [];
  revCapaAcabamentos.forEach(sel => {
    const a = cfg.acabamentos[sel.index];
    if (!a) return;
    let val = 0;
    if (a.formula === 'laminacao' || a.formula === 'verniz_total') {
      val = areaM2Formato * tiраgemCapa * (sel.lados || 1) * (a.valorM2 || 0);
    } else if (a.formula === 'verniz_local') {
      val = areaM2Formato * tiраgemCapa * ((sel.percArea ?? a.percArea ?? 30) / 100) * (a.valorM2 || 0);
    } else if (a.formula === 'corte_vinco') {
      const mils = Math.ceil(tiраgemCapa / 1000);
      val = (sel.setup ?? a.setup ?? 80) + mils * (sel.valorMil ?? a.valorMil ?? 100) + (sel.faca ?? 0);
    }
    if (val > 0) { custoAcab += val; acabSel.push({ nome: `${a.nome} — capa`, val }); acabCapaNomes.push(a.nome); }
  });

  const subtotal = custoPapel + custoChapas + custoSetup + custoTinta + custoMaquina + custoIndireto + custoAcab;
  const adUrgencia = subtotal * (urgPct / 100);
  const baseUrg = subtotal + adUrgencia;
  const margem = baseUrg * (margemPct / 100);
  const total = baseUrg + margem;

  let unitario: number, unitarioLabel: string;
  if (blocoAtivo) { unitario = total / Math.max(1, numBlocos); unitarioLabel = 'Valor por Bloco'; }
  else if (revistaAtivo) { unitario = total / Math.max(1, tiраgemInput); unitarioLabel = 'Valor por Exemplar'; }
  else { unitario = total / Math.max(1, tiragem); unitarioLabel = 'Valor Unitário'; }

  // Linhas do Job
  const jL: { label: string; value: string }[] = [
    { label: 'Tipo de material', value: blocoAtivo ? 'Bloco' : revistaAtivo ? 'Revista' : 'Impressão simples' },
    { label: 'Papel', value: blocoAtivo ? (descPapelVias[0] || '—') : `${tipoPapel} ${gramPapel}` },
    { label: 'Formato fechado', value: `${w}×${h} cm` },
  ];
  if (revistaAtivo) jL.push({ label: 'Formato aberto (lâmina)', value: `${Math.max(w, h)}×${Math.min(w, h) * 2} cm` });
  jL.push({ label: 'Cores', value: `${coresF} frente / ${coresV} verso` });
  if (blocoAtivo) jL.push({ label: 'Bloco', value: `${blocoFolhas} fls × ${blocoVias} via${blocoVias > 1 ? 's' : ''}` });
  if (revistaAtivo) jL.push({ label: 'Páginas', value: `${revPaginas} págs — ${laminasPorExemplar} lâm./ex.` });
  jL.push({ label: 'Montagem', value: `M${M} — ${formatoSel.nome} (${formatoSel.w}×${formatoSel.h} cm)` });
  jL.push({ label: 'Folhas pedido 66×96', value: `${folhasPedido.toLocaleString('pt-BR')} (${tiragem} ÷ ${unidadesPorFormato} ÷ M${M})` });
  jL.push({ label: 'Folhas setup 66×96', value: `${folhasSetup.toLocaleString('pt-BR')} (60 fls${revistaAtivo ? ' × ' + laminasPorExemplar + ' lâm.' : ''} ÷ ${unidadesPorFormato})` });
  jL.push({ label: 'Total folhas 66×96', value: folhasBrutas.toLocaleString('pt-BR') });
  if (temVerso && !blocoAtivo && !revistaAtivo) jL.push({ label: 'Tira/Retira', value: tiraNRetira ? 'Sim' : 'Não' });
  jL.push({ label: 'Chapas', value: String(numChapas) });
  jL.push({ label: 'Tinta estimada', value: `${consumoTintaKg.toFixed(2)} kg` });
  jL.push({ label: 'Tempo de máquina', value: `${horasImpCobradas.toFixed(1)}h cobradas` });

  return {
    subtotal, margem, total, unitario, unitarioLabel, adUrgencia,
    custoPapel, custoChapas, custoSetup, custoTinta, custoMaquina, custoIndireto, custoAcab,
    tiragem, tiраgemInput, numBlocos, laminasPorExemplar, blocoFolhas, blocoVias,
    folhasBrutas, folhasPedido, folhasSetup, folhasCapa, resmas: folhasBrutas / 500,
    numChapas, pecasPorFolha, unidadesPorFormato, consumoTintaKg, horasImpRaw, horasImpCobradas,
    descTiragem, descChapas, descPapelVias,
    tipoPapel, gramPapel, coresF, coresV, w, h, grafismo, urgPct, margemPct, refugoPct,
    tiraNRetira, blocoAtivo, revistaAtivo, maqNome: maquinaNome,
    maqVelocidade: maquina.velocidade, maqFormato: maquina.formato,
    formatoNome: formatoSel.nome, formatoW: formatoSel.w, formatoH: formatoSel.h,
    formatoColunas: formatoSel.colunas, formatoLinhas: Math.round(formatoSel.enc / Math.max(1, formatoSel.colunas)),
    formatoOrientacao: formatoSel.orientacao,
    acabSel, coresF_capa, coresV_capa, papelCapaDesc, acabCapaNomes,
    jobLines: jL, formatosDisponiveis,
  };
}

// ─── Config padrão ───────────────────────────────────────────────────────────

export const configDefault: AppConfig = {
  papeis: [
    { tipo: 'Couchê',        gramatura: '90g',  formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê',        gramatura: '115g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê',        gramatura: '150g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê',        gramatura: '250g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê',        gramatura: '300g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê Fosco',  gramatura: '90g',  formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê Fosco',  gramatura: '115g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê Fosco',  gramatura: '150g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê Fosco',  gramatura: '250g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê Fosco',  gramatura: '300g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Offset',        gramatura: '56g',  formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset',        gramatura: '63g',  formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset',        gramatura: '75g',  formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset',        gramatura: '90g',  formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset',        gramatura: '120g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset',        gramatura: '150g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset',        gramatura: '180g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset',        gramatura: '240g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Reciclato',     gramatura: '75g',  formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Reciclato',     gramatura: '90g',  formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Kraft',         gramatura: '80g',  formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.4 },
    { tipo: 'Duplex',        gramatura: '250g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.4 },
    { tipo: 'AC Branco CF',  gramatura: '50g',  formato: '66x96cm', precoPorKg: 27.00, fatorAbs: 1.2 },
    { tipo: 'AC Amarelo CFB',gramatura: '50g',  formato: '66x96cm', precoPorKg: 29.00, fatorAbs: 1.2 },
    { tipo: 'AC Azul CFB',   gramatura: '50g',  formato: '66x96cm', precoPorKg: 29.00, fatorAbs: 1.2 },
    { tipo: 'AC Verde CFB',  gramatura: '50g',  formato: '66x96cm', precoPorKg: 29.00, fatorAbs: 1.2 },
    { tipo: 'AC Rosa CFB',   gramatura: '50g',  formato: '66x96cm', precoPorKg: 29.00, fatorAbs: 1.2 },
    { tipo: 'Adesivo Brilho',gramatura: '180g', formato: '66x96cm', precoPorKg: 23.00, fatorAbs: 1.0 },
  ],
  chapaCusto: 18,
  setupPorChapa: 12,
  tintaCmyk: 48, tintaCmykSg: 1.0,
  tintaPantone: 90, tintaPantoneSg: 1.2,
  tintaUv: 55, tintaUvSg: 1.1,
  maquinas: [
    { nome: 'GTO 52 (1 cor)',  formato: '36x52cm', custoHora: 90,  velocidade: 5000, pinca: 1.2 },
    { nome: 'GTO 52 (4 cores)',formato: '36x52cm', custoHora: 140, velocidade: 5000, pinca: 1.2 },
  ],
  acabamentos: [
    { nome: 'Laminação Fosca',      formula: 'laminacao',   valorM2: 1.80 },
    { nome: 'Laminação Brilho',     formula: 'laminacao',   valorM2: 1.80 },
    { nome: 'Verniz UV Total',      formula: 'verniz_total', valorM2: 2.90 },
    { nome: 'Verniz UV Localizado', formula: 'verniz_local', valorM2: 4.60, percArea: 30 },
    { nome: 'Corte e Vinco',        formula: 'corte_vinco',  setup: 80, valorMil: 100 },
    { nome: 'Dobra Simples',        formula: 'por_mil',     valorMil: 40 },
    { nome: 'Dobra Cruzada',        formula: 'por_mil',     valorMil: 40 },
    { nome: 'Grampeamento',         formula: 'por_mil',     valorMil: 90 },
    { nome: 'Picote',               formula: 'por_mil',     valorMil: 80 },
    { nome: 'Numeração',            formula: 'por_mil',     valorMil: 60 },
    { nome: 'Blocagem',             formula: 'por_mil',     valorMil: 50 },
    { nome: 'Relevo Seco',          formula: 'fixo',         valor: 350 },
  ],
  formatos: [
    { nome: 'Inteiro',    w: 66,   h: 96,   div: '1',    obs: 'folha inteira' },
    { nome: 'Formato 2',  w: 66,   h: 48,   div: '1/2',  obs: 'corte ao meio na altura' },
    { nome: 'Formato 2B', w: 33,   h: 96,   div: '1/2',  obs: 'corte ao meio na largura' },
    { nome: 'Formato 3',  w: 66,   h: 32,   div: '1/3',  obs: 'corte ao terço na altura' },
    { nome: 'Formato 3B', w: 22,   h: 96,   div: '1/3',  obs: 'corte ao terço na largura' },
    { nome: 'Formato 4',  w: 33,   h: 48,   div: '1/4',  obs: 'meio × meio' },
    { nome: 'Formato 6',  w: 33,   h: 32,   div: '1/6',  obs: 'meio × terço' },
    { nome: 'Formato 6B', w: 22,   h: 48,   div: '1/6',  obs: 'terço × meio' },
    { nome: 'Formato 8',  w: 33,   h: 24,   div: '1/8',  obs: 'meio × quarto' },
    { nome: 'Formato 9',  w: 32,   h: 22,   div: '1/9',  obs: 'terço × terço' },
    { nome: 'Formato 12', w: 22,   h: 24,   div: '1/12', obs: 'terço × quarto' },
    { nome: 'Formato 16', w: 24,   h: 16.5, div: '1/16', obs: 'quarto × quarto' },
    { nome: 'Formato 18', w: 22,   h: 16,   div: '1/18', obs: 'terço × sexto' },
    { nome: 'Formato 32', w: 16.5, h: 12,   div: '1/32', obs: 'quarto × oitavo' },
  ],
  imposto: 10,
  ciAluguel: 4500, ciEnergia: 2800, ciManutencao: 1200, ciOutros: 800, ciHoras: 176, ciPorHora: 52.84,
};

export const PRESETS = {
  simples: [
    { label: 'Folder 10×15',      w: 10,   h: 15,   desc: 'Folder 10x15cm' },
    { label: 'Folder 15×21',      w: 15,   h: 21,   desc: 'Folder 15x21cm' },
    { label: 'Folder A4 21×29,7', w: 21,   h: 29.7, desc: 'Folder A4' },
    { label: 'Folder A3 29,7×42', w: 29.7, h: 42,   desc: 'Folder A3' },
    { label: 'Timbrado A4',       w: 21,   h: 29.7, desc: 'Folha timbrada A4' },
  ],
  bloco: [
    { label: 'Bloco 10×15 50×1',  w: 10, h: 15,   blocoF: 50, blocoV: 1, desc: 'Bloco 50×1 10x15cm' },
    { label: 'Bloco 15×21 50×1',  w: 15, h: 21,   blocoF: 50, blocoV: 1, desc: 'Bloco 50×1 15x21cm' },
    { label: 'Bloco A4 50×1',     w: 21, h: 29.7, blocoF: 50, blocoV: 1, desc: 'Bloco 50×1 A4' },
  ],
  revista: [
    { label: 'Revista 8 págs A5', w: 21, h: 15, revPag: 8, desc: 'Revista 8 págs A5' },
  ],
};
