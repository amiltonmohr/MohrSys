import { useState, useEffect, useRef } from 'react';
import { useApp, OrcamentoEntry } from '../context/AppContext';

type Secao = 'orcamento' | 'clientes' | 'config' | 'historico' | 'dashboard';

interface Props {
  onGoTo: (s: Secao) => void;
  onEditar: (entry: OrcamentoEntry) => void;
}

// ── Gerador de OP ─────────────────────────────────────────────────────────────

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

function gerarPropostaHTML(entry: OrcamentoEntry, telCliente?: string): string {
  const res = entry.resultado as Record<string, unknown> | undefined;
  const now = new Date().toLocaleDateString('pt-BR');
  const validade = new Date(Date.now() + 30 * 24 * 3600 * 1000).toLocaleDateString('pt-BR');
  const brl = (v: unknown, dec = 2) => typeof v === 'number' ? `R$ ${v.toFixed(dec).replace('.', ',')}` : '—';
  const jobLines: { label: string; value: string }[] = Array.isArray((res as any)?.jobLines) ? (res as any).jobLines : [];

  const comp: { tiragem?: number; tiраgemInput?: number; total: number; unitario: number }[] =
    Array.isArray(entry.tiragensComparativo) && (entry.tiragensComparativo as unknown[]).length > 0
      ? entry.tiragensComparativo as { total: number; unitario: number }[]
      : [{ tiраgemInput: (res?.tiраgemInput ?? res?.tiragem ?? entry.qty ?? 0) as number, total: (entry.total as number) || 0, unitario: (entry.unitario as number) || 0 }];

  const blocoAtivo = !!(res?.blocoAtivo);
  const revistaAtivo = !!(res?.revistaAtivo);
  const qtyLabel = blocoAtivo ? 'blocos' : revistaAtivo ? 'exemplares' : 'unidades';
  const unitLabel = blocoAtivo ? 'por Bloco' : revistaAtivo ? 'por Exemplar' : 'Unitário';

  let qtySection = '';
  if (comp.length > 1) {
    const bestUnit = Math.min(...comp.map(r => r.unitario || Infinity));
    const rows = comp.map(r => {
      const qty = ((r as any).tiраgemInput ?? r.tiragem ?? 0);
      const best = Math.abs((r.unitario || 0) - bestUnit) < 0.0001 && bestUnit < Infinity;
      return `<tr${best ? ' class="best"' : ''}>
        <td>${qty.toLocaleString('pt-BR')} ${qtyLabel}</td>
        <td class="num">${brl(r.total)}</td>
        <td class="num best-unit">${brl(r.unitario, 4)}${best ? ' ✓' : ''}</td>
      </tr>`;
    }).join('');
    qtySection = `<h2>Opções de Quantidade</h2>
      <table>
        <thead><tr>
          <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #7c3aed;font-size:11px;text-transform:uppercase;color:#6b5f8a">Quantidade</th>
          <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #7c3aed;font-size:11px;text-transform:uppercase;color:#6b5f8a">Preço Total</th>
          <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #7c3aed;font-size:11px;text-transform:uppercase;color:#6b5f8a">Valor ${unitLabel}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="font-size:10px;color:#b0a8c8;margin-top:6px">✓ melhor custo unitário</div>`;
  } else {
    const r = comp[0];
    qtySection = `<div class="total-box">
      <div>
        <div class="lbl">Total de Venda</div>
        <div class="tv">${brl(r.total)}</div>
        <div style="font-size:11px;color:#6b5f8a;margin-top:4px">${(((r as any).tiраgemInput ?? r.tiragem) || 0).toLocaleString('pt-BR')} ${qtyLabel}</div>
      </div>
      <div style="text-align:right">
        <div class="lbl">Valor ${unitLabel}</div>
        <div class="uv">${brl(r.unitario, 4)}</div>
      </div>
    </div>`;
  }

  const tel = telCliente?.replace(/\D/g, '');
  const waMsg = encodeURIComponent(
    `Olá ${entry.cliente || ''}, segue proposta Nº ${entry.ref}:\n\n${entry.desc || 'Serviço Gráfico'}\n\n` +
    comp.map(r => `${(((r as any).tiраgemInput ?? r.tiragem) || 0).toLocaleString('pt-BR')} ${qtyLabel} → ${brl(r.total)} (${brl(r.unitario, 4)}/un.)`).join('\n') +
    `\n\nVálido por 30 dias. Aguardo retorno!`
  );
  const waLink = tel ? `https://wa.me/55${tel}?text=${waMsg}` : '';

  const jobRowsHTML = jobLines
    .filter(l => !l.label.toLowerCase().includes('custo'))
    .map(l => `<tr><td style="color:#6b5f8a;width:42%">${l.label}</td><td><strong>${l.value}</strong></td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Proposta ${entry.ref}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Segoe UI,Arial,sans-serif;font-size:13px;color:#1e1535;background:#fff;padding:32px;max-width:720px;margin:0 auto}
h2{font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;margin:22px 0 8px;padding-bottom:4px;border-bottom:2px solid #ece9f5}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:18px;border-bottom:3px solid #7c3aed}
.logo{font-size:22px;font-weight:900;color:#7c3aed;letter-spacing:-1px}.logo span{color:#06b6d4}
.meta{text-align:right;font-size:11.5px;color:#6b5f8a;line-height:1.9}
.meta strong{font-size:14px;color:#1e1535;display:block;margin-bottom:2px}
table{width:100%;border-collapse:collapse;font-size:12.5px}
td,th{padding:7px 8px;border-bottom:1px solid #ece9f5}
td:first-child{color:#6b5f8a;width:42%}
td.num{text-align:right;font-weight:600;font-family:monospace}
tr.best td{background:#f0fdf4}
tr.best td.best-unit{color:#16a34a;font-weight:800}
.total-box{background:#f3f0ff;border:2px solid #7c3aed;border-radius:10px;padding:18px 22px;margin-top:20px;display:flex;justify-content:space-between;align-items:center}
.lbl{font-size:10px;font-weight:700;color:#6b5f8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.tv{font-size:28px;font-weight:900;color:#7c3aed;font-family:monospace}
.uv{font-size:15px;color:#06b6d4;font-family:monospace;font-weight:700}
.footer{margin-top:28px;padding-top:12px;border-top:1px solid #ece9f5;font-size:10.5px;color:#b0a8c8;text-align:center}
.actions{display:flex;gap:12px;margin-bottom:24px;justify-content:center}
.btn{padding:10px 24px;border-radius:6px;border:none;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block;text-align:center}
.cond td{border:none;padding:5px 8px}
@media print{.actions{display:none!important}}
</style>
</head>
<body>
<div class="actions">
  <button class="btn" style="background:#7c3aed;color:#fff" onclick="window.print()">🖨 Salvar como PDF</button>
  ${waLink ? `<a class="btn" style="background:#25D366;color:#fff" href="${waLink}" target="_blank">💬 WhatsApp</a>` : ''}
</div>
<div class="header">
  <div>
    <div class="logo">MOHR<span>SYS</span></div>
    <div style="font-size:11px;color:#6b5f8a;margin-top:4px">Soluções em Impressão Offset</div>
  </div>
  <div class="meta">
    <div>PROPOSTA COMERCIAL</div>
    <strong>${entry.ref}</strong>
    <div>${now} · Válida até ${validade}</div>
  </div>
</div>
<h2>Destinatário</h2>
<table class="cond"><tbody>
  <tr><td style="color:#6b5f8a">Cliente</td><td><strong>${entry.cliente || '—'}</strong></td></tr>
  ${entry.prazo ? `<tr><td style="color:#6b5f8a">Prazo Estimado</td><td>${entry.prazo}</td></tr>` : ''}
</tbody></table>
<h2>Especificações do Material</h2>
<div style="font-size:12px;color:#374151;margin-bottom:8px">${entry.desc}</div>
${jobRowsHTML ? `<table><tbody>${jobRowsHTML}</tbody></table>` : ''}
<h2>${comp.length > 1 ? 'Opções de Quantidade' : 'Valor da Proposta'}</h2>
${qtySection}
<h2>Condições Comerciais</h2>
<table class="cond"><tbody>
  <tr><td style="color:#6b5f8a">Validade da proposta</td><td>30 dias a partir de ${now}</td></tr>
  <tr><td style="color:#6b5f8a">Forma de pagamento</td><td>A combinar</td></tr>
  <tr><td style="color:#6b5f8a">Impostos</td><td>Inclusos no valor apresentado</td></tr>
  <tr><td style="color:#6b5f8a">Entrega</td><td>${entry.prazo ? `Prazo estimado: ${entry.prazo}` : 'A combinar após aprovação'}</td></tr>
</tbody></table>
<div class="footer">
  Este orçamento é válido por 30 dias. Após a aprovação, o prazo de produção será confirmado.<br/>
  MohrSys · Sistema de Orçamento para Gráficas Offset
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function HistoricoPage({ onEditar }: Props) {
  const { historico, clientes, toggleAprovado, removeOrcamento, addOrcamento, toast } = useApp();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClick() { setMenuAberto(null); }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const filtered = historico.filter(h => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const cli = clientes.find(c => c.nome === h.cliente);
    return (
      h.ref.toLowerCase().includes(q) ||
      h.cliente.toLowerCase().includes(q) ||
      (cli?.tel || '').includes(q)
    );
  });

  const todosSelec = filtered.length > 0 && filtered.every(h => selected.has(h.id));
  const algunsSelec = filtered.some(h => selected.has(h.id));
  const nSel = [...selected].filter(id => historico.some(h => h.id === id)).length;

  function toggleSel(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelTodos(checked: boolean) {
    if (checked) {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(h => next.add(h.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(h => next.delete(h.id));
        return next;
      });
    }
  }

  function excluirSelecionados() {
    if (!nSel) return;
    if (!confirm(`Excluir ${nSel} orçamento${nSel > 1 ? 's selecionados' : ''}?`)) return;
    [...selected].forEach(id => removeOrcamento(id));
    setSelected(new Set());
    toast(`${nSel} orçamento${nSel > 1 ? 's excluídos' : ' excluído'}`);
  }

  function abrirOP(e: OrcamentoEntry) {
    const w = window.open('', '_blank', 'width=820,height=920');
    if (w) { w.document.write(gerarOP(e)); w.document.close(); }
  }

  function abrirProposta(e: OrcamentoEntry) {
    const cli = clientes.find(c => c.nome === e.cliente);
    const w = window.open('', '_blank', 'width=820,height=920');
    if (w) { w.document.write(gerarPropostaHTML(e, cli?.tel)); w.document.close(); }
  }

  function duplicar(e: OrcamentoEntry) {
    const { id: _id, ts: _ts, aprovado: _ap, ref, ...rest } = e;
    const novaRef = `${ref}-COPIA`;
    addOrcamento({ ...rest, ref: novaRef } as Parameters<typeof addOrcamento>[0]);
    toast(`Duplicado como ${novaRef}`);
  }

  return (
    <div className="section active">
      <div className="section-header">
        <h2>Gestão de <span>Orçamentos</span></h2>
      </div>

      {/* Busca */}
      <div style={{ marginBottom: '14px' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por número, cliente ou telefone..."
          style={{
            width: '100%', maxWidth: '420px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '9px 12px',
            color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px',
            outline: 'none', transition: 'border-color .2s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Barra de seleção */}
      {nSel > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 14px',
          background: 'rgba(124,58,237,.07)',
          border: '1px solid rgba(124,58,237,.2)',
          borderRadius: '8px', marginBottom: '10px',
        }}>
          <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: '12px', color: 'var(--accent)' }}>
            {nSel} selecionado{nSel > 1 ? 's' : ''}
          </span>
          <button
            onClick={excluirSelecionados}
            style={{
              background: '#e11d48', color: '#fff',
              fontFamily: 'var(--display)', fontWeight: 700,
              fontSize: '11px', letterSpacing: '.5px', textTransform: 'uppercase',
              border: 'none', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer',
            }}>
            ✕ Excluir selecionados
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected(new Set())}>
            Cancelar
          </button>
        </div>
      )}

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: '12px', textAlign: 'center', padding: '60px 0' }}>
          {search ? 'Nenhum orçamento encontrado.' : 'Nenhum orçamento salvo ainda'}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'visible' }}>
          <table className="hist-table">
            <thead>
              <tr>
                <th style={{ width: '36px', padding: '9px 4px 9px 12px' }}>
                  <input
                    type="checkbox"
                    checked={todosSelec}
                    ref={el => { if (el) el.indeterminate = !todosSelec && algunsSelec; }}
                    onChange={e => toggleSelTodos(e.target.checked)}
                    style={{ accentColor: 'var(--accent)', width: '14px', height: '14px', cursor: 'pointer' }}
                    title="Selecionar todos"
                  />
                </th>
                <th>Nº / Descrição</th>
                <th>Status</th>
                <th>Data</th>
                <th>Cliente</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ width: '48px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => {
                const aprov = !!h.aprovado;
                const isSel = selected.has(h.id);
                const cli = clientes.find(c => c.nome === h.cliente);
                const dataFmt = h.data ? h.data.split('-').reverse().join('/') : '—';
                const total = (h.total as number) || 0;
                const unitario = (h.unitario as number) || 0;
                const menuOpen = menuAberto === h.id;

                const rowStyle: React.CSSProperties = isSel
                  ? { background: 'rgba(124,58,237,.05)' }
                  : aprov
                    ? { background: 'rgba(16,185,129,.03)', borderLeft: '3px solid #10b981' }
                    : {};

                return (
                  <tr key={h.id} style={rowStyle}>
                    {/* checkbox */}
                    <td style={{ width: '36px', padding: '9px 4px 9px 12px' }}>
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleSel(h.id)}
                        style={{ accentColor: 'var(--accent)', width: '14px', height: '14px', cursor: 'pointer' }}
                      />
                    </td>

                    {/* Nº / Descrição */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {aprov && (
                          <span title="Aprovado" style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '18px', height: '18px', background: '#10b981', borderRadius: '50%', flexShrink: 0,
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent)' }}>#{h.ref}</span>
                      </div>
                      {h.desc && (
                        <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: '2px', lineHeight: 1.4 }}>
                          {h.desc}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      {aprov ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          background: 'rgba(16,185,129,.12)', color: '#10b981',
                          border: '1px solid rgba(16,185,129,.3)',
                          borderRadius: '4px', padding: '2px 8px',
                          fontSize: '10px', fontWeight: 600,
                          fontFamily: 'var(--display)', letterSpacing: '.5px', whiteSpace: 'nowrap',
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Aprovado
                        </span>
                      ) : (
                        <span style={{
                          background: 'rgba(107,95,138,.06)', color: 'var(--text3)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px', padding: '2px 8px',
                          fontSize: '10px', fontWeight: 600,
                          fontFamily: 'var(--display)', letterSpacing: '.5px', whiteSpace: 'nowrap',
                        }}>
                          Aguardando
                        </span>
                      )}
                    </td>

                    {/* Data */}
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                      {dataFmt}
                    </td>

                    {/* Cliente */}
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{h.cliente}</div>
                      {cli?.tel && (
                        <div style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--accent2)' }}>{cli.tel}</div>
                      )}
                    </td>

                    {/* Valor */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                      R$ {total.toFixed(2).replace('.', ',')}
                      <div style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text2)' }}>
                        R$ {unitario.toFixed(4).replace('.', ',')} /un
                      </div>
                    </td>

                    {/* Ações — menu ••• */}
                    <td style={{ position: 'relative', textAlign: 'center' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setMenuAberto(menuOpen ? null : h.id); }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontWeight: 900, letterSpacing: '1px',
                          padding: '2px 4px', fontSize: '9px',
                          transform: 'rotate(90deg)', lineHeight: 1,
                          color: 'var(--text2)', transition: 'color .15s',
                        }}
                        title="Ações"
                      >•••</button>

                      {menuOpen && (
                        <div ref={menuRef} className="orc-menu" onClick={e => e.stopPropagation()}>
                          <div
                            className={`orc-menu-item ${aprov ? '' : 'aprov'}`}
                            onClick={() => { setMenuAberto(null); toggleAprovado(h.id); toast(aprov ? 'Aprovação removida.' : 'Orçamento aprovado!'); }}
                          >
                            <span>{aprov ? '✗' : '✓'}</span>
                            {aprov ? 'Cancelar aprovação' : 'Aprovar orçamento'}
                          </div>
                          <div className="orc-menu-item" onClick={() => { setMenuAberto(null); abrirOP(h); }}>
                            <span>🖨</span> Ordem de Produção
                          </div>
                          <div className="orc-menu-item" onClick={() => { setMenuAberto(null); abrirProposta(h); }}>
                            <span>📄</span> Proposta PDF
                          </div>
                          <div className="orc-menu-item" onClick={() => { setMenuAberto(null); duplicar(h); }}>
                            <span>⧉</span> Duplicar
                          </div>
                          <div className="orc-menu-item" onClick={() => { setMenuAberto(null); onEditar(h); }}>
                            <span>✎</span> Editar
                          </div>
                          <div className="orc-menu-item danger" onClick={() => { setMenuAberto(null); removeOrcamento(h.id); toast('Orçamento removido.'); }}>
                            <span>✕</span> Remover
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
