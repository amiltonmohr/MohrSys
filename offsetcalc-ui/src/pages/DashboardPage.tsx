import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

type Periodo = 'todos' | '30' | '90' | '365';

const PALETTE = ['#7c3aed','#06b6d4','#e11d48','#f59e0b','#10b981','#3b82f6','#ec4899','#f97316'];
const GREEN = '#10b981';
const ACCENT = '#7c3aed';
const TEAL = '#06b6d4';

function getTotal(h: Record<string, unknown>): number {
  return typeof h.total === 'number' ? h.total : ((h.resultado as Record<string, unknown>)?.total as number) || 0;
}
function getMargem(h: Record<string, unknown>): number {
  if (typeof h.margem === 'number') return h.margem;
  return ((h.resultado as Record<string, unknown>)?.margem as number) || 0;
}
function getSubtotal(h: Record<string, unknown>): number {
  if (typeof h.subtotal === 'number') return h.subtotal;
  return ((h.resultado as Record<string, unknown>)?.subtotal as number) || 0;
}
function getCusto(h: Record<string, unknown>, key: string): number {
  const res = h.resultado as Record<string, unknown> | undefined;
  const direct = h[key];
  if (typeof direct === 'number') return direct;
  return (res?.[key] as number) || 0;
}

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const tooltipStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--mono)',
};

export default function DashboardPage() {
  const { historico } = useApp();
  const [periodo, setPeriodo] = useState<Periodo>('todos');

  const dados = useMemo(() => {
    if (periodo === 'todos') return historico as Record<string, unknown>[];
    const limite = Date.now() - parseInt(periodo) * 86400000;
    return (historico as Record<string, unknown>[]).filter(h => (h.ts as number) >= limite);
  }, [historico, periodo]);

  // ── 6 KPIs ────────────────────────────────────────────────────────────────
  const { fatTotal, fatAprov, pctAprov, pctMargem, nAprov, nPend } = useMemo(() => {
    const aprov  = dados.filter(h => !!h.aprovado);
    const pend   = dados.filter(h => !h.aprovado);
    const fatT   = dados.reduce((s, h) => s + getTotal(h), 0);
    const fatA   = aprov.reduce((s, h) => s + getTotal(h), 0);
    const marg   = dados.reduce((s, h) => s + getMargem(h), 0);
    const sub    = dados.reduce((s, h) => s + getSubtotal(h), 0);
    const pctA   = dados.length > 0 ? (aprov.length / dados.length * 100) : 0;
    const pctM   = sub > 0 ? (marg / sub * 100) : 0;
    return { fatTotal: fatT, fatAprov: fatA, pctAprov: pctA, pctMargem: pctM, nAprov: aprov.length, nPend: pend.length };
  }, [dados]);

  // ── Chart 1: Emitidos vs Aprovados por data ────────────────────────────────
  const dadosDatas = useMemo(() => {
    const byDate: Record<string, { data: string; emitidos: number; aprovados: number }> = {};
    dados.forEach(h => {
      const d = (h.data as string) || 'sem data';
      if (!byDate[d]) byDate[d] = { data: d, emitidos: 0, aprovados: 0 };
      byDate[d].emitidos += getTotal(h);
      if (h.aprovado) byDate[d].aprovados += getTotal(h);
    });
    return Object.values(byDate)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(r => ({
        ...r,
        label: r.data !== 'sem data'
          ? r.data.split('-').slice(1).reverse().join('/')
          : 's/d',
      }));
  }, [dados]);

  // ── Chart 2: Status doughnut ───────────────────────────────────────────────
  const dadosDoughnut = useMemo(() => [
    { name: `Aprovados (${nAprov})`, value: nAprov, color: GREEN },
    { name: `Pendentes (${nPend})`, value: nPend, color: '#d1d5db' },
  ], [nAprov, nPend]);

  const dadosDoughnutValor = useMemo(() => [
    { name: 'Aprovado', value: fatAprov, color: GREEN },
    { name: 'Pendente', value: Math.max(0, fatTotal - fatAprov), color: '#d1d5db' },
  ], [fatAprov, fatTotal]);

  // ── Chart 3: Top 8 clientes ────────────────────────────────────────────────
  const dadosClientes = useMemo(() => {
    const byC: Record<string, number> = {};
    dados.forEach(h => { const c = (h.cliente as string) || 'Não informado'; byC[c] = (byC[c] || 0) + getTotal(h); });
    return Object.entries(byC).sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([nome, valor], i) => ({ nome, valor, fill: PALETTE[i % PALETTE.length] }));
  }, [dados]);

  // ── Chart 4: Composição acumulada de custos ───────────────────────────────
  const CUSTO_KEYS  = ['custoPapel','custoChapas','custoTinta','custoMaquina','custoIndireto','custoAcab'];
  const CUSTO_NOMES = ['Papel','Chapas','Tinta','Máquina','Indiretos','Acabamentos'];
  const CUSTO_COLORS = [ACCENT, TEAL, '#e11d48', '#f59e0b', GREEN, '#3b82f6', '#8b5cf6'];

  const dadosCustos = useMemo(() => {
    if (!dados.length) return [];
    const row: Record<string, number | string> = { name: 'Composição Média' };
    CUSTO_KEYS.forEach(k => { row[k] = dados.reduce((s, h) => s + getCusto(h, k), 0); });
    row['margem'] = dados.reduce((s, h) => s + getMargem(h), 0);
    return [row];
  }, [dados]);

  if (dados.length === 0) {
    return (
      <div className="section active">
        <div className="section-header">
          <h2><span>Dashboard</span></h2>
          <PeriodoSelect value={periodo} onChange={setPeriodo} />
        </div>
        <div className="result-grid" style={{ marginBottom: '16px' }}>
          {kpiItems(0, 0, 0, 0, 0, 0).map(k => <KpiCard key={k.label} {...k} />)}
        </div>
        <div style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: '12px', textAlign: 'center', padding: '60px 0' }}>
          {periodo !== 'todos' ? 'Nenhum orçamento no período selecionado.' : 'Sem dados ainda. Salve orçamentos para ver os gráficos.'}
        </div>
      </div>
    );
  }

  return (
    <div className="section active">
      <div className="section-header">
        <h2><span>Dashboard</span></h2>
        <PeriodoSelect value={periodo} onChange={setPeriodo} />
      </div>

      {/* 6 KPIs */}
      <div className="result-grid" style={{ marginBottom: '16px' }}>
        {kpiItems(fatTotal, fatAprov, pctAprov, dados.length, nAprov, nPend, pctMargem).map(k => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Chart 1 — full width: Emitidos vs Aprovados por data */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-title">Orçamentos Emitidos vs Aprovados por Data</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dadosDatas} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(216,210,232,.3)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => brl(v)}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="emitidos" name="Emitidos"  fill={ACCENT + '99'} stroke={ACCENT} strokeWidth={1} radius={[3,3,0,0]} />
            <Bar dataKey="aprovados" name="Aprovados" fill={GREEN  + 'aa'} stroke={GREEN}  strokeWidth={1} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Charts 2+3 — 2-col */}
      <div className="grid-2" style={{ marginBottom: '16px' }}>
        {/* Doughnut: Status */}
        <div className="card">
          <div className="card-title">Status dos Orçamentos</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center', marginBottom: '4px' }}>
            Anel ext. = valor · Anel int. = qtde
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dadosDoughnutValor} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                dataKey="value" nameKey="name">
                {dadosDoughnutValor.map((d, i) => <Cell key={i} fill={d.color + 'bb'} stroke={d.color} strokeWidth={2} />)}
              </Pie>
              <Pie data={dadosDoughnut} cx="50%" cy="45%" innerRadius={30} outerRadius={50}
                dataKey="value" nameKey="name">
                {dadosDoughnut.map((d, i) => <Cell key={i} fill={d.color + '66'} stroke={d.color} strokeWidth={1} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) =>
                name.includes('Aprovado') || name.includes('Pendente') ? brl(v) : `${v} orç.`} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Clientes: horizontal bar */}
        <div className="card">
          <div className="card-title">Top Clientes por Faturamento</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosClientes} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(216,210,232,.3)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: 'var(--text2)' }} width={90} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brl(v)} />
              <Bar dataKey="valor" name="Faturamento" radius={[0,4,4,0]}>
                {dadosClientes.map((d, i) => <Cell key={i} fill={d.fill + 'aa'} stroke={d.fill} strokeWidth={1} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4 — full width: Composição de custos (horizontal stacked) */}
      {dadosCustos.length > 0 && (
        <div className="card">
          <div className="card-title">Composição Acumulada de Custos</div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={dadosCustos} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(216,210,232,.3)" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [`${brl(v)} (${fatTotal > 0 ? ((v/fatTotal)*100).toFixed(1) : 0}%)`, name]} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              {[...CUSTO_KEYS, 'margem'].map((k, i) => (
                <Bar key={k} dataKey={k} name={[...CUSTO_NOMES,'Margem'][i]} stackId="a"
                  fill={CUSTO_COLORS[i] + '99'} stroke={CUSTO_COLORS[i]} strokeWidth={1} radius={i === CUSTO_KEYS.length ? [0,2,2,0] : 0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function kpiItems(fatTotal: number, fatAprov: number, pctAprov: number, emitidos: number, nAprov: number, nPend: number, pctMargem = 0) {
  return [
    {
      label: 'Faturamento Total',
      value: brl(fatTotal),
      className: 'result-item-value highlight',
    },
    {
      label: 'Fat. Aprovado',
      value: brl(fatAprov),
      style: { color: GREEN, fontSize: '18px', fontWeight: 700 },
    },
    {
      label: '% Aprovação',
      value: `${pctAprov.toFixed(0)}%`,
      style: { color: pctAprov >= 50 ? GREEN : '#e11d48' },
    },
    {
      label: 'Orçamentos Emitidos',
      value: String(emitidos),
    },
    {
      label: 'Aprovados / Pendentes',
      value: null,
      customValue: (
        <span style={{ fontSize: '16px', fontFamily: 'var(--mono)', fontWeight: 500 }}>
          <span style={{ color: GREEN }}>{nAprov}</span>
          {' / '}
          <span style={{ color: 'var(--text2)' }}>{nPend}</span>
        </span>
      ),
    },
    {
      label: 'Margem Média',
      value: `${pctMargem.toFixed(1)}%`,
      className: 'result-item-value green',
    },
  ];
}

interface KpiProps {
  label: string;
  value?: string | null;
  className?: string;
  style?: React.CSSProperties;
  customValue?: React.ReactNode;
}
function KpiCard({ label, value, className, style, customValue }: KpiProps) {
  return (
    <div className="result-item">
      <div className="result-item-label">{label}</div>
      {customValue ? customValue : (
        <div className={className || 'result-item-value'} style={style}>{value}</div>
      )}
    </div>
  );
}

function PeriodoSelect({ value, onChange }: { value: Periodo; onChange: (v: Periodo) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as Periodo)}
      style={{
        background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px',
        padding: '7px 12px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '12px', outline: 'none', cursor: 'pointer',
      }}>
      <option value="todos">Todos os períodos</option>
      <option value="30">Últimos 30 dias</option>
      <option value="90">Últimos 90 dias</option>
      <option value="365">Último ano</option>
    </select>
  );
}
