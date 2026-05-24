import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  AppConfig, PapelConfig, MaquinaConfig, AcabamentoConfig, FormatoConfig,
} from '../utils/calculator';

const FORMULAS = [
  { val: 'laminacao',    label: 'Laminação'    },
  { val: 'verniz_total', label: 'Verniz Total'  },
  { val: 'verniz_local', label: 'Verniz Local'  },
  { val: 'corte_vinco',  label: 'Corte e Vinco' },
  { val: 'por_mil',      label: 'Por Mil'       },
  { val: 'fixo',         label: 'Valor Fixo'    },
] as const;

const PAPEL_FORMATOS = ['66x96cm', '52x74cm', '36x52cm', '46x64cm', '48x66cm'];

const emptyPapel  = (): PapelConfig      => ({ tipo: '', gramatura: '', formato: '66x96cm', precoPorKg: 12, fatorAbs: 1.0 });
const emptyMaquina = (): MaquinaConfig   => ({ nome: '', formato: '36x52cm', custoHora: 90, velocidade: 5000, pinca: 1.2 });
const emptyAcab   = (): AcabamentoConfig => ({ nome: '', formula: 'laminacao', valorM2: 1.80, valorMinimo: 0 });
const emptyFormato = (): FormatoConfig   => ({ nome: '', w: 33, h: 48, div: '1/4', obs: '' });

const LS_COL_WIDTHS = 'mohrsys_col_widths';
const LS_SHEETS_URL = 'mohrsys_sheets_url';

interface ColWidths { ref: number; status: number; data: number; cliente: number; valor: number; }
const defaultColWidths: ColWidths = { ref: 120, status: 110, data: 90, cliente: 150, valor: 130 };

function applyColWidths(w: ColWidths) {
  const root = document.documentElement;
  root.style.setProperty('--col-hist-ref',     `${w.ref}px`);
  root.style.setProperty('--col-hist-status',  `${w.status}px`);
  root.style.setProperty('--col-hist-data',    `${w.data}px`);
  root.style.setProperty('--col-hist-cliente', `${w.cliente}px`);
  root.style.setProperty('--col-hist-valor',   `${w.valor}px`);
}

export default function ConfigPage() {
  const { config, salvarConfig, resetConfig, toast } = useApp();
  const [draft, setDraft]         = useState<AppConfig>({ ...config });
  const [dirty, setDirty]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [newPapel,   setNewPapel]   = useState<PapelConfig>(emptyPapel());
  const [newMaq,     setNewMaq]     = useState<MaquinaConfig>(emptyMaquina());
  const [newAcab,    setNewAcab]    = useState<AcabamentoConfig>(emptyAcab());
  const [newFormato, setNewFormato] = useState<FormatoConfig>(emptyFormato());

  const [showAddPapel,   setShowAddPapel]   = useState(false);
  const [showAddMaq,     setShowAddMaq]     = useState(false);
  const [showAddAcab,    setShowAddAcab]    = useState(false);
  const [showAddFormato, setShowAddFormato] = useState(false);

  const [colWidths, setColWidths] = useState<ColWidths>(() => {
    try { return { ...defaultColWidths, ...JSON.parse(localStorage.getItem(LS_COL_WIDTHS) || '{}') }; }
    catch { return defaultColWidths; }
  });
  const [sheetsUrl, setSheetsUrl] = useState(() => localStorage.getItem(LS_SHEETS_URL) || '');
  const [sheetsStatus, setSheetsStatus] = useState('');

  useEffect(() => { setDraft({ ...config }); setDirty(false); }, [config]);

  useEffect(() => { applyColWidths(colWidths); }, [colWidths]);

  const update = (patch: Partial<AppConfig>) => {
    setDraft(prev => {
      const next = { ...prev, ...patch };
      const total = (next.ciAluguel || 0) + (next.ciEnergia || 0) + (next.ciManutencao || 0) + (next.ciOutros || 0);
      next.ciPorHora = next.ciHoras > 0 ? parseFloat((total / next.ciHoras).toFixed(2)) : 0;
      return next;
    });
    setDirty(true);
  };

  const handleSalvar = async () => {
    setSaving(true);
    await salvarConfig(draft);
    setDirty(false);
    setSaving(false);
    toast('Configurações salvas!');
  };

  const handleReset = () => { resetConfig(); setConfirmReset(false); setDirty(false); };

  // ── Papéis ────────────────────────────────────────────────────────────────
  const updatePapel = (i: number, field: keyof PapelConfig, val: string | number) => {
    update({ papeis: draft.papeis.map((p, idx) => idx === i ? { ...p, [field]: val } : p) });
  };
  const removePapel  = (i: number) => update({ papeis: draft.papeis.filter((_, idx) => idx !== i) });
  const addPapel = () => {
    if (!newPapel.tipo || !newPapel.gramatura) return;
    update({ papeis: [...draft.papeis, { ...newPapel }] });
    setNewPapel(emptyPapel());
    setShowAddPapel(false);
  };

  // ── Máquinas ──────────────────────────────────────────────────────────────
  const updateMaq = (i: number, field: keyof MaquinaConfig, val: string | number) => {
    update({ maquinas: draft.maquinas.map((m, idx) => idx === i ? { ...m, [field]: val } : m) });
  };
  const removeMaq = (i: number) => update({ maquinas: draft.maquinas.filter((_, idx) => idx !== i) });
  const addMaq = () => {
    if (!newMaq.nome) return;
    update({ maquinas: [...draft.maquinas, { ...newMaq }] });
    setNewMaq(emptyMaquina());
    setShowAddMaq(false);
  };

  // ── Acabamentos ───────────────────────────────────────────────────────────
  const updateAcab = (i: number, patch: Partial<AcabamentoConfig>) => {
    update({ acabamentos: draft.acabamentos.map((a, idx) => idx === i ? { ...a, ...patch } : a) });
  };
  const removeAcab = (i: number) => update({ acabamentos: draft.acabamentos.filter((_, idx) => idx !== i) });
  const addAcab = () => {
    if (!newAcab.nome) return;
    update({ acabamentos: [...draft.acabamentos, { ...newAcab }] });
    setNewAcab(emptyAcab());
    setShowAddAcab(false);
  };

  // ── Formatos ──────────────────────────────────────────────────────────────
  const updateFormato = (i: number, patch: Partial<FormatoConfig>) => {
    update({ formatos: (draft.formatos || []).map((f, idx) => idx === i ? { ...f, ...patch } : f) });
  };
  const removeFormato = (i: number) => update({ formatos: (draft.formatos || []).filter((_, idx) => idx !== i) });
  const addFormato = () => {
    if (!newFormato.nome) return;
    update({ formatos: [...(draft.formatos || []), { ...newFormato }] });
    setNewFormato(emptyFormato());
    setShowAddFormato(false);
  };

  // ── Column widths ─────────────────────────────────────────────────────────
  const updateColWidth = (key: keyof ColWidths, val: number) => {
    const next = { ...colWidths, [key]: val };
    setColWidths(next);
    localStorage.setItem(LS_COL_WIDTHS, JSON.stringify(next));
  };

  // ── Google Sheets ─────────────────────────────────────────────────────────
  const handleSheetsUrl = (val: string) => {
    setSheetsUrl(val);
    localStorage.setItem(LS_SHEETS_URL, val);
  };

  const testarSheets = async () => {
    if (!sheetsUrl) { setSheetsStatus('⚠ Informe a URL primeiro.'); return; }
    setSheetsStatus('Testando...');
    try {
      const r = await fetch(sheetsUrl, { method: 'GET' });
      setSheetsStatus(r.ok ? '✓ Conexão OK!' : `✗ Erro HTTP ${r.status}`);
    } catch { setSheetsStatus('✗ Não foi possível conectar.'); }
    setTimeout(() => setSheetsStatus(''), 4000);
  };

  const ciTotal = (draft.ciAluguel || 0) + (draft.ciEnergia || 0) + (draft.ciManutencao || 0) + (draft.ciOutros || 0);

  return (
    <div className="section active">
      {/* Header */}
      <div className="section-header">
        <h2>Área de <span>Configurações</span></h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setConfirmReset(true)}>Restaurar Padrões</button>
          <button className="btn btn-primary" onClick={handleSalvar} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>

      {dirty && (
        <div className="info-badge" style={{ background: 'rgba(245,158,11,.08)', borderColor: 'rgba(245,158,11,.3)', color: '#d97706', marginBottom: '12px' }}>
          ⚠ Há alterações não salvas.
        </div>
      )}

      <div className="info-badge">
        ⚙ Todos os valores cadastrados aqui alimentam automaticamente o módulo de orçamento. Atualize sempre que houver reajuste de fornecedores.
      </div>

      {/* 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start', marginTop: '16px' }}>

        {/* ── COLUNA 1 ─────────────────────────────────────────────────────── */}
        <div>

          {/* Papéis */}
          <div className="card">
            <div className="card-title">Tabela de Papéis (preço por resma 500 fls)</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th><th>Gramatura</th><th>Formato</th>
                    <th style={{ textAlign: 'right' }}>R$/kg</th>
                    <th style={{ textAlign: 'right' }}>Fator Abs.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.papeis.map((p, i) => (
                    <tr key={i}>
                      <td><input value={p.tipo} onChange={e => updatePapel(i, 'tipo', e.target.value)} /></td>
                      <td><input value={p.gramatura} onChange={e => updatePapel(i, 'gramatura', e.target.value)} style={{ width: '70px' }} /></td>
                      <td>
                        <select value={p.formato} onChange={e => updatePapel(i, 'formato', e.target.value)}>
                          {PAPEL_FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" step="0.01" value={p.precoPorKg}
                          onChange={e => updatePapel(i, 'precoPorKg', parseFloat(e.target.value) || 0)}
                          style={{ textAlign: 'right', width: '80px' }} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" step="0.01" min="0.5" max="2.0" value={p.fatorAbs}
                          onChange={e => updatePapel(i, 'fatorAbs', parseFloat(e.target.value) || 1)}
                          style={{ textAlign: 'right', width: '70px' }} />
                      </td>
                      <td><button className="btn-icon" onClick={() => removePapel(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showAddPapel ? (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px,1fr))', gap: '8px', alignItems: 'end' }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Tipo</label>
                    <input value={newPapel.tipo} onChange={e => setNewPapel(p => ({ ...p, tipo: e.target.value }))} placeholder="ex: Couchê" />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Gramatura</label>
                    <input value={newPapel.gramatura} onChange={e => setNewPapel(p => ({ ...p, gramatura: e.target.value }))} placeholder="ex: 115g" />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Formato</label>
                    <select value={newPapel.formato} onChange={e => setNewPapel(p => ({ ...p, formato: e.target.value }))}>
                      {PAPEL_FORMATOS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>R$/kg</label>
                    <input type="number" step="0.01" value={newPapel.precoPorKg}
                      onChange={e => setNewPapel(p => ({ ...p, precoPorKg: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Fator Abs.</label>
                    <input type="number" step="0.01" value={newPapel.fatorAbs}
                      onChange={e => setNewPapel(p => ({ ...p, fatorAbs: parseFloat(e.target.value) || 1 }))} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-end' }}>
                    <button className="btn btn-primary btn-sm" onClick={addPapel}>Adicionar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddPapel(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddPapel(true)}>+ Adicionar Papel</button>
              </div>
            )}
          </div>

          {/* Chapas */}
          <div className="card">
            <div className="card-title">Chapas de Impressão</div>
            <div className="grid-2">
              <div className="field">
                <label>Custo por Chapa — gravada (R$)</label>
                <input type="number" step="0.01" value={draft.chapaCusto}
                  onChange={e => update({ chapaCusto: parseFloat(e.target.value) || 0 })} placeholder="18.00" />
              </div>
              <div className="field">
                <label>Setup por Chapa (R$)</label>
                <input type="number" step="0.01" value={draft.setupPorChapa}
                  onChange={e => update({ setupPorChapa: parseFloat(e.target.value) || 0 })} placeholder="12.00" />
              </div>
            </div>
            <div className="info-badge" style={{ marginTop: '4px' }}>Setup cobrado por chapa: 4 cores tira/retira = 4 chapas × R$/setup</div>
          </div>

          {/* Impostos */}
          <div className="card">
            <div className="card-title">Impostos e Taxas</div>
            <div style={{ maxWidth: '260px' }}>
              <div className="field">
                <label>% de Imposto sobre o Preço de Venda</label>
                <input type="number" step="0.1" min="0" max="100" value={draft.imposto ?? 10}
                  onChange={e => update({ imposto: parseFloat(e.target.value) || 0 })} placeholder="10.0" />
              </div>
            </div>
            <div className="info-badge" style={{ marginTop: '4px' }}>Incide sobre o preço total de venda após a margem de lucro. Padrão: 10%</div>
          </div>

          {/* Tintas */}
          <div className="card">
            <div className="card-title">Tintas</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo de Tinta</th>
                  <th style={{ textAlign: 'right' }}>Preço/kg (R$)</th>
                  <th style={{ textAlign: 'right' }}>Peso Específico (SG)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>CMYK — Escala Padrão</td>
                  <td style={{ textAlign: 'right' }}>
                    <input type="number" step="0.01" value={draft.tintaCmyk}
                      onChange={e => update({ tintaCmyk: parseFloat(e.target.value) || 0 })}
                      style={{ textAlign: 'right', width: '80px' }} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <input type="number" step="0.01" value={draft.tintaCmykSg}
                      onChange={e => update({ tintaCmykSg: parseFloat(e.target.value) || 1 })}
                      style={{ textAlign: 'right', width: '80px' }} />
                  </td>
                </tr>
                <tr>
                  <td>Pantone / Cor especial</td>
                  <td style={{ textAlign: 'right' }}>
                    <input type="number" step="0.01" value={draft.tintaPantone}
                      onChange={e => update({ tintaPantone: parseFloat(e.target.value) || 0 })}
                      style={{ textAlign: 'right', width: '80px' }} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <input type="number" step="0.01" value={draft.tintaPantoneSg}
                      onChange={e => update({ tintaPantoneSg: parseFloat(e.target.value) || 1 })}
                      style={{ textAlign: 'right', width: '80px' }} />
                  </td>
                </tr>
                <tr>
                  <td>Verniz UV</td>
                  <td style={{ textAlign: 'right' }}>
                    <input type="number" step="0.01" value={draft.tintaUv}
                      onChange={e => update({ tintaUv: parseFloat(e.target.value) || 0 })}
                      style={{ textAlign: 'right', width: '80px' }} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <input type="number" step="0.01" value={draft.tintaUvSg}
                      onChange={e => update({ tintaUvSg: parseFloat(e.target.value) || 1 })}
                      style={{ textAlign: 'right', width: '80px' }} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Custos Indiretos */}
          <div className="card">
            <div className="card-title">Custos Indiretos Mensais (Rateio)</div>
            <div className="grid-2">
              <div className="field"><label>Aluguel / Imóvel (R$/mês)</label>
                <input type="number" value={draft.ciAluguel} onChange={e => update({ ciAluguel: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="field"><label>Energia Elétrica (R$/mês)</label>
                <input type="number" value={draft.ciEnergia} onChange={e => update({ ciEnergia: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="field"><label>Manutenção Equipamentos (R$/mês)</label>
                <input type="number" value={draft.ciManutencao} onChange={e => update({ ciManutencao: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="field"><label>Outros (R$/mês)</label>
                <input type="number" value={draft.ciOutros} onChange={e => update({ ciOutros: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="field"><label>Horas Produtivas/mês</label>
                <input type="number" value={draft.ciHoras} onChange={e => update({ ciHoras: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', width: '100%' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text2)', marginBottom: '4px' }}>CUSTO IND./HORA</div>
                  <div style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: '16px' }}>
                    R$ {(draft.ciHoras > 0 ? ciTotal / draft.ciHoras : 0).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── COLUNA 2 ─────────────────────────────────────────────────────── */}
        <div>

          {/* Formatos */}
          <div className="card">
            <div className="card-title">Formatos de Impressão (folha 66×96cm)</div>
            <div className="info-badge" style={{ marginBottom: '12px' }}>
              Define como a folha 66×96 é cortada. O sistema usa esses formatos para calcular encaixe e aproveitamento de peças.
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th><th>Largura (cm)</th><th>Altura (cm)</th>
                    <th>Divisor</th><th>Observação</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {(draft.formatos || []).map((f, i) => (
                    <tr key={i}>
                      <td><input value={f.nome} onChange={e => updateFormato(i, { nome: e.target.value })} /></td>
                      <td><input type="number" step="0.1" value={f.w} onChange={e => updateFormato(i, { w: parseFloat(e.target.value) || 0 })} style={{ width: '70px' }} /></td>
                      <td><input type="number" step="0.1" value={f.h} onChange={e => updateFormato(i, { h: parseFloat(e.target.value) || 0 })} style={{ width: '70px' }} /></td>
                      <td><input value={f.div} onChange={e => updateFormato(i, { div: e.target.value })} style={{ width: '60px' }} /></td>
                      <td><input value={f.obs || ''} onChange={e => updateFormato(i, { obs: e.target.value })} /></td>
                      <td><button className="btn-icon" onClick={() => removeFormato(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showAddFormato ? (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px,1fr))', gap: '8px', alignItems: 'end' }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Nome</label>
                    <input value={newFormato.nome} onChange={e => setNewFormato(f => ({ ...f, nome: e.target.value }))} placeholder="A4" />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Largura</label>
                    <input type="number" step="0.1" value={newFormato.w} onChange={e => setNewFormato(f => ({ ...f, w: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Altura</label>
                    <input type="number" step="0.1" value={newFormato.h} onChange={e => setNewFormato(f => ({ ...f, h: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Divisor</label>
                    <input value={newFormato.div} onChange={e => setNewFormato(f => ({ ...f, div: e.target.value }))} />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Obs.</label>
                    <input value={newFormato.obs || ''} onChange={e => setNewFormato(f => ({ ...f, obs: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-end' }}>
                    <button className="btn btn-primary btn-sm" onClick={addFormato}>Adicionar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddFormato(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddFormato(true)}>+ Adicionar Formato</button>
              </div>
            )}
          </div>

          {/* Máquinas */}
          <div className="card">
            <div className="card-title">Máquinas de Impressão</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Máquina</th><th>Formato Máx.</th>
                    <th style={{ textAlign: 'right' }}>Custo/hora (R$)</th>
                    <th style={{ textAlign: 'right' }}>Vel. (fls/h)</th>
                    <th style={{ textAlign: 'right' }}>Pinça (cm)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.maquinas.map((m, i) => (
                    <tr key={i}>
                      <td><input value={m.nome} onChange={e => updateMaq(i, 'nome', e.target.value)} /></td>
                      <td><input value={m.formato} onChange={e => updateMaq(i, 'formato', e.target.value)} style={{ width: '90px' }} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" value={m.custoHora} onChange={e => updateMaq(i, 'custoHora', parseFloat(e.target.value) || 0)}
                          style={{ textAlign: 'right', width: '80px' }} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" value={m.velocidade} onChange={e => updateMaq(i, 'velocidade', parseInt(e.target.value) || 0)}
                          style={{ textAlign: 'right', width: '80px' }} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" step="0.1" value={m.pinca} onChange={e => updateMaq(i, 'pinca', parseFloat(e.target.value) || 1.2)}
                          style={{ textAlign: 'right', width: '70px' }} />
                      </td>
                      <td><button className="btn-icon" onClick={() => removeMaq(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showAddMaq ? (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: '8px', alignItems: 'end' }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Nome</label>
                    <input value={newMaq.nome} onChange={e => setNewMaq(m => ({ ...m, nome: e.target.value }))} placeholder="GTO 52" />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Formato</label>
                    <input value={newMaq.formato} onChange={e => setNewMaq(m => ({ ...m, formato: e.target.value }))} placeholder="36x52cm" />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>R$/hora</label>
                    <input type="number" value={newMaq.custoHora} onChange={e => setNewMaq(m => ({ ...m, custoHora: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Vel. (cph)</label>
                    <input type="number" value={newMaq.velocidade} onChange={e => setNewMaq(m => ({ ...m, velocidade: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Pinça (cm)</label>
                    <input type="number" step="0.1" value={newMaq.pinca} onChange={e => setNewMaq(m => ({ ...m, pinca: parseFloat(e.target.value) || 1.2 }))} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-end' }}>
                    <button className="btn btn-primary btn-sm" onClick={addMaq}>Adicionar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMaq(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMaq(true)}>+ Adicionar Máquina</button>
              </div>
            )}
          </div>

          {/* Acabamentos */}
          <div className="card">
            <div className="card-title">Tabela de Acabamentos</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Acabamento</th><th>Fórmula</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                    <th style={{ textAlign: 'right' }}>Mínimo (R$)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.acabamentos.map((a, i) => (
                    <tr key={i}>
                      <td><input value={a.nome} onChange={e => updateAcab(i, { nome: e.target.value })} /></td>
                      <td>
                        <select value={a.formula} onChange={e => updateAcab(i, { formula: e.target.value as AcabamentoConfig['formula'] })}>
                          {FORMULAS.map(f => <option key={f.val} value={f.val}>{f.label}</option>)}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {(a.formula === 'laminacao' || a.formula === 'verniz_total' || a.formula === 'verniz_local') ? (
                          <input type="number" step="0.01" value={a.valorM2 ?? ''} onChange={e => updateAcab(i, { valorM2: parseFloat(e.target.value) || 0 })} style={{ textAlign: 'right', width: '80px' }} />
                        ) : (a.formula === 'corte_vinco' || a.formula === 'por_mil') ? (
                          <input type="number" step="0.01" value={a.valorMil ?? ''} onChange={e => updateAcab(i, { valorMil: parseFloat(e.target.value) || 0 })} style={{ textAlign: 'right', width: '80px' }} />
                        ) : a.formula === 'fixo' ? (
                          <input type="number" step="0.01" value={a.valor ?? ''} onChange={e => updateAcab(i, { valor: parseFloat(e.target.value) || 0 })} style={{ textAlign: 'right', width: '80px' }} />
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" step="0.01" min="0" value={a.valorMinimo ?? 0}
                          onChange={e => updateAcab(i, { valorMinimo: parseFloat(e.target.value) || 0 })}
                          style={{ textAlign: 'right', width: '80px' }} />
                      </td>
                      <td><button className="btn-icon" onClick={() => removeAcab(i)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showAddAcab ? (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '8px', alignItems: 'end' }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Nome</label>
                    <input value={newAcab.nome} onChange={e => setNewAcab(a => ({ ...a, nome: e.target.value }))} placeholder="ex: Laminação Fosca" />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label>Fórmula</label>
                    <select value={newAcab.formula} onChange={e => setNewAcab(a => ({ ...a, formula: e.target.value as AcabamentoConfig['formula'] }))}>
                      {FORMULAS.map(f => <option key={f.val} value={f.val}>{f.label}</option>)}
                    </select>
                  </div>
                  {(newAcab.formula === 'laminacao' || newAcab.formula === 'verniz_total' || newAcab.formula === 'verniz_local') && (
                    <div className="field" style={{ margin: 0 }}>
                      <label>R$/m²</label>
                      <input type="number" step="0.01" value={newAcab.valorM2 ?? ''} onChange={e => setNewAcab(a => ({ ...a, valorM2: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  )}
                  {(newAcab.formula === 'corte_vinco' || newAcab.formula === 'por_mil') && (
                    <div className="field" style={{ margin: 0 }}>
                      <label>R$/mil</label>
                      <input type="number" step="0.01" value={newAcab.valorMil ?? ''} onChange={e => setNewAcab(a => ({ ...a, valorMil: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  )}
                  {newAcab.formula === 'fixo' && (
                    <div className="field" style={{ margin: 0 }}>
                      <label>Valor Fixo (R$)</label>
                      <input type="number" step="0.01" value={newAcab.valor ?? ''} onChange={e => setNewAcab(a => ({ ...a, valor: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  )}
                  <div className="field" style={{ margin: 0 }}>
                    <label>Mínimo (R$)</label>
                    <input type="number" step="0.01" min="0" value={newAcab.valorMinimo ?? 0} onChange={e => setNewAcab(a => ({ ...a, valorMinimo: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-end' }}>
                    <button className="btn btn-primary btn-sm" onClick={addAcab}>Adicionar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAddAcab(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '12px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddAcab(true)}>+ Adicionar Acabamento</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Largura das Colunas */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-title">Largura das Colunas — Lista de Orçamentos</div>
        <div className="info-badge">Ajuste a largura de cada coluna para exibir o texto completo. Valores em pixels (px). A alteração é aplicada imediatamente ao digitar.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '16px', marginTop: '12px' }}>
          <div className="field">
            <label>Nº / Descrição (px)</label>
            <input type="number" min="60" max="500" step="5" value={colWidths.ref}
              onChange={e => updateColWidth('ref', parseInt(e.target.value) || 120)} />
          </div>
          <div className="field">
            <label>Status (px)</label>
            <input type="number" min="60" max="300" step="5" value={colWidths.status}
              onChange={e => updateColWidth('status', parseInt(e.target.value) || 110)} />
          </div>
          <div className="field">
            <label>Data (px)</label>
            <input type="number" min="60" max="200" step="5" value={colWidths.data}
              onChange={e => updateColWidth('data', parseInt(e.target.value) || 90)} />
          </div>
          <div className="field">
            <label>Cliente (px)</label>
            <input type="number" min="80" max="500" step="5" value={colWidths.cliente}
              onChange={e => updateColWidth('cliente', parseInt(e.target.value) || 150)} />
          </div>
          <div className="field">
            <label>Valor Total (px)</label>
            <input type="number" min="80" max="300" step="5" value={colWidths.valor}
              onChange={e => updateColWidth('valor', parseInt(e.target.value) || 130)} />
          </div>
        </div>
      </div>

      {/* Google Sheets */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-title">Integração Google Sheets</div>
        <div className="info-badge">📊 Cole aqui a URL do seu Google Apps Script para sincronizar orçamentos salvos com uma planilha Google.</div>
        <div className="field">
          <label>URL do Apps Script (Web App)</label>
          <input type="text" value={sheetsUrl} onChange={e => handleSheetsUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" onClick={testarSheets}>Testar Conexão</button>
          {sheetsStatus && <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: sheetsStatus.startsWith('✓') ? '#10b981' : sheetsStatus.startsWith('✗') ? '#e11d48' : 'var(--text2)' }}>{sheetsStatus}</span>}
        </div>
      </div>

      {/* Modal Restaurar Padrão */}
      {confirmReset && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-pop" style={{ background: 'var(--surface)', borderRadius: '12px', padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Restaurar configurações padrão?</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
              Todos os papéis, máquinas, acabamentos e custos serão redefinidos. Esta ação não pode ser desfeita.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,.3)' }} onClick={handleReset}>
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
