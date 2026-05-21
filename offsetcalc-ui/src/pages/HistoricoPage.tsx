import { useState } from 'react';
import { useApp, OrcamentoEntry } from '../context/AppContext';

type Secao = 'orcamento' | 'clientes' | 'config' | 'historico' | 'dashboard';

interface Props {
  onGoTo: (s: Secao) => void;
}

// ── Gerador de OP (Ordem de Produção) ─────────────────────────────────────────

function gerarOP(entry: OrcamentoEntry): string {
  const res = entry.resultado as Record<string, unknown> | undefined;
  const now = new Date().toLocaleDateString('pt-BR');
  const jobLines: { label: string; value: string }[] = Array.isArray((res as any)?.jobLines) ? (res as any).jobLines : [];

  const n = (v: unknown, dec = 2) => typeof v === 'number' ? v.toFixed(dec) : '—';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>OP — ${entry.ref}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a2e;padding:24px;max-width:800px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:20px}
    .logo{font-size:26px;font-weight:900;color:#7c3aed;letter-spacing:-1px}.logo span{color:#06b6d4}
    .sec{margin:14px 0}
    .sec-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:10px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .lbl{font-size:10px;color:#6b5f8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
    .val{font-weight:600;font-size:13px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#f5f3fa;padding:7px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6b5f8a;border:1px solid #e5e7eb}
    td{padding:6px 8px;border:1px solid #e5e7eb}
    tr.total{background:#f3f0ff;font-weight:700;font-size:14px}
    tr.unit{background:#ecfdf5}
    .assin{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:44px}
    .assin-linha{border-top:1px solid #9ca3af;padding-top:6px;font-size:11px;color:#6b7280;text-align:center;margin-top:32px}
    @media print{body{padding:12px}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">MOHR<span>SYS</span></div>
      <div style="font-size:11px;color:#6b5f8a;margin-top:4px">Sistema de Orçamento para Gráficas Offset</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:13px;font-weight:700;color:#7c3aed">ORDEM DE PRODUÇÃO</div>
      <div style="font-size:26px;font-weight:900">${entry.ref}</div>
      <div style="font-size:11px;color:#6b5f8a">Emitida em ${now}</div>
    </div>
  </div>

  <div class="sec">
    <div class="sec-title">Dados do Job</div>
    <div class="grid2">
      <div><div class="lbl">Cliente</div><div class="val">${entry.cliente || '—'}</div></div>
      <div><div class="lbl">Data</div><div class="val">${entry.data || '—'}</div></div>
      ${entry.prazo ? `<div><div class="lbl">Prazo de Entrega</div><div class="val">${entry.prazo}</div></div>` : ''}
    </div>
    <div style="margin-top:8px;font-size:12px;color:#6b5f8a">${entry.desc}</div>
  </div>

  ${jobLines.length > 0 ? `
  <div class="sec">
    <div class="sec-title">Especificações Técnicas</div>
    <table><tbody>
      ${jobLines.map(l => `<tr><td style="color:#6b5f8a;width:42%">${l.label}</td><td><strong>${l.value}</strong></td></tr>`).join('')}
    </tbody></table>
  </div>` : ''}

  ${res ? `
  <div class="sec">
    <div class="sec-title">Composição de Custo</div>
    <table>
      <thead><tr><th>Item</th><th style="text-align:right">R$</th></tr></thead>
      <tbody>
        <tr><td>Papel</td><td style="text-align:right">${n(res.custoPapel)}</td></tr>
        <tr><td>Chapas (${n(res.numChapas, 0)} un.)</td><td style="text-align:right">${n(res.custoChapas)}</td></tr>
        <tr><td>Setup</td><td style="text-align:right">${n(res.custoSetup)}</td></tr>
        <tr><td>Tinta</td><td style="text-align:right">${n(res.custoTinta)}</td></tr>
        <tr><td>Máquina (${n(res.horasImpCobradas, 1)}h)</td><td style="text-align:right">${n(res.custoMaquina)}</td></tr>
        <tr><td>Custo Indireto</td><td style="text-align:right">${n(res.custoIndireto)}</td></tr>
        ${(res.custoAcab as number) > 0 ? `<tr><td>Acabamentos</td><td style="text-align:right">${n(res.custoAcab)}</td></tr>` : ''}
        <tr style="font-weight:700;background:#f9f8ff"><td>Subtotal</td><td style="text-align:right">${n(res.subtotal)}</td></tr>
        ${(res.urgPct as number) > 0 ? `<tr><td>Urgência (${res.urgPct}%)</td><td style="text-align:right">${n(res.adUrgencia)}</td></tr>` : ''}
        <tr><td>Margem (${res.margemPct}%)</td><td style="text-align:right">${n(res.margem)}</td></tr>
        <tr class="total"><td>TOTAL</td><td style="text-align:right;color:#7c3aed">R$ ${n(res.total)}</td></tr>
        <tr class="unit"><td style="color:#065f46">${res.unitarioLabel || 'Valor Unitário'}</td><td style="text-align:right;color:#065f46;font-weight:700">R$ ${n(res.unitario, 4)}</td></tr>
      </tbody>
    </table>
  </div>` : `
  <div class="sec">
    <div class="sec-title">Valor</div>
    <div style="font-size:26px;font-weight:900;color:#7c3aed">R$ ${n(entry.total as number)}</div>
    <div style="font-size:12px;color:#6b5f8a;margin-top:4px">Unitário: R$ ${n(entry.unitario as number, 4)}</div>
  </div>`}

  <div class="assin">
    <div><div class="assin-linha">Responsável pela Produção / Data</div></div>
    <div><div class="assin-linha">Aprovado por / Data</div></div>
  </div>
  <script>window.onload=()=>window.print()</script>
</body></html>`;
}

// ── Gerador de Proposta Comercial ─────────────────────────────────────────────

function gerarProposta(entry: OrcamentoEntry): string {
  const res = entry.resultado as Record<string, unknown> | undefined;
  const now = new Date().toLocaleDateString('pt-BR');
  const validade = new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString('pt-BR');
  const n = (v: unknown, dec = 2) => typeof v === 'number' ? v.toFixed(dec) : '—';
  const jobLines: { label: string; value: string }[] = Array.isArray((res as any)?.jobLines) ? (res as any).jobLines : [];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta — ${entry.ref}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a2e;padding:32px;max-width:800px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #7c3aed;padding-bottom:20px;margin-bottom:24px}
    .logo{font-size:26px;font-weight:900;color:#7c3aed;letter-spacing:-1px}.logo span{color:#06b6d4}
    .sec{margin:16px 0}
    .sec-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7c3aed;border-bottom:1px solid #e5e7eb;padding-bottom:4px;margin-bottom:10px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .lbl{font-size:10px;color:#6b5f8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
    .val{font-weight:600;font-size:13px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#f5f3fa;padding:8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6b5f8a;border:1px solid #e5e7eb}
    td{padding:7px 8px;border:1px solid #e5e7eb}
    .destaque{background:linear-gradient(135deg,#f3f0ff,#edf9fc);border:1px solid rgba(124,58,237,.2);border-radius:10px;padding:20px;margin:16px 0;text-align:center}
    .assin{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:48px}
    .assin-linha{border-top:1px solid #9ca3af;padding-top:6px;font-size:11px;color:#6b7280;text-align:center;margin-top:36px}
    @media print{body{padding:16px}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">MOHR<span>SYS</span></div>
      <div style="font-size:11px;color:#6b5f8a;margin-top:4px">Soluções em Impressão Offset</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:13px;font-weight:700;color:#7c3aed">PROPOSTA COMERCIAL</div>
      <div style="font-size:22px;font-weight:900">${entry.ref}</div>
      <div style="font-size:11px;color:#6b5f8a">${now} · Válida até ${validade}</div>
    </div>
  </div>

  <div class="sec">
    <div class="sec-title">Destinatário</div>
    <div class="grid2">
      <div><div class="lbl">Cliente</div><div class="val">${entry.cliente || '—'}</div></div>
      <div><div class="lbl">Data da Proposta</div><div class="val">${now}</div></div>
      ${entry.prazo ? `<div><div class="lbl">Prazo Estimado de Entrega</div><div class="val">${entry.prazo}</div></div>` : ''}
    </div>
  </div>

  <div class="sec">
    <div class="sec-title">Especificações do Material</div>
    <div style="font-size:12px;color:#374151;margin-bottom:8px">${entry.desc}</div>
    ${jobLines.length > 0 ? `
    <table><tbody>
      ${jobLines.filter(l => !l.label.includes('Custo') && !l.label.includes('custo')).map(l => `<tr><td style="color:#6b5f8a;width:42%">${l.label}</td><td><strong>${l.value}</strong></td></tr>`).join('')}
    </tbody></table>` : ''}
  </div>

  <div class="destaque">
    <div style="font-size:11px;color:#6b5f8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Valor Total da Proposta</div>
    <div style="font-size:40px;font-weight:900;color:#7c3aed">R$ ${n(res?.total ?? entry.total as number)}</div>
    <div style="font-size:14px;color:#374151;margin-top:6px">
      ${(res?.unitarioLabel as string) || 'Valor Unitário'}:
      <strong style="color:#065f46">R$ ${n(res?.unitario ?? entry.unitario as number, 4)}</strong>
    </div>
    ${res && (res.tiragem as number) ? `<div style="font-size:12px;color:#6b5f8a;margin-top:4px">Tiragem: ${(res.tiragem as number).toLocaleString('pt-BR')} unidades</div>` : ''}
  </div>

  <div class="sec">
    <div class="sec-title">Condições Comerciais</div>
    <table><tbody>
      <tr><td style="color:#6b5f8a;width:42%">Validade da proposta</td><td>30 dias a partir de ${now}</td></tr>
      <tr><td style="color:#6b5f8a">Forma de pagamento</td><td>A combinar</td></tr>
      <tr><td style="color:#6b5f8a">Impostos</td><td>Inclusos no valor apresentado</td></tr>
      <tr><td style="color:#6b5f8a">Entrega</td><td>${entry.prazo ? `Prazo estimado: ${entry.prazo}` : 'A combinar após aprovação'}</td></tr>
    </tbody></table>
  </div>

  <div class="assin">
    <div><div class="assin-linha">Aprovado pelo Cliente / Data</div></div>
    <div><div class="assin-linha">Responsável Comercial / Data</div></div>
  </div>
  <script>window.onload=()=>window.print()</script>
</body></html>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  return s === 'aceito' ? '#10b981' : s === 'enviado' ? '#f59e0b' : s === 'recusado' ? '#ef4444' : '#6b7280';
}
function statusLabel(s: string) {
  return ({ rascunho: 'Rascunho', enviado: 'Enviado', aceito: 'Aceito', recusado: 'Recusado' } as Record<string, string>)[s] ?? s;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function HistoricoPage({ onGoTo }: Props) {
  const { historico, toggleAprovado, removeOrcamento, addOrcamento, updateOrcamento, toast } = useApp();

  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');

  // Edição de status
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('rascunho');

  // Confirmação de exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = historico.filter(h => {
    const q = search.toLowerCase();
    const matchSearch = !q || h.ref.toLowerCase().includes(q) || h.cliente.toLowerCase().includes(q);
    const s = (h.status as string) || (h.aprovado ? 'aceito' : 'rascunho');
    const matchFiltro = filtro === 'todos' || filtro === s ||
      (filtro === 'aprovados' && h.aprovado) || (filtro === 'pendentes' && !h.aprovado);
    return matchSearch && matchFiltro;
  });

  const abrirOP = (e: OrcamentoEntry) => {
    const w = window.open('', '_blank', 'width=820,height=920');
    if (w) { w.document.write(gerarOP(e)); w.document.close(); }
  };

  const abrirProposta = (e: OrcamentoEntry) => {
    const w = window.open('', '_blank', 'width=820,height=920');
    if (w) { w.document.write(gerarProposta(e)); w.document.close(); }
  };

  const duplicar = (e: OrcamentoEntry) => {
    const { id: _id, ts: _ts, aprovado: _ap, ref, ...rest } = e;
    const novaRef = `${ref}-COPIA`;
    addOrcamento({ ...rest, ref: novaRef, status: 'rascunho' } as Parameters<typeof addOrcamento>[0]);
    toast(`Duplicado como ${novaRef}`);
  };

  const salvarStatus = () => {
    if (!editId) return;
    updateOrcamento(editId, { status: editStatus, aprovado: editStatus === 'aceito' });
    setEditId(null);
    toast('Status atualizado!');
  };

  // Totais
  const totalOrc = historico.length;
  const aprovados = historico.filter(h => h.aprovado).length;
  const valorTotal = historico.filter(h => h.aprovado).reduce((sum, h) => sum + ((h.total as number) || 0), 0);

  return (
    <div className="section active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
          Histórico de <span style={{ color: 'var(--accent)' }}>Orçamentos</span>
        </h2>
        <button className="btn btn-primary" onClick={() => onGoTo('orcamento')}>+ Novo Orçamento</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total de Orçamentos</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{totalOrc}</div>
        </div>
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Aprovados</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--mono)' }}>{aprovados}</div>
        </div>
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Valor Aprovado</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#06b6d4', fontFamily: 'var(--mono)' }}>
            R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Taxa de Conversão</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--mono)' }}>
            {totalOrc > 0 ? ((aprovados / totalOrc) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '12px' }}>
        <div className="grid-2">
          <div className="field" style={{ margin: 0 }}>
            <label>Pesquisar</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Número ou cliente..." />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Filtrar por Status</label>
            <select value={filtro} onChange={e => setFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="rascunho">Rascunho</option>
              <option value="enviado">Enviado</option>
              <option value="aceito">Aceito</option>
              <option value="recusado">Recusado</option>
              <option value="aprovados">Aprovados</option>
              <option value="pendentes">Pendentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
          {search || filtro !== 'todos' ? 'Nenhum orçamento encontrado.' : 'Nenhum orçamento salvo ainda.'}
          <div style={{ marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={() => onGoTo('orcamento')}>Criar Primeiro Orçamento</button>
          </div>
        </div>
      ) : (
        filtered.map(h => {
          const status = (h.status as string) || (h.aprovado ? 'aceito' : 'rascunho');
          const isEditing = editId === h.id;
          return (
            <div key={h.id} className="card" style={{ marginBottom: '10px', borderLeft: `3px solid ${statusColor(status)}` }}>
              {/* Linha principal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{h.ref}</span>
                    <span style={{
                      background: statusColor(status), color: '#fff',
                      padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700
                    }}>{statusLabel(status)}</span>
                    {h.aprovado && <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>✓ Aprovado</span>}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{h.cliente || 'Cliente não informado'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{h.desc}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                    {h.data} {h.prazo ? `· Prazo: ${h.prazo}` : ''}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                    R$ {((h.total as number) || 0).toFixed(2)}
                  </div>
                  {(h.unitario as number) > 0 && (
                    <div style={{ fontSize: '11px', color: '#10b981', fontFamily: 'var(--mono)' }}>
                      unit. R$ {(h.unitario as number).toFixed(4)}
                    </div>
                  )}
                </div>
              </div>

              {/* Edição de status */}
              {isEditing && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--surface2)', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>Alterar status:</span>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px' }}>
                    <option value="rascunho">Rascunho</option>
                    <option value="enviado">Enviado</option>
                    <option value="aceito">Aceito</option>
                    <option value="recusado">Recusado</option>
                  </select>
                  <button className="btn btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={salvarStatus}>Salvar</button>
                  <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => setEditId(null)}>Cancelar</button>
                </div>
              )}

              {/* Ações */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => abrirOP(h)}>
                  OP
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => abrirProposta(h)}>
                  Proposta PDF
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}
                  onClick={() => { setEditId(h.id); setEditStatus(status); }}>
                  Status
                </button>
                <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => duplicar(h)}>
                  Duplicar
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '5px 10px', color: h.aprovado ? '#10b981' : 'var(--text)', borderColor: h.aprovado ? '#10b981' : undefined }}
                  onClick={() => { toggleAprovado(h.id); toast(h.aprovado ? 'Aprovação removida.' : 'Orçamento aprovado!'); }}>
                  {h.aprovado ? '✓ Aprovado' : 'Aprovar'}
                </button>
                <button className="btn-icon" style={{ color: '#ef4444', marginLeft: 'auto' }}
                  onClick={() => setDeleteId(h.id)} title="Excluir">🗑</button>
              </div>
            </div>
          );
        })
      )}

      {/* Modal de exclusão */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>🗑️</div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Excluir orçamento?</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
              <strong>{historico.find(h => h.id === deleteId)?.ref}</strong><br />
              Esta ação não pode ser desfeita.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,.3)' }}
                onClick={() => { removeOrcamento(deleteId); setDeleteId(null); toast('Orçamento excluído.'); }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
