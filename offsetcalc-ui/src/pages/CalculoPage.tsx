import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { OrcamentoEntry } from '../context/AppContext';
import {
  calcular, calcMelhoresFormatos,
  CalculatorInput, CalculatorResult, AcabamentoParam, PapelVia, PRESETS,
} from '../utils/calculator';

type Secao = 'orcamento' | 'clientes' | 'config' | 'historico' | 'dashboard';

interface Props {
  onGoTo: (s: Secao) => void;
  editEntry?: OrcamentoEntry | null;
  onEditClear?: () => void;
}

const GRAFISMOS = [
  { val: 0.2, label: 'Só texto' },
  { val: 0.4, label: 'Retícula 40%' },
  { val: 0.7, label: 'Retícula 70% (típico 4 cores)' },
  { val: 1.0, label: 'Chapado / Cores sólidas' },
  { val: 1.2, label: 'Chapado transparente' },
];

const CORES_OPTIONS = [
  { val: 0, label: '0 cores' },
  { val: 1, label: '1 cor (P&B)' },
  { val: 2, label: '2 cores' },
  { val: 3, label: '3 cores' },
  { val: 4, label: '4 cores (CMYK)' },
];

const TIRAGENS_COMP = [500, 1000, 2000, 3000, 5000, 10000];

function mkInput(
  tipoAtivo: CalculatorInput['tipoAtivo'],
  qty: number,
  rest: Omit<CalculatorInput, 'tipoAtivo' | 'tiраgemInput'>
): CalculatorInput {
  return { tipoAtivo, tiраgemInput: qty, ...rest } as CalculatorInput;
}

export default function CalculoPage({ onGoTo, editEntry, onEditClear }: Props) {
  const { config, clientes, addOrcamento, updateOrcamento, toast } = useApp();

  // ── Identificação ────────────────────────────────────────────────────────
  const [jobRef, setJobRef] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteBusca, setClienteBusca] = useState('');
  const [showCliBusca, setShowCliBusca] = useState(false);
  const [jobData, setJobData] = useState(new Date().toISOString().slice(0, 10));
  const [prazo, setPrazo] = useState('');

  // ── Tipo ──────────────────────────────────────────────────────────────────
  const [tipoAtivo, setTipoAtivo] = useState<'simples' | 'bloco' | 'revista'>('simples');

  // ── Papel ─────────────────────────────────────────────────────────────────
  const [tipoPapel, setTipoPapel] = useState(() => config.papeis[0]?.tipo || '');
  const [gramPapel, setGramPapel] = useState(() => config.papeis[0]?.gramatura || '');

  // ── Dimensões ─────────────────────────────────────────────────────────────
  const [w, setW] = useState(21);
  const [h, setH] = useState(29.7);

  // ── Formato impressão ─────────────────────────────────────────────────────
  const [formatoNome, setFormatoNome] = useState('');

  // ── Cores ─────────────────────────────────────────────────────────────────
  const [coresF, setCoresF] = useState(4);
  const [coresV, setCoresV] = useState(0);
  const [tiraNRetiraEnabled, setTiraNRetiraEnabled] = useState(false);
  const [grafismo, setGrafismo] = useState(0.7);

  // ── Máquina e margens ─────────────────────────────────────────────────────
  const [maquinaNome, setMaquinaNome] = useState(() => config.maquinas[0]?.nome || '');
  const [margemPct, setMargemPct] = useState(30);
  const [urgPct, setUrgPct] = useState(0);
  const [refugoPct, setRefugoPct] = useState(5);

  // ── Tiragem ───────────────────────────────────────────────────────────────
  const [qty, setQty] = useState(1000);

  // ── Bloco ─────────────────────────────────────────────────────────────────
  const [blocoFolhas, setBlocoFolhas] = useState(50);
  const [blocoVias, setBlocoVias] = useState(1);
  const [blocoChapaModo, setBlocoChapaModo] = useState<'unica' | 'por-via'>('unica');
  const [blocoPapeis, setBlocoPapeis] = useState<PapelVia[]>([
    { id: 'capa', label: 'Contracapa', tipo: '', gram: '' },
    { id: 'via-1', label: 'Via 1', tipo: '', gram: '' },
  ]);

  // ── Revista ───────────────────────────────────────────────────────────────
  const [revPaginas, setRevPaginas] = useState(16);
  const [revCapaPapel, setRevCapaPapel] = useState('');
  const [revCapaGram, setRevCapaGram] = useState('');
  const [revCapaCoresF, setRevCapaCoresF] = useState(4);
  const [revCapaCoresV, setRevCapaCoresV] = useState(4);
  const [revCapaAcabamentos] = useState<AcabamentoParam[]>([]);

  // ── Acabamentos ───────────────────────────────────────────────────────────
  const [acabSelecionados, setAcabSelecionados] = useState<AcabamentoParam[]>([]);
  const [showAcabModal, setShowAcabModal] = useState(false);

  // ── Resultado ─────────────────────────────────────────────────────────────
  const [resultado, setResultado] = useState<CalculatorResult | null>(null);
  const [showComp, setShowComp] = useState(false);
  const [comparativo, setComparativo] = useState<{ tiragem: number; total: number; unitario: number }[]>([]);

  // ── Sprint 2 ──────────────────────────────────────────────────────────────
  const [tiragensExtras, setTiragensExtras] = useState<number[]>([]);
  const [novaTimagem, setNovaTiragem] = useState('');
  const [desc, setDesc] = useState('');
  const [descManual, setDescManual] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editApplied = useRef<string | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const papeisTipos = useMemo(() => [...new Set(config.papeis.map(p => p.tipo))], [config.papeis]);

  const gramaturasDisponiveis = useMemo(
    () => config.papeis.filter(p => p.tipo === tipoPapel).map(p => p.gramatura),
    [config.papeis, tipoPapel]
  );

  const maquinaSel = useMemo(
    () => config.maquinas.find(m => m.nome === maquinaNome),
    [config.maquinas, maquinaNome]
  );

  const formatosDisponiveis = useMemo(() => {
    if (!w || !h || !maquinaSel) return [];
    return calcMelhoresFormatos(w, h, maquinaSel.pinca || 1.2, tipoAtivo === 'revista', maquinaSel.formato, config.formatos);
  }, [w, h, maquinaSel, tipoAtivo]);

  useEffect(() => {
    if (formatosDisponiveis.length > 0) {
      if (!formatosDisponiveis.find(f => f.nome === formatoNome)) {
        setFormatoNome(formatosDisponiveis[0].nome);
      }
    } else {
      setFormatoNome('');
    }
  }, [formatosDisponiveis]);

  useEffect(() => {
    if (gramaturasDisponiveis.length > 0 && !gramaturasDisponiveis.includes(gramPapel)) {
      setGramPapel(gramaturasDisponiveis[0]);
    }
  }, [gramaturasDisponiveis]);

  useEffect(() => {
    const sel = localStorage.getItem('mohrsys_goto_cliente');
    if (sel) { setClienteNome(sel); localStorage.removeItem('mohrsys_goto_cliente'); }
  }, []);

  // Restaura formulário quando um orçamento é aberto para edição
  useEffect(() => {
    if (!editEntry) return;
    if (editApplied.current === editEntry.id) return;
    editApplied.current = editEntry.id;

    const e = editEntry;
    setEditingId(e.id);
    setJobRef((e.ref as string) || '');
    setClienteNome((e.cliente as string) || '');
    setJobData((e.data as string) || new Date().toISOString().slice(0, 10));
    setPrazo((e.prazo as string) || '');
    setDesc((e.desc as string) || '');
    setDescManual(true);
    setTipoAtivo((e.tipoAtivo as 'simples' | 'bloco' | 'revista') || 'simples');
    setTipoPapel((e.tipoPapel as string) || '');
    setGramPapel((e.gramPapel as string) || '');
    setW((e.w as number) || 21);
    setH((e.h as number) || 29.7);
    setCoresF((e.coresF as number) ?? 4);
    setCoresV((e.coresV as number) ?? 0);
    setTiraNRetiraEnabled(!!(e.tiraNRetiraEnabled));
    setGrafismo((e.grafismo as number) || 0.7);
    setMaquinaNome((e.maquinaNome as string) || '');
    setMargemPct((e.margemPct as number) ?? 30);
    setUrgPct((e.urgPct as number) ?? 0);
    setRefugoPct((e.refugoPct as number) ?? 5);
    setQty((e.qty as number) || (e.tiragem as number) || 1000);
    setBlocoFolhas((e.blocoFolhas as number) || 50);
    setBlocoVias((e.blocoVias as number) || 1);
    setBlocoChapaModo((e.blocoChapaModo as 'unica' | 'por-via') || 'unica');
    if (Array.isArray(e.blocoPapeis)) setBlocoPapeis(e.blocoPapeis as PapelVia[]);
    setRevPaginas((e.revPaginas as number) || 16);
    setRevCapaPapel((e.revCapaPapel as string) || '');
    setRevCapaGram((e.revCapaGram as string) || '');
    setRevCapaCoresF((e.revCapaCoresF as number) ?? 4);
    setRevCapaCoresV((e.revCapaCoresV as number) ?? 4);
    if (Array.isArray(e.acabSelecionados)) setAcabSelecionados(e.acabSelecionados as AcabamentoParam[]);
    if (Array.isArray(e.tiragensExtras)) setTiragensExtras(e.tiragensExtras as number[]);
    if (e.formatoNome) setFormatoNome(e.formatoNome as string);
    if (e.resultado) setResultado(e.resultado as CalculatorResult);
    setShowComp(false);
    setComparativo([]);
    onEditClear?.();
    toast(`Editando ${e.ref} — ajuste e salve para atualizar`);
  }, [editEntry]);

  const formatoSel = formatosDisponiveis.find(f => f.nome === formatoNome);
  const formatoPermiteTira = !!(
    tipoAtivo === 'simples' && coresV > 0 &&
    formatoSel && formatoSel.enc >= 2 && (formatoSel.colunas || 1) % 2 === 0
  );

  const clientesFiltrados = useMemo(() => {
    if (!clienteBusca.trim()) return [];
    const q = clienteBusca.toLowerCase();
    return clientes.filter(c => c.nome.toLowerCase().includes(q)).slice(0, 6);
  }, [clientes, clienteBusca]);

  // ── Build input ───────────────────────────────────────────────────────────
  const buildRest = (): Omit<CalculatorInput, 'tipoAtivo' | 'tiраgemInput'> => ({
    blocoFolhas, blocoVias, blocoChapaModo, blocoPapeis,
    revPaginas, revCapaPapel, revCapaGram, revCapaCoresF, revCapaCoresV, revCapaAcabamentos,
    tipoPapel, gramPapel, w, h, formatoNome,
    coresF, coresV, tiraNRetiraEnabled, grafismo,
    maquinaNome, margemPct, urgPct, refugoPct,
    acabSelecionados,
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const aplicarPreset = (p: { w: number; h: number; blocoF?: number; blocoV?: number; revPag?: number }) => {
    setW(p.w); setH(p.h);
    if (tipoAtivo === 'bloco' && p.blocoF) { setBlocoFolhas(p.blocoF); setBlocoVias(p.blocoV ?? 1); }
    if (tipoAtivo === 'revista' && p.revPag) setRevPaginas(p.revPag);
  };

  const handleCalcular = () => {
    const res = calcular(mkInput(tipoAtivo, qty, buildRest()), config);
    if (res.erro) { toast(res.erro); return; }
    setResultado(res);
    setShowComp(false);
    setComparativo([]);
    if (!descManual) {
      const tipoLabel = tipoAtivo === 'bloco' ? 'Bloco' : tipoAtivo === 'revista' ? 'Revista' : 'Simples';
      const acabNomes = acabSelecionados.map(a => config.acabamentos[a.index]?.nome).filter(Boolean);
      const qtyLabel = tipoAtivo === 'bloco' ? `${qty} blocos` : tipoAtivo === 'revista' ? `${qty.toLocaleString('pt-BR')} ex.` : `${qty.toLocaleString('pt-BR')} un.`;
      const autoDesc = [
        tipoLabel,
        tipoPapel && gramPapel ? `${tipoPapel} ${gramPapel}` : '',
        `${w}×${h} cm`,
        qtyLabel,
        `${coresF}/${coresV} cores`,
        ...acabNomes,
      ].filter(Boolean).join(' · ');
      setDesc(autoDesc);
    }
  };

  const handleLimpar = () => {
    setJobRef(''); setClienteNome(''); setClienteBusca('');
    setW(21); setH(29.7);
    setCoresF(4); setCoresV(0); setTiraNRetiraEnabled(false);
    setGrafismo(0.7); setMargemPct(30); setUrgPct(0); setRefugoPct(5); setQty(1000);
    setAcabSelecionados([]);
    setResultado(null); setShowComp(false); setComparativo([]);
    setTiragensExtras([]); setNovaTiragem('');
    setDesc(''); setDescManual(false);
    setEditingId(null); editApplied.current = null;
  };

  const handleSalvar = () => {
    if (!resultado) return;
    const ref = jobRef || `ORC-${Date.now()}`;
    const entry = {
      ref,
      cliente: clienteNome,
      desc: desc || `${tipoAtivo} · ${tipoPapel} ${gramPapel} · ${w}×${h}cm · ${qty.toLocaleString('pt-BR')} un.`,
      data: jobData || new Date().toISOString().slice(0, 10),
      prazo,
      tipoAtivo, tipoPapel, gramPapel, w, h, coresF, coresV,
      tiraNRetiraEnabled, grafismo,
      maquinaNome, formatoNome, margemPct, urgPct, refugoPct,
      qty, blocoFolhas, blocoVias, blocoChapaModo, blocoPapeis,
      revPaginas, revCapaPapel, revCapaGram, revCapaCoresF, revCapaCoresV,
      acabSelecionados, tiragensExtras,
      total: resultado.total, unitario: resultado.unitario,
      resultado: { ...resultado },
    };
    if (editingId) {
      updateOrcamento(editingId, entry);
      toast(`Orçamento ${ref} atualizado!`);
      setEditingId(null); editApplied.current = null;
    } else {
      addOrcamento(entry);
      toast(`Orçamento ${ref} salvo!`);
    }
    onGoTo('historico');
  };

  const handleToggleComp = () => {
    if (!showComp && resultado) {
      const rest = buildRest();
      const allTiragens = [...new Set([...TIRAGENS_COMP, ...tiragensExtras])].sort((a, b) => a - b);
      const rows = allTiragens.map(t => {
        const r = calcular(mkInput(tipoAtivo, t, rest), config);
        if (r.erro) return null;
        return { tiragem: t, total: r.total, unitario: r.unitario };
      }).filter(Boolean) as { tiragem: number; total: number; unitario: number }[];
      setComparativo(rows);
    }
    setShowComp(v => !v);
  };

  const addTiragemExtra = () => {
    const t = parseInt(novaTimagem);
    if (!t || t <= 0) return;
    setTiragensExtras(prev => prev.includes(t) ? prev : [...prev, t].sort((a, b) => a - b));
    setNovaTiragem('');
  };

  const removeTiragemExtra = (t: number) => setTiragensExtras(prev => prev.filter(x => x !== t));

  const toggleAcab = (index: number) => {
    setAcabSelecionados(prev => {
      if (prev.find(a => a.index === index)) return prev.filter(a => a.index !== index);
      const a = config.acabamentos[index];
      const novo: AcabamentoParam = { index };
      if (a.formula === 'laminacao' || a.formula === 'verniz_total') novo.lados = 1;
      if (a.formula === 'verniz_local') novo.percArea = a.percArea ?? 30;
      if (a.formula === 'corte_vinco') { novo.setup = a.setup ?? 80; novo.valorMil = a.valorMil ?? 100; novo.faca = 0; }
      return [...prev, novo];
    });
  };

  const updateAcabParam = (index: number, field: keyof AcabamentoParam, value: number) => {
    setAcabSelecionados(prev => prev.map(a => a.index === index ? { ...a, [field]: value } : a));
  };

  const updateBlocoPapel = (slotId: string, slotLabel: string, field: 'tipo' | 'gram', value: string) => {
    setBlocoPapeis(prev => {
      const exists = prev.find(p => p.id === slotId);
      if (field === 'tipo') {
        const nx: PapelVia = { id: slotId, label: slotLabel, tipo: value, gram: '' };
        return exists ? prev.map(p => p.id === slotId ? nx : p) : [...prev, nx];
      }
      return exists
        ? prev.map(p => p.id === slotId ? { ...p, gram: value } : p)
        : [...prev, { id: slotId, label: slotLabel, tipo: '', gram: value }];
    });
  };

  // ── Presets ───────────────────────────────────────────────────────────────
  const presets = (PRESETS as Record<string, { label: string; w: number; h: number; blocoF?: number; blocoV?: number; revPag?: number }[]>)[tipoAtivo] ?? [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="section active">
      <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>
        Novo <span className="grad-text">Cálculo</span>
      </h2>

      <div className="section-grid">

        {/* ══ COLUNA 1 — Identificação ══════════════════════════════════════ */}
        <div>
          <div className="card">
            <div className="card-title">Identificação</div>

            <div className="field">
              <label>Número / Referência</label>
              <input type="text" value={jobRef} onChange={e => setJobRef(e.target.value)} placeholder="ORC-2025-001" />
            </div>

            <div className="field" style={{ position: 'relative' }}>
              <label>Cliente</label>
              <input
                type="text"
                value={clienteBusca !== '' ? clienteBusca : clienteNome}
                onChange={e => { setClienteBusca(e.target.value); setClienteNome(''); setShowCliBusca(true); }}
                onFocus={() => setShowCliBusca(true)}
                onBlur={() => setTimeout(() => setShowCliBusca(false), 200)}
                placeholder="Digite para buscar..."
              />
              {showCliBusca && clientesFiltrados.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                  {clientesFiltrados.map(c => (
                    <div key={c.id}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid var(--border)' }}
                      onMouseDown={() => { setClienteNome(c.nome); setClienteBusca(''); setShowCliBusca(false); }}>
                      {c.nome}
                      {c.tel && <span style={{ color: 'var(--text2)', fontSize: '11px', marginLeft: '6px' }}>· {c.tel}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Data</label>
                <input type="date" value={jobData} onChange={e => setJobData(e.target.value)} />
              </div>
              <div className="field">
                <label>Prazo</label>
                <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Tipo de Material</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                {(['simples', 'bloco', 'revista'] as const).map(tipo => (
                  <button key={tipo}
                    className={`btn ${tipoAtivo === tipo ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 4px', fontSize: '11px', fontWeight: 700 }}
                    onClick={() => setTipoAtivo(tipo)}>
                    {tipo === 'simples' ? 'Simples' : tipo === 'bloco' ? 'Bloco' : 'Revista'}
                  </button>
                ))}
              </div>
            </div>

            {presets.length > 0 && (
              <div className="field">
                <label>Presets Rápidos</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {presets.map(p => (
                    <button key={p.label} className="preset-btn" onClick={() => aplicarPreset(p)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bloco params */}
          {tipoAtivo === 'bloco' && (
            <div className="card" style={{ marginTop: '12px' }}>
              <div className="card-title">Configuração do Bloco</div>
              <div className="grid-2">
                <div className="field">
                  <label>Folhas por Bloco</label>
                  <input type="number" value={blocoFolhas} onChange={e => setBlocoFolhas(Math.max(1, +e.target.value))} min={1} />
                </div>
                <div className="field">
                  <label>Nº de Vias</label>
                  <select value={blocoVias} onChange={e => setBlocoVias(+e.target.value)}>
                    {[1, 2, 3, 4].map(v => <option key={v} value={v}>{v} {v === 1 ? 'via' : 'vias'}</option>)}
                  </select>
                </div>
              </div>
              {blocoVias > 1 && (
                <div className="field">
                  <label>Modo de Chapas</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['unica', 'por-via'] as const).map(m => (
                      <button key={m}
                        className={`btn ${blocoChapaModo === m ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, fontSize: '11px' }}
                        onClick={() => setBlocoChapaModo(m)}>
                        {m === 'unica' ? 'Chapa Única' : 'Por Via'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="field">
                <label>Papéis</label>
                {[
                  { id: 'capa', label: blocoVias === 1 ? 'Contracapa' : 'Capa/Contracapa' },
                  ...Array.from({ length: blocoVias }, (_, i) => ({ id: `via-${i + 1}`, label: `Via ${i + 1}` })),
                ].map(slot => {
                  const pv = blocoPapeis.find(p => p.id === slot.id) || { id: slot.id, label: slot.label, tipo: '', gram: '' };
                  const gramsSlot = config.papeis.filter(p => p.tipo === pv.tipo).map(p => p.gramatura);
                  return (
                    <div key={slot.id} style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>{slot.label}</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select style={{ flex: 2 }} value={pv.tipo}
                          onChange={e => updateBlocoPapel(slot.id, slot.label, 'tipo', e.target.value)}>
                          <option value="">— papel —</option>
                          {papeisTipos.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select style={{ flex: 1 }} value={pv.gram}
                          onChange={e => updateBlocoPapel(slot.id, slot.label, 'gram', e.target.value)}>
                          <option value="">g</option>
                          {gramsSlot.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Revista params */}
          {tipoAtivo === 'revista' && (
            <div className="card" style={{ marginTop: '12px' }}>
              <div className="card-title">Parâmetros da Revista</div>
              <div className="field">
                <label>Número de Páginas</label>
                <input type="number" value={revPaginas} onChange={e => setRevPaginas(Math.max(4, +e.target.value))} min={4} step={4} />
                <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '2px' }}>
                  {Math.ceil(revPaginas / 4)} lâmina(s) de impressão
                </div>
              </div>
              <div className="field">
                <label>Papel da Capa</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select style={{ flex: 2 }} value={revCapaPapel}
                    onChange={e => { setRevCapaPapel(e.target.value); setRevCapaGram(''); }}>
                    <option value="">— papel capa —</option>
                    {papeisTipos.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select style={{ flex: 1 }} value={revCapaGram} onChange={e => setRevCapaGram(e.target.value)}>
                    <option value="">g</option>
                    {config.papeis.filter(p => p.tipo === revCapaPapel).map(p =>
                      <option key={p.gramatura} value={p.gramatura}>{p.gramatura}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Capa Frente</label>
                  <select value={revCapaCoresF} onChange={e => setRevCapaCoresF(+e.target.value)}>
                    {CORES_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Capa Verso</label>
                  <select value={revCapaCoresV} onChange={e => setRevCapaCoresV(+e.target.value)}>
                    {CORES_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══ COLUNA 2 — Especificações ══════════════════════════════════════ */}
        <div>
          <div className="card">
            <div className="card-title">Especificações de Impressão</div>

            {tipoAtivo !== 'bloco' && (
              <div className="grid-2">
                <div className="field">
                  <label>{tipoAtivo === 'revista' ? 'Papel do Miolo' : 'Tipo de Papel'}</label>
                  <select value={tipoPapel} onChange={e => { setTipoPapel(e.target.value); setGramPapel(''); }}>
                    <option value="">— selecione —</option>
                    {papeisTipos.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Gramatura</label>
                  <select value={gramPapel} onChange={e => setGramPapel(e.target.value)}>
                    <option value="">—</option>
                    {gramaturasDisponiveis.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="field">
              <label>Formato Fechado (cm)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="number" value={w} onChange={e => setW(+e.target.value)} placeholder="Larg." step={0.1} style={{ flex: 1 }} />
                <span style={{ color: 'var(--text2)' }}>×</span>
                <input type="number" value={h} onChange={e => setH(+e.target.value)} placeholder="Alt." step={0.1} style={{ flex: 1 }} />
                <span style={{ fontSize: '12px', color: 'var(--text2)' }}>cm</span>
              </div>
              {tipoAtivo === 'revista' && (
                <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '3px' }}>
                  Informe a página fechada — a lâmina aberta será calculada automaticamente
                </div>
              )}
            </div>

            <div className="field">
              <label>Formato de Impressão</label>
              {formatosDisponiveis.length > 0 ? (
                <select value={formatoNome} onChange={e => setFormatoNome(e.target.value)}>
                  {formatosDisponiveis.map(f => (
                    <option key={f.nome} value={f.nome}>
                      M{f.enc} — {f.nome} ({f.w}×{f.h}cm) {f.aproveitamento.toFixed(0)}% apr.
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: '10px', background: 'var(--surface2)', borderRadius: '6px', fontSize: '12px', color: '#ef4444' }}>
                  Selecione máquina e dimensões válidas
                </div>
              )}
              {formatoSel && (
                <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '3px' }}>
                  {formatoSel.enc} peças/folha · {formatoSel.orientacao} · sobra {formatoSel.sobra.toFixed(0)} cm²
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Cores Frente</label>
                <select value={coresF} onChange={e => setCoresF(+e.target.value)}>
                  {CORES_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Cores Verso</label>
                <select value={coresV} onChange={e => setCoresV(+e.target.value)}>
                  {CORES_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {formatoPermiteTira && (
              <div className="check-row">
                <input type="checkbox" id="tiraNRetira"
                  checked={tiraNRetiraEnabled} onChange={e => setTiraNRetiraEnabled(e.target.checked)} />
                <label htmlFor="tiraNRetira">Tira e Retira (economiza chapas de verso)</label>
              </div>
            )}

            <div className="field">
              <label>Tipo de Grafismo</label>
              <select value={grafismo} onChange={e => setGrafismo(+e.target.value)}>
                {GRAFISMOS.map(g => <option key={g.val} value={g.val}>{g.label}</option>)}
              </select>
            </div>

            <div className="field">
              <label>
                {tipoAtivo === 'bloco' ? 'Quantidade de Blocos' :
                 tipoAtivo === 'revista' ? 'Nº de Exemplares' : 'Tiragem (unidades)'}
              </label>
              <input type="number" value={qty} onChange={e => setQty(Math.max(1, +e.target.value))} min={1} placeholder="1000" />
              <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                {tiragensExtras.map(t => (
                  <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(6,182,212,.1)', border: '1px solid rgba(6,182,212,.3)', borderRadius: '4px', padding: '2px 7px', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--accent2)' }}>
                    {t.toLocaleString('pt-BR')} un.
                    <span style={{ cursor: 'pointer', fontSize: '13px', opacity: .7 }} onClick={() => removeTiragemExtra(t)}>×</span>
                  </span>
                ))}
                <div style={{ display: 'flex', gap: '4px', marginLeft: tiragensExtras.length > 0 ? '4px' : 0 }}>
                  <input
                    type="number" min={1} value={novaTimagem}
                    onChange={e => setNovaTiragem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTiragemExtra()}
                    placeholder="+ comparar"
                    style={{ width: '90px', fontSize: '11px', padding: '3px 6px' }}
                  />
                  <button className="btn btn-secondary" style={{ fontSize: '10px', padding: '3px 8px' }} onClick={addTiragemExtra}>+</button>
                </div>
              </div>
            </div>

            <div className="field">
              <label>Acabamentos</label>
              <button className="btn btn-secondary" style={{ width: '100%' }}
                onClick={() => setShowAcabModal(true)}>
                {acabSelecionados.length === 0
                  ? '+ Selecionar Acabamentos'
                  : `${acabSelecionados.length} acabamento(s) — clique para editar`}
              </button>
              {acabSelecionados.length > 0 && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text2)', lineHeight: '1.6' }}>
                  {acabSelecionados.map(a => config.acabamentos[a.index]?.nome).join(' · ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ COLUNA 3 — Parâmetros e Resultado ══════════════════════════════ */}
        <div className="sticky-panel">
          <div className="card">
            <div className="card-title">Parâmetros Operacionais</div>

            <div className="field">
              <label>Máquina</label>
              <select value={maquinaNome} onChange={e => setMaquinaNome(e.target.value)}>
                <option value="">— selecione —</option>
                {config.maquinas.map(m => <option key={m.nome} value={m.nome}>{m.nome}</option>)}
              </select>
              {maquinaSel && (
                <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '3px' }}>
                  {maquinaSel.formato} · {maquinaSel.velocidade.toLocaleString('pt-BR')} cph · R$ {maquinaSel.custoHora}/h
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="field">
                <label>% Margem de Lucro</label>
                <input type="number" value={margemPct} onChange={e => setMargemPct(+e.target.value)} min={0} max={500} />
              </div>
              <div className="field">
                <label>% Urgência</label>
                <input type="number" value={urgPct} onChange={e => setUrgPct(+e.target.value)} min={0} max={100} />
              </div>
            </div>

            <div className="field">
              <label>% Refugo</label>
              <input type="number" value={refugoPct} onChange={e => setRefugoPct(+e.target.value)} min={0} max={50} />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleCalcular}>
                Calcular
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleLimpar}>
                Limpar
              </button>
            </div>
          </div>

          {resultado && !resultado.erro && (
            <>
              <div className="result-section" style={{ marginTop: '12px' }}>
                <div className="result-title">Resultado</div>

                {/* Total em destaque */}
                <div style={{ textAlign: 'center', padding: '20px 0 16px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(167,139,250,.7)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
                    Total do Orçamento
                  </div>
                  <div className="grad-text" style={{ fontSize: '36px', fontWeight: 900, lineHeight: 1.1 }}>
                    R$ {resultado.total.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', marginTop: '8px' }}>
                    {resultado.unitarioLabel}:{' '}
                    <strong style={{ color: '#34d399' }}>R$ {resultado.unitario.toFixed(4)}</strong>
                  </div>
                  {resultado.urgPct > 0 && (
                    <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>
                      + {resultado.urgPct}% urgência = R$ {resultado.adUrgencia.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Breakdown de custos */}
                <div style={{ padding: '12px 0' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Composição de Custo
                  </div>
                  {([
                    ['Papel', resultado.custoPapel],
                    ['Chapas', resultado.custoChapas],
                    ['Setup', resultado.custoSetup],
                    ['Tinta', resultado.custoTinta],
                    ['Máquina', resultado.custoMaquina],
                    ['Custo Indireto', resultado.custoIndireto],
                    ...(resultado.custoAcab > 0 ? [['Acabamentos', resultado.custoAcab]] : []),
                  ] as [string, number][]).map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text2)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--mono)' }}>R$ {val.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', fontWeight: 700 }}>
                    <span>Subtotal</span>
                    <span style={{ fontFamily: 'var(--mono)' }}>R$ {resultado.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0', color: 'var(--accent)' }}>
                    <span>Margem ({resultado.margemPct}%)</span>
                    <span style={{ fontFamily: 'var(--mono)' }}>R$ {resultado.margem.toFixed(2)}</span>
                  </div>
                  {(config.imposto ?? 0) > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '2px 0', color: '#fbbf24' }}>
                        <span>Impostos ({config.imposto}%)</span>
                        <span style={{ fontFamily: 'var(--mono)' }}>R$ {(resultado.total * config.imposto / 100).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', fontWeight: 800, borderTop: '2px solid var(--border)', color: '#f59e0b' }}>
                        <span>Total com Impostos</span>
                        <span style={{ fontFamily: 'var(--mono)' }}>R$ {(resultado.total * (1 + config.imposto / 100)).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Detalhes técnicos */}
                <div style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                    Detalhes Técnicos
                  </div>
                  {resultado.jobLines.map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0', gap: '8px' }}>
                      <span style={{ color: 'var(--text2)', flexShrink: 0 }}>{l.label}</span>
                      <span style={{ fontFamily: 'var(--mono)', textAlign: 'right', fontSize: '10px' }}>{l.value}</span>
                    </div>
                  ))}
                  {resultado.acabSel.length > 0 && (
                    <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text2)' }}>
                      {resultado.acabSel.map(a => `${a.nome}: R$ ${a.val.toFixed(2)}`).join(' · ')}
                    </div>
                  )}
                </div>

                {/* Descrição editável */}
                <div style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Descrição do Orçamento
                    </label>
                    {descManual && (
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent2)', fontSize: '11px', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 4px' }}
                        onClick={() => { setDescManual(false); handleCalcular(); }}
                        title="Voltar para descrição automática">
                        ↺ auto
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={desc}
                    onChange={e => { setDesc(e.target.value); setDescManual(true); }}
                    placeholder="Gerado automaticamente após calcular..."
                    style={{ width: '100%', fontSize: '12px' }}
                  />
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSalvar}>
                    {editingId ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
                  </button>
                  <button className="btn btn-secondary" onClick={handleToggleComp}>
                    {showComp ? 'Fechar' : 'Tiragens'}
                  </button>
                </div>
                {editingId && (
                  <div style={{ fontSize: '11px', color: '#f59e0b', textAlign: 'center', marginTop: '6px' }}>
                    Modo edição — clique em "Limpar" para cancelar
                  </div>
                )}
              </div>

              {/* Comparativo de Tiragens */}
              {showComp && comparativo.length > 0 && (
                <div className="card" style={{ marginTop: '12px' }}>
                  <div className="card-title">Comparativo de Tiragens</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text2)', fontWeight: 600 }}>Tiragem</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text2)', fontWeight: 600 }}>Total</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text2)', fontWeight: 600 }}>Unitário</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparativo.map(r => (
                        <tr key={r.tiragem}
                          style={{ borderBottom: '1px solid var(--border)', background: r.tiragem === qty ? 'rgba(124,58,237,0.08)' : undefined }}>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: r.tiragem === qty ? 700 : 400 }}>
                            {r.tiragem.toLocaleString('pt-BR')}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)' }}>
                            R$ {r.total.toFixed(2)}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--mono)', color: '#10b981' }}>
                            R$ {r.unitario.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══ Modal de Acabamentos ════════════════════════════════════════════════ */}
      {showAcabModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: '12px', padding: '24px',
            width: '100%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>Selecionar Acabamentos</div>
              <button className="btn btn-secondary" onClick={() => setShowAcabModal(false)}>Fechar</button>
            </div>

            {config.acabamentos.map((a, i) => {
              const sel = acabSelecionados.find(s => s.index === i);
              return (
                <div key={i} style={{
                  border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '8px', marginBottom: '8px', overflow: 'hidden'
                }}>
                  <div
                    style={{
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                      background: sel ? 'rgba(124,58,237,0.08)' : undefined
                    }}
                    onClick={() => toggleAcab(i)}>
                    <input type="checkbox" checked={!!sel} onChange={() => {}} style={{ pointerEvents: 'none' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{a.nome}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
                        {a.formula === 'laminacao' && `R$ ${a.valorM2}/m² por lado`}
                        {a.formula === 'verniz_total' && `R$ ${a.valorM2}/m²`}
                        {a.formula === 'verniz_local' && `R$ ${a.valorM2}/m² · ${a.percArea ?? 30}% área padrão`}
                        {a.formula === 'corte_vinco' && `Setup R$ ${a.setup ?? 80} + R$ ${a.valorMil ?? 100}/mil`}
                        {a.formula === 'por_mil' && `R$ ${a.valorMil}/mil unidades`}
                        {a.formula === 'fixo' && `R$ ${a.valor} fixo`}
                      </div>
                    </div>
                  </div>

                  {sel && (
                    <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {(a.formula === 'laminacao' || a.formula === 'verniz_total') && (
                        <div className="field" style={{ margin: 0, minWidth: '120px' }}>
                          <label style={{ fontSize: '10px' }}>Número de Lados</label>
                          <select value={sel.lados ?? 1} onChange={e => updateAcabParam(i, 'lados', +e.target.value)}>
                            <option value={1}>1 lado</option>
                            <option value={2}>2 lados</option>
                          </select>
                        </div>
                      )}
                      {a.formula === 'verniz_local' && (
                        <div className="field" style={{ margin: 0, minWidth: '120px' }}>
                          <label style={{ fontSize: '10px' }}>% da Área</label>
                          <input type="number" value={sel.percArea ?? a.percArea ?? 30}
                            onChange={e => updateAcabParam(i, 'percArea', +e.target.value)} min={1} max={100} />
                        </div>
                      )}
                      {a.formula === 'corte_vinco' && (
                        <>
                          <div className="field" style={{ margin: 0, minWidth: '100px' }}>
                            <label style={{ fontSize: '10px' }}>Setup (R$)</label>
                            <input type="number" value={sel.setup ?? a.setup ?? 80}
                              onChange={e => updateAcabParam(i, 'setup', +e.target.value)} />
                          </div>
                          <div className="field" style={{ margin: 0, minWidth: '100px' }}>
                            <label style={{ fontSize: '10px' }}>R$/mil</label>
                            <input type="number" value={sel.valorMil ?? a.valorMil ?? 100}
                              onChange={e => updateAcabParam(i, 'valorMil', +e.target.value)} />
                          </div>
                          <div className="field" style={{ margin: 0, minWidth: '100px' }}>
                            <label style={{ fontSize: '10px' }}>Faca (R$)</label>
                            <input type="number" value={sel.faca ?? 0}
                              onChange={e => updateAcabParam(i, 'faca', +e.target.value)} min={0} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
