import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  AppConfig, PapelConfig, MaquinaConfig, AcabamentoConfig, FormatoConfig,
} from '../utils/calculator';

type Tab = 'papeis' | 'maquinas' | 'acabamentos' | 'chapas' | 'ci' | 'formatos';

const FORMULAS = [
  { val: 'laminacao',   label: 'Laminação' },
  { val: 'verniz_total',label: 'Verniz Total' },
  { val: 'verniz_local',label: 'Verniz Local' },
  { val: 'corte_vinco', label: 'Corte e Vinco' },
  { val: 'por_mil',     label: 'Por Mil' },
  { val: 'fixo',        label: 'Valor Fixo' },
] as const;

const PAPEL_FORMATOS = ['66x96cm', '52x74cm', '36x52cm', '46x64cm', '48x66cm'];

const emptyPapel = (): PapelConfig => ({ tipo: '', gramatura: '', formato: '66x96cm', precoPorKg: 12, fatorAbs: 1.0 });
const emptyMaquina = (): MaquinaConfig => ({ nome: '', formato: '36x52cm', custoHora: 90, velocidade: 5000, pinca: 1.2 });
const emptyAcab = (): AcabamentoConfig => ({ nome: '', formula: 'laminacao', valorM2: 1.80, valorMinimo: 0 });
const emptyFormato = (): FormatoConfig => ({ nome: '', w: 33, h: 48, div: '1/4', obs: '' });

export default function ConfigPage() {
  const { config, salvarConfig, resetConfig } = useApp();
  const [tab, setTab] = useState<Tab>('papeis');
  const [draft, setDraft] = useState<AppConfig>({ ...config });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Novo papel form
  const [newPapel, setNewPapel] = useState<PapelConfig>(emptyPapel());
  // Nova máquina form
  const [newMaq, setNewMaq] = useState<MaquinaConfig>(emptyMaquina());
  // Novo acabamento form
  const [newAcab, setNewAcab] = useState<AcabamentoConfig>(emptyAcab());
  // Novo formato form
  const [newFormato, setNewFormato] = useState<FormatoConfig>(emptyFormato());

  useEffect(() => { setDraft({ ...config }); setDirty(false); }, [config]);

  const update = (patch: Partial<AppConfig>) => {
    setDraft(prev => {
      const next = { ...prev, ...patch };
      // recalcula ciPorHora automaticamente
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
  };

  const handleReset = () => {
    resetConfig();
    setConfirmReset(false);
    setDirty(false);
  };

  // ── Papéis ────────────────────────────────────────────────────────────────
  const updatePapel = (i: number, field: keyof PapelConfig, val: string | number) => {
    const papeis = draft.papeis.map((p, idx) => idx === i ? { ...p, [field]: val } : p);
    update({ papeis });
  };
  const removePapel = (i: number) => update({ papeis: draft.papeis.filter((_, idx) => idx !== i) });
  const addPapel = () => {
    if (!newPapel.tipo || !newPapel.gramatura) return;
    update({ papeis: [...draft.papeis, { ...newPapel }] });
    setNewPapel(emptyPapel());
  };

  // ── Máquinas ──────────────────────────────────────────────────────────────
  const updateMaq = (i: number, field: keyof MaquinaConfig, val: string | number) => {
    const maquinas = draft.maquinas.map((m, idx) => idx === i ? { ...m, [field]: val } : m);
    update({ maquinas });
  };
  const removeMaq = (i: number) => update({ maquinas: draft.maquinas.filter((_, idx) => idx !== i) });
  const addMaq = () => {
    if (!newMaq.nome) return;
    update({ maquinas: [...draft.maquinas, { ...newMaq }] });
    setNewMaq(emptyMaquina());
  };

  // ── Acabamentos ───────────────────────────────────────────────────────────
  const updateAcab = (i: number, patch: Partial<AcabamentoConfig>) => {
    const acabamentos = draft.acabamentos.map((a, idx) => idx === i ? { ...a, ...patch } : a);
    update({ acabamentos });
  };
  const removeAcab = (i: number) => update({ acabamentos: draft.acabamentos.filter((_, idx) => idx !== i) });
  const addAcab = () => {
    if (!newAcab.nome) return;
    update({ acabamentos: [...draft.acabamentos, { ...newAcab }] });
    setNewAcab(emptyAcab());
  };

  // ── Formatos ──────────────────────────────────────────────────────────────
  const updateFormato = (i: number, patch: Partial<FormatoConfig>) => {
    const formatos = (draft.formatos || []).map((f, idx) => idx === i ? { ...f, ...patch } : f);
    update({ formatos });
  };
  const removeFormato = (i: number) => update({ formatos: (draft.formatos || []).filter((_, idx) => idx !== i) });
  const addFormato = () => {
    if (!newFormato.nome) return;
    update({ formatos: [...(draft.formatos || []), { ...newFormato }] });
    setNewFormato(emptyFormato());
  };

  // ── CI derivado ───────────────────────────────────────────────────────────
  const ciTotal = (draft.ciAluguel || 0) + (draft.ciEnergia || 0) + (draft.ciManutencao || 0) + (draft.ciOutros || 0);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'papeis',    label: 'Papéis'           },
    { id: 'maquinas',  label: 'Máquinas'          },
    { id: 'acabamentos', label: 'Acabamentos'     },
    { id: 'chapas',    label: 'Chapas & Tintas'   },
    { id: 'ci',        label: 'Custos Indiretos'  },
    { id: 'formatos',  label: 'Formatos'          },
  ];

  return (
    <div className="section active">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
          Configurações <span style={{ color: 'var(--accent)' }}>do Sistema</span>
        </h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setConfirmReset(true)}>
            Restaurar Padrão
          </button>
          <button className="btn btn-primary" onClick={handleSalvar} disabled={!dirty || saving}
            style={{ opacity: dirty ? 1 : 0.5, minWidth: '120px' }}>
            {saving ? 'Salvando...' : dirty ? 'Salvar Alterações' : 'Salvo'}
          </button>
        </div>
      </div>

      {dirty && (
        <div className="info-badge" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)', color: '#d97706', marginBottom: '12px' }}>
          Há alterações não salvas — clique em "Salvar Alterações" para confirmar.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid var(--border)', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: '12px',
              fontWeight: 700, fontFamily: 'var(--display)', letterSpacing: '0.5px', textTransform: 'uppercase',
              borderRadius: '6px 6px 0 0', marginBottom: '-2px',
              background: tab === t.id ? 'var(--accent)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text2)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: PAPÉIS ══════════════════════════════════════════════════════ */}
      {tab === 'papeis' && (
        <div>
          <div className="card">
            <div className="card-title">Tabela de Papéis ({draft.papeis.length})</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Gramatura</th>
                    <th>Formato</th>
                    <th style={{ textAlign: 'right' }}>R$/kg</th>
                    <th style={{ textAlign: 'right' }}>Fator Abs.</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.papeis.map((p, i) => (
                    <tr key={i}>
                      <td>
                        <input value={p.tipo} onChange={e => updatePapel(i, 'tipo', e.target.value)} />
                      </td>
                      <td>
                        <input value={p.gramatura} onChange={e => updatePapel(i, 'gramatura', e.target.value)} style={{ width: '70px' }} />
                      </td>
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
                      <td>
                        <button className="btn-icon" onClick={() => removePapel(i)} title="Remover">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adicionar papel */}
          <div className="card">
            <div className="card-title">Adicionar Papel</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Tipo</label>
                <input value={newPapel.tipo} onChange={e => setNewPapel(p => ({ ...p, tipo: e.target.value }))}
                  placeholder="ex: Couchê" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Gramatura</label>
                <input value={newPapel.gramatura} onChange={e => setNewPapel(p => ({ ...p, gramatura: e.target.value }))}
                  placeholder="ex: 115g" />
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
              <button className="btn btn-primary" onClick={addPapel} style={{ alignSelf: 'flex-end', marginBottom: '1px' }}>
                + Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: MÁQUINAS ════════════════════════════════════════════════════ */}
      {tab === 'maquinas' && (
        <div>
          <div className="card">
            <div className="card-title">Máquinas Cadastradas ({draft.maquinas.length})</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Formato Útil</th>
                    <th style={{ textAlign: 'right' }}>R$/hora</th>
                    <th style={{ textAlign: 'right' }}>Vel. (cph)</th>
                    <th style={{ textAlign: 'right' }}>Pinça (cm)</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.maquinas.map((m, i) => (
                    <tr key={i}>
                      <td>
                        <input value={m.nome} onChange={e => updateMaq(i, 'nome', e.target.value)} />
                      </td>
                      <td>
                        <input value={m.formato} onChange={e => updateMaq(i, 'formato', e.target.value)}
                          placeholder="ex: 36x52cm" style={{ width: '90px' }} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" value={m.custoHora}
                          onChange={e => updateMaq(i, 'custoHora', parseFloat(e.target.value) || 0)}
                          style={{ textAlign: 'right', width: '80px' }} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" value={m.velocidade}
                          onChange={e => updateMaq(i, 'velocidade', parseInt(e.target.value) || 0)}
                          style={{ textAlign: 'right', width: '80px' }} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" step="0.1" value={m.pinca}
                          onChange={e => updateMaq(i, 'pinca', parseFloat(e.target.value) || 1.2)}
                          style={{ textAlign: 'right', width: '70px' }} />
                      </td>
                      <td>
                        <button className="btn-icon" onClick={() => removeMaq(i)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Adicionar Máquina</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Nome</label>
                <input value={newMaq.nome} onChange={e => setNewMaq(m => ({ ...m, nome: e.target.value }))}
                  placeholder="ex: GTO 52 (4 cores)" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Formato Útil</label>
                <input value={newMaq.formato} onChange={e => setNewMaq(m => ({ ...m, formato: e.target.value }))}
                  placeholder="36x52cm" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>R$/hora</label>
                <input type="number" value={newMaq.custoHora}
                  onChange={e => setNewMaq(m => ({ ...m, custoHora: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Vel. (cph)</label>
                <input type="number" value={newMaq.velocidade}
                  onChange={e => setNewMaq(m => ({ ...m, velocidade: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Pinça (cm)</label>
                <input type="number" step="0.1" value={newMaq.pinca}
                  onChange={e => setNewMaq(m => ({ ...m, pinca: parseFloat(e.target.value) || 1.2 }))} />
              </div>
              <button className="btn btn-primary" onClick={addMaq} style={{ alignSelf: 'flex-end', marginBottom: '1px' }}>
                + Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: ACABAMENTOS ═════════════════════════════════════════════════ */}
      {tab === 'acabamentos' && (
        <div>
          <div className="card">
            <div className="card-title">Acabamentos Cadastrados ({draft.acabamentos.length})</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Fórmula</th>
                    <th style={{ textAlign: 'right' }}>R$/m²</th>
                    <th style={{ textAlign: 'right' }}>R$/mil</th>
                    <th style={{ textAlign: 'right' }}>Setup</th>
                    <th style={{ textAlign: 'right' }}>%Área</th>
                    <th style={{ textAlign: 'right' }}>Valor Fixo</th>
                    <th style={{ textAlign: 'right' }}>Mínimo (R$)</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.acabamentos.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <input value={a.nome} onChange={e => updateAcab(i, { nome: e.target.value })} />
                      </td>
                      <td>
                        <select value={a.formula} onChange={e => updateAcab(i, { formula: e.target.value as AcabamentoConfig['formula'] })}>
                          {FORMULAS.map(f => <option key={f.val} value={f.val}>{f.label}</option>)}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {(a.formula === 'laminacao' || a.formula === 'verniz_total' || a.formula === 'verniz_local') ? (
                          <input type="number" step="0.01" value={a.valorM2 ?? ''}
                            onChange={e => updateAcab(i, { valorM2: parseFloat(e.target.value) || 0 })}
                            style={{ textAlign: 'right', width: '70px' }} />
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {(a.formula === 'corte_vinco' || a.formula === 'por_mil') ? (
                          <input type="number" step="0.01" value={a.valorMil ?? ''}
                            onChange={e => updateAcab(i, { valorMil: parseFloat(e.target.value) || 0 })}
                            style={{ textAlign: 'right', width: '70px' }} />
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {a.formula === 'corte_vinco' ? (
                          <input type="number" value={a.setup ?? ''}
                            onChange={e => updateAcab(i, { setup: parseFloat(e.target.value) || 0 })}
                            style={{ textAlign: 'right', width: '70px' }} />
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {a.formula === 'verniz_local' ? (
                          <input type="number" min="1" max="100" value={a.percArea ?? ''}
                            onChange={e => updateAcab(i, { percArea: parseFloat(e.target.value) || 30 })}
                            style={{ textAlign: 'right', width: '60px' }} />
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {a.formula === 'fixo' ? (
                          <input type="number" step="0.01" value={a.valor ?? ''}
                            onChange={e => updateAcab(i, { valor: parseFloat(e.target.value) || 0 })}
                            style={{ textAlign: 'right', width: '80px' }} />
                        ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input type="number" step="0.01" min="0" value={a.valorMinimo ?? 0}
                          onChange={e => updateAcab(i, { valorMinimo: parseFloat(e.target.value) || 0 })}
                          style={{ textAlign: 'right', width: '80px' }} />
                      </td>
                      <td>
                        <button className="btn-icon" onClick={() => removeAcab(i)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Adicionar Acabamento</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Nome</label>
                <input value={newAcab.nome} onChange={e => setNewAcab(a => ({ ...a, nome: e.target.value }))}
                  placeholder="ex: Laminação Fosca" />
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
                  <input type="number" step="0.01" value={newAcab.valorM2 ?? ''}
                    onChange={e => setNewAcab(a => ({ ...a, valorM2: parseFloat(e.target.value) || 0 }))} />
                </div>
              )}
              {(newAcab.formula === 'corte_vinco' || newAcab.formula === 'por_mil') && (
                <div className="field" style={{ margin: 0 }}>
                  <label>R$/mil</label>
                  <input type="number" step="0.01" value={newAcab.valorMil ?? ''}
                    onChange={e => setNewAcab(a => ({ ...a, valorMil: parseFloat(e.target.value) || 0 }))} />
                </div>
              )}
              {newAcab.formula === 'corte_vinco' && (
                <div className="field" style={{ margin: 0 }}>
                  <label>Setup (R$)</label>
                  <input type="number" value={newAcab.setup ?? ''}
                    onChange={e => setNewAcab(a => ({ ...a, setup: parseFloat(e.target.value) || 0 }))} />
                </div>
              )}
              {newAcab.formula === 'verniz_local' && (
                <div className="field" style={{ margin: 0 }}>
                  <label>% Área</label>
                  <input type="number" min="1" max="100" value={newAcab.percArea ?? ''}
                    onChange={e => setNewAcab(a => ({ ...a, percArea: parseFloat(e.target.value) || 30 }))} />
                </div>
              )}
              {newAcab.formula === 'fixo' && (
                <div className="field" style={{ margin: 0 }}>
                  <label>Valor Fixo (R$)</label>
                  <input type="number" step="0.01" value={newAcab.valor ?? ''}
                    onChange={e => setNewAcab(a => ({ ...a, valor: parseFloat(e.target.value) || 0 }))} />
                </div>
              )}
              <div className="field" style={{ margin: 0 }}>
                <label>Mínimo (R$)</label>
                <input type="number" step="0.01" min="0" value={newAcab.valorMinimo ?? 0}
                  onChange={e => setNewAcab(a => ({ ...a, valorMinimo: parseFloat(e.target.value) || 0 }))} />
              </div>
              <button className="btn btn-primary" onClick={addAcab} style={{ alignSelf: 'flex-end', marginBottom: '1px' }}>
                + Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: CHAPAS & TINTAS ═════════════════════════════════════════════ */}
      {tab === 'chapas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

          <div className="card">
            <div className="card-title">Chapas de Impressão</div>
            <div className="field">
              <label>Custo por Chapa (R$)</label>
              <input type="number" step="0.01" value={draft.chapaCusto}
                onChange={e => update({ chapaCusto: parseFloat(e.target.value) || 0 })} />
              <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '3px' }}>
                Custo material da chapa offset (CTP ou convencional)
              </div>
            </div>
            <div className="field">
              <label>Setup por Chapa (R$)</label>
              <input type="number" step="0.01" value={draft.setupPorChapa}
                onChange={e => update({ setupPorChapa: parseFloat(e.target.value) || 0 })} />
              <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '3px' }}>
                Custo de mão-de-obra de montagem por chapa
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Impostos</div>
            <div className="field">
              <label>Alíquota de Imposto (%)</label>
              <input type="number" step="0.1" min="0" max="100" value={draft.imposto ?? 10}
                onChange={e => update({ imposto: parseFloat(e.target.value) || 0 })} />
              <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '3px' }}>
                Exibido como linha separada no resultado do orçamento. Use 0 para omitir.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Tinta CMYK</div>
            <div className="grid-2">
              <div className="field">
                <label>Preço (R$/kg)</label>
                <input type="number" step="0.01" value={draft.tintaCmyk}
                  onChange={e => update({ tintaCmyk: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="field">
                <label>Densidade (sg)</label>
                <input type="number" step="0.01" value={draft.tintaCmykSg}
                  onChange={e => update({ tintaCmykSg: parseFloat(e.target.value) || 1 })} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Tinta Pantone</div>
            <div className="grid-2">
              <div className="field">
                <label>Preço (R$/kg)</label>
                <input type="number" step="0.01" value={draft.tintaPantone}
                  onChange={e => update({ tintaPantone: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="field">
                <label>Densidade (sg)</label>
                <input type="number" step="0.01" value={draft.tintaPantoneSg}
                  onChange={e => update({ tintaPantoneSg: parseFloat(e.target.value) || 1 })} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Tinta UV</div>
            <div className="grid-2">
              <div className="field">
                <label>Preço (R$/kg)</label>
                <input type="number" step="0.01" value={draft.tintaUv}
                  onChange={e => update({ tintaUv: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="field">
                <label>Densidade (sg)</label>
                <input type="number" step="0.01" value={draft.tintaUvSg}
                  onChange={e => update({ tintaUvSg: parseFloat(e.target.value) || 1 })} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: CUSTOS INDIRETOS ════════════════════════════════════════════ */}
      {tab === 'ci' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div className="card">
            <div className="card-title">Despesas Mensais Fixas</div>
            <div className="field">
              <label>Aluguel (R$/mês)</label>
              <input type="number" step="1" value={draft.ciAluguel}
                onChange={e => update({ ciAluguel: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="field">
              <label>Energia Elétrica (R$/mês)</label>
              <input type="number" step="1" value={draft.ciEnergia}
                onChange={e => update({ ciEnergia: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="field">
              <label>Manutenção (R$/mês)</label>
              <input type="number" step="1" value={draft.ciManutencao}
                onChange={e => update({ ciManutencao: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="field">
              <label>Outros (R$/mês)</label>
              <input type="number" step="1" value={draft.ciOutros}
                onChange={e => update({ ciOutros: parseFloat(e.target.value) || 0 })} />
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
              <span>Total Mensal</span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>R$ {ciTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Horas Produtivas & Taxa</div>
            <div className="field">
              <label>Horas Produtivas por Mês</label>
              <input type="number" step="1" value={draft.ciHoras}
                onChange={e => update({ ciHoras: parseInt(e.target.value) || 1 })} />
              <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '3px' }}>
                Geralmente 176h (22 dias × 8h) ou conforme turno
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg,#f3f0ff,#edf9fc)', border: '1px solid rgba(124,58,237,.2)', borderRadius: '10px', padding: '20px', marginTop: '8px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Taxa de Custo Indireto por Hora
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                R$ {draft.ciPorHora.toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '6px' }}>
                = R$ {ciTotal.toFixed(2)} ÷ {draft.ciHoras}h
              </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text2)', lineHeight: '1.6', padding: '10px', background: 'var(--surface2)', borderRadius: '6px' }}>
              Esta taxa é aplicada a cada hora de máquina cobrada no orçamento como custo de estrutura da empresa.
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: FORMATOS ════════════════════════════════════════════════════ */}
      {tab === 'formatos' && (
        <div>
          <div className="info-badge" style={{ marginBottom: '12px' }}>
            Estes são os formatos de impressão disponíveis na folha 66×96cm. O cálculo usa apenas os formatos cabíveis na máquina selecionada.
          </div>
          <div className="card">
            <div className="card-title">Formatos de Impressão ({(draft.formatos || []).length})</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th style={{ textAlign: 'right' }}>Larg. (cm)</th>
                    <th style={{ textAlign: 'right' }}>Alt. (cm)</th>
                    <th>Divisão</th>
                    <th>Observação</th>
                    <th style={{ textAlign: 'right' }}>Peças/folha</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(draft.formatos || []).map((f, i) => {
                    const pecas = Math.round((66 * 96) / (f.w * f.h));
                    return (
                      <tr key={i}>
                        <td>
                          <input value={f.nome} onChange={e => updateFormato(i, { nome: e.target.value })} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input type="number" step="0.1" min="1" value={f.w}
                            onChange={e => updateFormato(i, { w: parseFloat(e.target.value) || 1 })}
                            style={{ textAlign: 'right', width: '70px' }} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input type="number" step="0.1" min="1" value={f.h}
                            onChange={e => updateFormato(i, { h: parseFloat(e.target.value) || 1 })}
                            style={{ textAlign: 'right', width: '70px' }} />
                        </td>
                        <td>
                          <input value={f.div || ''} onChange={e => updateFormato(i, { div: e.target.value })}
                            placeholder="ex: 1/4" style={{ width: '60px' }} />
                        </td>
                        <td>
                          <input value={f.obs || ''} onChange={e => updateFormato(i, { obs: e.target.value })}
                            placeholder="Descrição" />
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                          {pecas}×
                        </td>
                        <td>
                          <button className="btn-icon" onClick={() => removeFormato(i)} title="Remover">✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Adicionar Formato</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Nome</label>
                <input value={newFormato.nome} onChange={e => setNewFormato(f => ({ ...f, nome: e.target.value }))}
                  placeholder="ex: Formato 4" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Larg. (cm)</label>
                <input type="number" step="0.1" min="1" value={newFormato.w}
                  onChange={e => setNewFormato(f => ({ ...f, w: parseFloat(e.target.value) || 1 }))} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Alt. (cm)</label>
                <input type="number" step="0.1" min="1" value={newFormato.h}
                  onChange={e => setNewFormato(f => ({ ...f, h: parseFloat(e.target.value) || 1 }))} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Divisão</label>
                <input value={newFormato.div} onChange={e => setNewFormato(f => ({ ...f, div: e.target.value }))}
                  placeholder="1/4" style={{ width: '70px' }} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Observação</label>
                <input value={newFormato.obs || ''} onChange={e => setNewFormato(f => ({ ...f, obs: e.target.value }))}
                  placeholder="Descrição opcional" />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ color: 'var(--text3)' }}>Peças/folha</label>
                <div style={{ padding: '8px 10px', background: 'var(--surface2)', borderRadius: '6px', fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--accent2)' }}>
                  {newFormato.w > 0 && newFormato.h > 0 ? Math.round((66 * 96) / (newFormato.w * newFormato.h)) : '—'}×
                </div>
              </div>
              <button className="btn btn-primary" onClick={addFormato} style={{ alignSelf: 'flex-end', marginBottom: '1px' }}>
                + Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de reset */}
      {confirmReset && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Restaurar Configuração Padrão?</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '24px', lineHeight: '1.6' }}>
              Todos os papéis, máquinas, acabamentos e parâmetros serão revertidos para os valores padrão do sistema.
              Esta ação não pode ser desfeita.
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleReset}
                style={{ background: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,.3)' }}>
                Sim, restaurar padrão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
