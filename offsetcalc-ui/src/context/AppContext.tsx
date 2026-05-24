import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppConfig, configDefault, AcabamentoParam } from '../utils/calculator';
import { api } from '../services/api';

// ─── Tipos frontend ──────────────────────────────────────────────────────────

export interface Cliente {
  id: string;
  nome: string;
  tipo?: 'pf' | 'pj';
  doc?: string;
  tel: string;
  email?: string;
  cep?: string;
  uf?: string;
  rua?: string;
  num?: string;
  bairro?: string;
  cidade?: string;
  obs?: string;
  ts: number;
}

export interface OrcamentoEntry {
  id: string;
  ref: string;
  cliente: string;
  desc: string;
  data: string;
  ts: number;
  aprovado: boolean;
  [key: string]: unknown;
}

interface AppContextValue {
  config: AppConfig;
  setConfig: (cfg: AppConfig) => void;
  salvarConfig: (cfg: AppConfig) => Promise<void>;
  resetConfig: () => void;
  clientes: Cliente[];
  addCliente: (c: Omit<Cliente, 'id' | 'ts'>) => void;
  editCliente: (id: string, c: Partial<Omit<Cliente, 'id' | 'ts'>>) => void;
  removeCliente: (id: string) => void;
  historico: OrcamentoEntry[];
  addOrcamento: (entry: Omit<OrcamentoEntry, 'id' | 'ts' | 'aprovado'>) => void;
  updateOrcamento: (id: string, entry: Partial<OrcamentoEntry>) => void;
  removeOrcamento: (id: string) => void;
  toggleAprovado: (id: string) => void;
  toast: (msg: string) => void;
  toastMsg: string;
  loading: boolean;
}

// ─── Converters: Cliente ↔ API ───────────────────────────────────────────────

interface ApiClientBody {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

interface ApiClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

function clienteToApi(c: Omit<Cliente, 'id' | 'ts'>): ApiClientBody {
  const addr = [c.rua, c.num].filter(Boolean).join(', ');
  return {
    name: c.nome,
    email: c.email || null,
    phone: c.tel || null,
    address: addr || null,
    city: c.cidade || null,
    state: c.uf || null,
    zip_code: c.cep || null,
    country: 'Brasil',
    notes: c.obs || null,
    metadata: { tipo: c.tipo || 'pf', doc: c.doc || null, bairro: c.bairro || null, num: c.num || null },
  };
}

function apiToCliente(c: ApiClient): Cliente {
  const meta = (c.metadata || {}) as Record<string, string>;
  const addrParts = (c.address || '').split(', ');
  const num = meta.num || (addrParts.length > 1 ? addrParts[addrParts.length - 1] : '');
  const rua = meta.num
    ? (c.address || '').replace(new RegExp(',\\s*' + meta.num + '$'), '')
    : (addrParts.length > 1 ? addrParts.slice(0, -1).join(', ') : c.address || '');
  return {
    id: c.id,
    nome: c.name,
    tipo: (meta.tipo as 'pf' | 'pj') || 'pf',
    doc: meta.doc || '',
    tel: c.phone || '',
    email: c.email || '',
    cep: c.zip_code || '',
    uf: c.state || '',
    rua,
    num,
    bairro: meta.bairro || '',
    cidade: c.city || '',
    obs: c.notes || '',
    ts: new Date(c.created_at).getTime(),
  };
}

// ─── Converters: OrcamentoEntry ↔ Quote API ──────────────────────────────────

interface ApiQuote {
  id: string;
  reference_number: string;
  client_name?: string;
  description?: string;
  product_type: string;
  paper_type: string;
  paper_gramatura: string;
  quantity: number;
  colors_front: number;
  colors_back: number;
  total_brl: number;
  unit_price_brl: number;
  subtotal_brl: number;
  status: string;
  prazo?: string;
  raw_entry?: Record<string, unknown> | null;
  created_at: string;
}

function apiToOrcamento(q: ApiQuote): OrcamentoEntry {
  // Prefere raw_entry (snapshot completo do frontend) quando disponível
  if (q.raw_entry && q.raw_entry.ref) {
    return {
      ...(q.raw_entry as Record<string, unknown>),
      id: q.id,
      aprovado: q.status === 'accepted',
    } as OrcamentoEntry;
  }
  // Fallback: monta a partir das colunas estruturadas
  return {
    id: q.id,
    ref: q.reference_number,
    cliente: q.client_name || '',
    desc: q.description || '',
    data: q.created_at.slice(0, 10),
    ts: new Date(q.created_at).getTime(),
    aprovado: q.status === 'accepted',
    tipoAtivo: q.product_type,
    tipoPapel: q.paper_type,
    gramPapel: q.paper_gramatura,
    qty: q.quantity,
    coresF: q.colors_front,
    coresV: q.colors_back,
    total: q.total_brl,
    unitario: q.unit_price_brl,
    subtotal: q.subtotal_brl,
    prazo: q.prazo || '',
  };
}

function orcamentoToApiInput(
  entry: Omit<OrcamentoEntry, 'id' | 'ts' | 'aprovado'>,
  config: AppConfig,
): Record<string, unknown> {
  const tipoAtivo = (entry.tipoAtivo as string) || 'simples';
  const acabSelecionados = (entry.acabSelecionados as AcabamentoParam[]) || [];

  // Resolve finishing_specs a partir dos índices de acabamentos
  const finishing_specs = acabSelecionados.map(a => {
    const acab = config.acabamentos[a.index];
    if (!acab) return null;
    return {
      nome: acab.nome,
      formula: acab.formula,
      lados: a.lados,
      percArea: a.percArea,
      setup: a.setup,
      valorMil: a.valorMil,
      faca: a.faca,
    };
  }).filter(Boolean);

  // Para bloco, usa o papel da primeira via como paper_type principal
  let paperType = (entry.tipoPapel as string) || '';
  let paperGram = (entry.gramPapel as string) || '';
  if (tipoAtivo === 'bloco' && Array.isArray(entry.blocoPapeis)) {
    const firstVia = (entry.blocoPapeis as { id: string; tipo: string; gram: string }[])
      .find(p => p.id?.startsWith('via-'));
    if (firstVia?.tipo) { paperType = firstVia.tipo; paperGram = firstVia.gram || paperGram; }
  }

  return {
    product_type: tipoAtivo,
    reference_number: entry.ref || undefined,
    client_name: (entry.cliente as string) || undefined,
    description: (entry.desc as string) || undefined,
    paper_type: paperType || 'Couchê',
    paper_gramatura: paperGram || '90g',
    width_cm: (entry.w as number) || 21,
    height_cm: (entry.h as number) || 29.7,
    quantity: (entry.qty as number) || 1000,
    colors_front: (entry.coresF as number) ?? 4,
    colors_back: (entry.coresV as number) ?? 0,
    grafismo: (entry.grafismo as number) || 0.7,
    margin_pct: (entry.margemPct as number) ?? 30,
    urgency_pct: (entry.urgPct as number) ?? 0,
    machine_name: (entry.maquinaNome as string) || (config.maquinas[0]?.nome || ''),
    finishing_specs,
    bloco_folhas: tipoAtivo === 'bloco' ? ((entry.blocoFolhas as number) || 50) : undefined,
    bloco_vias: tipoAtivo === 'bloco' ? ((entry.blocoVias as number) || 1) : undefined,
    bloco_chapa_modo: tipoAtivo === 'bloco' ? ((entry.blocoChapaModo as string) || 'unica') : undefined,
    rev_paginas: tipoAtivo === 'revista' ? ((entry.revPaginas as number) || 16) : undefined,
    rev_capa_papel: tipoAtivo === 'revista' ? ((entry.revCapaPapel as string) || '') : undefined,
    rev_capa_gram: tipoAtivo === 'revista' ? ((entry.revCapaGram as string) || '') : undefined,
    rev_capa_cores_f: tipoAtivo === 'revista' ? ((entry.revCapaCoresF as number) ?? 4) : undefined,
    rev_capa_cores_v: tipoAtivo === 'revista' ? ((entry.revCapaCoresV as number) ?? 0) : undefined,
    tira_retira: !!(entry.tiraNRetiraEnabled),
    comparison_quantities: (entry.tiragensExtras as number[]) || [],
    raw_entry: { ...entry },
  };
}

// ─── Converters: AppConfig ↔ TenantConfig API ────────────────────────────────

interface ApiTenantConfig {
  materials?: unknown[];
  machines?: unknown[];
  finishing?: unknown[];
  formatos?: unknown[];
  chapa_cost_brl?: number;
  ink_cost_cmyk_per_ml?: number;
  ink_cost_pantone_per_ml?: number;
  setup_cost_per_chapa_brl?: number;
  labor_cost_per_hour_brl?: number;
  imposto_pct?: number;
  ci_aluguel_brl?: number;
  ci_energia_brl?: number;
  ci_manutencao_brl?: number;
  ci_outros_brl?: number;
  ci_horas_mes?: number;
  tinta_cmyk_sg?: number;
  tinta_uv_per_ml?: number;
  tinta_uv_sg?: number;
  tinta_pantone_sg?: number;
}

function apiToAppConfig(tc: ApiTenantConfig, fallback: AppConfig): AppConfig {
  const papeis = (tc.materials as AppConfig['papeis'] | undefined) || fallback.papeis;
  const savedPapeis = papeis.map(pd => {
    const ex = fallback.papeis.find(p => p.tipo === pd.tipo && p.gramatura === pd.gramatura);
    return ex || pd;
  });
  const custom = papeis.filter(p => !fallback.papeis.find(pd => pd.tipo === p.tipo && pd.gramatura === p.gramatura));

  const ciAluguel  = tc.ci_aluguel_brl   ?? fallback.ciAluguel;
  const ciEnergia  = tc.ci_energia_brl   ?? fallback.ciEnergia;
  const ciManut    = tc.ci_manutencao_brl?? fallback.ciManutencao;
  const ciOutros   = tc.ci_outros_brl    ?? fallback.ciOutros;
  const ciHoras    = tc.ci_horas_mes     ?? fallback.ciHoras;
  const ciTotal    = ciAluguel + ciEnergia + ciManut + ciOutros;
  const ciPorHora  = ciHoras > 0 ? parseFloat((ciTotal / ciHoras).toFixed(2)) : 0;

  return {
    ...fallback,
    papeis: [...savedPapeis, ...custom],
    maquinas:     (tc.machines   as AppConfig['maquinas'])   || fallback.maquinas,
    acabamentos:  (tc.finishing  as AppConfig['acabamentos']) || fallback.acabamentos,
    formatos:     (tc.formatos   as AppConfig['formatos'])    || fallback.formatos,
    chapaCusto:          tc.chapa_cost_brl            ?? fallback.chapaCusto,
    setupPorChapa:       tc.setup_cost_per_chapa_brl  ?? fallback.setupPorChapa,
    tintaCmyk:           tc.ink_cost_cmyk_per_ml      ?? fallback.tintaCmyk,
    tintaCmykSg:         tc.tinta_cmyk_sg             ?? fallback.tintaCmykSg,
    tintaPantone:        tc.ink_cost_pantone_per_ml   ?? fallback.tintaPantone,
    tintaPantoneSg:      tc.tinta_pantone_sg          ?? fallback.tintaPantoneSg,
    tintaUv:             tc.tinta_uv_per_ml           ?? fallback.tintaUv,
    tintaUvSg:           tc.tinta_uv_sg               ?? fallback.tintaUvSg,
    imposto:             tc.imposto_pct               ?? fallback.imposto,
    ciAluguel, ciEnergia, ciManutencao: ciManut, ciOutros, ciHoras, ciPorHora,
  };
}

function appConfigToApi(cfg: AppConfig): ApiTenantConfig {
  return {
    materials:              cfg.papeis,
    machines:               cfg.maquinas,
    finishing:              cfg.acabamentos,
    formatos:               cfg.formatos,
    chapa_cost_brl:         cfg.chapaCusto,
    ink_cost_cmyk_per_ml:   cfg.tintaCmyk,
    ink_cost_pantone_per_ml:cfg.tintaPantone,
    setup_cost_per_chapa_brl: cfg.setupPorChapa,
    labor_cost_per_hour_brl:  cfg.ciPorHora,
    imposto_pct:            cfg.imposto,
    ci_aluguel_brl:         cfg.ciAluguel,
    ci_energia_brl:         cfg.ciEnergia,
    ci_manutencao_brl:      cfg.ciManutencao,
    ci_outros_brl:          cfg.ciOutros,
    ci_horas_mes:           cfg.ciHoras,
    tinta_cmyk_sg:          cfg.tintaCmykSg,
    tinta_uv_per_ml:        cfg.tintaUv,
    tinta_uv_sg:            cfg.tintaUvSg,
    tinta_pantone_sg:       cfg.tintaPantoneSg,
  };
}

// ─── LocalStorage fallback (apenas para config enquanto não autenticado) ──────

const LS_CFG = 'mohrsys_config_v2';
function loadLS<T>(key: string, fallback: T): T {
  try { const d = localStorage.getItem(key); return d ? (JSON.parse(d) as T) : fallback; }
  catch { return fallback; }
}
function saveLS<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AppConfig>(() => {
    const saved = loadLS<AppConfig | null>(LS_CFG, null);
    if (!saved) return { ...configDefault };
    const papeisMerged = configDefault.papeis.map(pd => {
      const ex = saved.papeis?.find(p => p.tipo === pd.tipo && p.gramatura === pd.gramatura);
      return ex || pd;
    });
    const custom = (saved.papeis || []).filter(p => !configDefault.papeis.find(pd => pd.tipo === p.tipo && pd.gramatura === p.gramatura));
    return {
      ...configDefault, ...saved,
      papeis: [...papeisMerged, ...custom],
      formatos: saved.formatos?.length ? saved.formatos : configDefault.formatos,
      imposto: saved.imposto ?? configDefault.imposto,
    };
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [historico, setHistorico] = useState<OrcamentoEntry[]>([]);
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }, []);

  // ── Bootstrap: carrega dados da API ao iniciar ────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setLoading(true);

    Promise.all([
      api.get('/config').catch(() => null),
      api.get('/clients?limit=500').catch(() => null),
      api.get('/quotes?limit=500').catch(() => null),
    ]).then(([cfgRes, cliRes, quotRes]) => {
      if (cfgRes?.data?.data) {
        const apiCfg = cfgRes.data.data as ApiTenantConfig;
        const merged = apiToAppConfig(apiCfg, configDefault);
        setConfigState(merged);
        saveLS(LS_CFG, merged);
      }
      if (cliRes?.data?.data?.items) {
        setClientes((cliRes.data.data.items as ApiClient[]).map(apiToCliente));
      }
      if (quotRes?.data?.data?.items) {
        setHistorico((quotRes.data.data.items as ApiQuote[]).map(apiToOrcamento)
          .sort((a, b) => b.ts - a.ts));
      }
    }).finally(() => setLoading(false));
  }, []);

  // ── Config ────────────────────────────────────────────────────────────────
  const setConfig = useCallback((cfg: AppConfig) => {
    setConfigState(cfg);
    saveLS(LS_CFG, cfg);
  }, []);

  const salvarConfig = useCallback(async (cfg: AppConfig) => {
    setConfig(cfg);
    try {
      await api.put('/config', appConfigToApi(cfg));
    } catch {
      toast('Erro ao salvar config no servidor');
    }
  }, [setConfig, toast]);

  const resetConfig = useCallback(() => setConfig({ ...configDefault }), [setConfig]);

  // ── Clientes ──────────────────────────────────────────────────────────────
  const addCliente = useCallback((c: Omit<Cliente, 'id' | 'ts'>) => {
    const tempId = `temp_${Date.now()}`;
    const optimistic: Cliente = { ...c, id: tempId, ts: Date.now() };
    setClientes(prev => [optimistic, ...prev]);

    api.post('/clients', clienteToApi(c))
      .then(res => {
        const saved = apiToCliente(res.data.data as ApiClient);
        setClientes(prev => prev.map(cl => cl.id === tempId ? saved : cl));
      })
      .catch(() => {
        setClientes(prev => prev.filter(cl => cl.id !== tempId));
        toast('Erro ao salvar cliente. Tente novamente.');
      });
  }, [toast]);

  const editCliente = useCallback((id: string, c: Partial<Omit<Cliente, 'id' | 'ts'>>) => {
    setClientes(prev => prev.map(cl => cl.id === id ? { ...cl, ...c } : cl));

    setClientes(prev => {
      const full = prev.find(cl => cl.id === id);
      if (!full) return prev;
      api.put(`/clients/${id}`, clienteToApi({ ...full, ...c }))
        .catch(() => toast('Erro ao atualizar cliente.'));
      return prev;
    });
  }, [toast]);

  const removeCliente = useCallback((id: string) => {
    setClientes(prev => {
      const backup = prev;
      api.delete(`/clients/${id}`)
        .catch(() => {
          setClientes(backup);
          toast('Erro ao remover cliente.');
        });
      return prev.filter(cl => cl.id !== id);
    });
  }, [toast]);

  // ── Orçamentos ────────────────────────────────────────────────────────────
  const addOrcamento = useCallback((entry: Omit<OrcamentoEntry, 'id' | 'ts' | 'aprovado'>) => {
    const tempId = `temp_${Date.now()}`;
    const full: OrcamentoEntry = {
      ref: '', cliente: '', desc: '', data: new Date().toISOString().slice(0, 10),
      ...entry, id: tempId, ts: Date.now(), aprovado: false,
    };
    setHistorico(prev => [full, ...prev]);

    const apiInput = orcamentoToApiInput(entry, config);
    api.post('/quotes', apiInput)
      .then(res => {
        const saved = apiToOrcamento(res.data.data as ApiQuote);
        setHistorico(prev => prev.map(h => h.id === tempId ? saved : h));
      })
      .catch(() => {
        setHistorico(prev => prev.filter(h => h.id !== tempId));
        toast('Erro ao salvar orçamento.');
      });
  }, [config, toast]);

  const updateOrcamento = useCallback((id: string, entry: Partial<OrcamentoEntry>) => {
    setHistorico(prev => prev.map(h => h.id === id ? { ...h, ...entry } : h));

    const isTemp = id.startsWith('temp_');
    if (!isTemp) {
        api.put(`/quotes/${id}`, {
        description: entry.desc,
        raw_entry: { ...entry },
        status: entry.aprovado !== undefined
          ? (entry.aprovado ? 'accepted' : 'draft')
          : undefined,
      }).catch(() => toast('Erro ao atualizar orçamento.'));
    }
  }, [config, toast]);

  const removeOrcamento = useCallback((id: string) => {
    setHistorico(prev => {
      const backup = prev;
      if (!id.startsWith('temp_')) {
        api.delete(`/quotes/${id}`)
          .catch(() => {
            setHistorico(backup);
            toast('Erro ao remover orçamento.');
          });
      }
      return prev.filter(h => h.id !== id);
    });
  }, [toast]);

  const toggleAprovado = useCallback((id: string) => {
    setHistorico(prev => {
      const entry = prev.find(h => h.id === id);
      if (!entry) return prev;
      const newStatus = !entry.aprovado;
      if (!id.startsWith('temp_')) {
        api.put(`/quotes/${id}`, { status: newStatus ? 'accepted' : 'draft' })
          .catch(() => toast('Erro ao atualizar status.'));
      }
      return prev.map(h => h.id === id ? { ...h, aprovado: newStatus } : h);
    });
  }, [toast]);

  return (
    <AppContext.Provider value={{
      config, setConfig, salvarConfig, resetConfig,
      clientes, addCliente, editCliente, removeCliente,
      historico, addOrcamento, updateOrcamento, removeOrcamento, toggleAprovado,
      toast, toastMsg, loading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
