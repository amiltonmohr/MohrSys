import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppConfig, configDefault } from '../utils/calculator';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Cliente {
  id: string;
  nome: string;
  tel: string;
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
  // campos do cálculo
  [key: string]: unknown;
}

interface AppContextValue {
  config: AppConfig;
  setConfig: (cfg: AppConfig) => void;
  salvarConfig: (cfg: AppConfig) => Promise<void>;
  resetConfig: () => void;
  clientes: Cliente[];
  addCliente: (nome: string, tel: string) => void;
  editCliente: (id: string, nome: string, tel: string) => void;
  removeCliente: (id: string) => void;
  historico: OrcamentoEntry[];
  addOrcamento: (entry: Omit<OrcamentoEntry, 'id' | 'ts' | 'aprovado'>) => void;
  updateOrcamento: (id: string, entry: Partial<OrcamentoEntry>) => void;
  removeOrcamento: (id: string) => void;
  toggleAprovado: (id: string) => void;
  toast: (msg: string) => void;
  toastMsg: string;
}

// ─── LocalStorage keys ───────────────────────────────────────────────────────

const LS_CFG = 'mohrsys_config_v2';
const LS_CLI = 'mohrsys_clientes_v2';
const LS_HIST = 'mohrsys_historico_v2';

function loadLS<T>(key: string, fallback: T): T {
  try {
    const d = localStorage.getItem(key);
    return d ? (JSON.parse(d) as T) : fallback;
  } catch { return fallback; }
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
    // mescla papeis novos do padrão
    const papeisMerged = configDefault.papeis.map(pd => {
      const ex = saved.papeis?.find(p => p.tipo === pd.tipo && p.gramatura === pd.gramatura);
      return ex || pd;
    });
    const custom = (saved.papeis || []).filter(p => !configDefault.papeis.find(pd => pd.tipo === p.tipo && pd.gramatura === p.gramatura));
    return { ...configDefault, ...saved, papeis: [...papeisMerged, ...custom] };
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => loadLS<Cliente[]>(LS_CLI, []));
  const [historico, setHistorico] = useState<OrcamentoEntry[]>(() => loadLS<OrcamentoEntry[]>(LS_HIST, []));
  const [toastMsg, setToastMsg] = useState('');

  // Persiste config
  const setConfig = useCallback((cfg: AppConfig) => {
    setConfigState(cfg);
    saveLS(LS_CFG, cfg);
  }, []);

  const salvarConfig = useCallback(async (cfg: AppConfig) => {
    setConfig(cfg);
    // tenta sincronizar com a API
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch('http://localhost:3000/api/v1/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(cfg),
        });
      }
    } catch { /* offline — já salvou no localStorage */ }
  }, [setConfig]);

  const resetConfig = useCallback(() => {
    const cfg = { ...configDefault };
    setConfig(cfg);
  }, [setConfig]);

  // Persiste clientes
  useEffect(() => { saveLS(LS_CLI, clientes); }, [clientes]);
  useEffect(() => { saveLS(LS_HIST, historico); }, [historico]);

  const addCliente = useCallback((nome: string, tel: string) => {
    const entry: Cliente = { id: Date.now().toString(), nome, tel, ts: Date.now() };
    setClientes(prev => [entry, ...prev]);
  }, []);

  const editCliente = useCallback((id: string, nome: string, tel: string) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, nome, tel } : c));
  }, []);

  const removeCliente = useCallback((id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
  }, []);

  const addOrcamento = useCallback((entry: Omit<OrcamentoEntry, 'id' | 'ts' | 'aprovado'>) => {
    const full = { ...entry, id: Date.now().toString(), ts: Date.now(), aprovado: false } as OrcamentoEntry;
    setHistorico(prev => [full, ...prev]);
  }, []);

  const updateOrcamento = useCallback((id: string, entry: Partial<OrcamentoEntry>) => {
    setHistorico(prev => prev.map(h => h.id === id ? { ...h, ...entry } : h));
  }, []);

  const removeOrcamento = useCallback((id: string) => {
    setHistorico(prev => prev.filter(h => h.id !== id));
  }, []);

  const toggleAprovado = useCallback((id: string) => {
    setHistorico(prev => prev.map(h => h.id === id ? { ...h, aprovado: !h.aprovado } : h));
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }, []);

  return (
    <AppContext.Provider value={{
      config, setConfig, salvarConfig, resetConfig,
      clientes, addCliente, editCliente, removeCliente,
      historico, addOrcamento, updateOrcamento, removeOrcamento, toggleAprovado,
      toast, toastMsg,
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
