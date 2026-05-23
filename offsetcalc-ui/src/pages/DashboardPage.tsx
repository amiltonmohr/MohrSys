import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#ef4444', '#a78bfa'];

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho', enviado: 'Enviado', aceito: 'Aceito', recusado: 'Recusado',
};
const STATUS_COLORS: Record<string, string> = {
  rascunho: '#6b7280', enviado: '#f59e0b', aceito: '#10b981', recusado: '#ef4444',
};

type Periodo = 'todos' | '30' | '90' | '365';

function getStatus(h: Record<string, unknown>): string {
  return (h.status as string) || (h.aprovado ? 'aceito' : 'rascunho');
}

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

const fmtBRL = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const tooltipFmt = (v: number) => fmtBRL(v);

export default function DashboardPage() {
  const { historico, clientes } = useApp();
  const [periodo, setPeriodo] = useState<Periodo>('todos');

  const dados = useMemo(() => {
    if (periodo === 'todos') return historico as Record<string, unknown>[];
    const limite = Date.now() - parseInt(periodo) * 86400000;
    return (historico as Record<string, unknown>[]).filter(h => (h.ts as number) >= limite);
  }, [historico, periodo]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = dados.length;
    const aceitos = dados.filter(h => getStatus(h) === 'aceito');
    const fatTotal = dados.reduce((s, h) => s + getTotal(h), 0);
    const fatAprov = aceitos.reduce((s, h) => s + getTotal(h), 0);
    const totalMarg = dados.reduce((s, h) => s + getMargem(h), 0);
    const totalSub = dados.reduce((s, h) => s + getSubtotal(h), 0);
    const taxa = total > 0 ? (aceitos.length / total) * 100 : 0;
    const ticketMedio = aceitos.length > 0 ? fatAprov / aceitos.length : 0;
    const pctMargem = totalSub > 0 ? (totalMarg / totalSub) * 100 : 0;
    return { total, aceitos: aceitos.length, pendentes: total - aceitos.length, fatTotal, fatAprov, taxa, ticketMedio, pctMargem };
  }, [dados]);

  // ── Chart: Orçamentos + Receita por mês (últimos 6 meses) ────────────────
  const dadosMeses = useMemo(() => {
    const meses: Record<string, { mes: string; qtd: number; valor: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      meses[key] = { mes: label, qtd: 0, valor: 0 };
    }
    dados.forEach(h => {
      const d = new Date(h.ts as number);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (meses[key]) { meses[key].qtd++; meses[key].valor += getTotal(h); }
    });
    return Object.values(meses);
  }, [dados]);

  // ── Chart: Distribuição por status ────────────────────────────────────────
  const dadosStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    dados.forEach(h => { const s = getStatus(h); counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).map(([s, v]) => ({ name: STATUS_LABELS[s] || s, value: v, status: s }));
  }, [dados]);

  // ── Chart: Top 5 clientes por valor ──────────────────────────────────────
  const dadosClientes = useMemo(() => {
    const byCliente: Record<string, number> = {};
    dados.forEach(h => {
      const nome = (h.cliente as string) || '(sem cliente)';
      byCliente[nome] = (byCliente[nome] || 0) + getTotal(h);
    });
    return Object.entries(byCliente)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, valor]) => ({ nome: nome.length > 16 ? nome.slice(0, 16) + '…' : nome, valor }));
  }, [dados]);

  // ── Chart: Composição de Custos (horizontal stacked) ─────────────────────
  const dadosCustos = useMemo(() => {
    if (!dados.length) return [];
    return [{
      name: 'Composição',
      Papel:       dados.reduce((s, h) => s + getCusto(h, 'custoPapel'), 0),
      Chapas:      dados.reduce((s, h) => s + getCusto(h, 'custoChapas'), 0),
      Tinta:       dados.reduce((s, h) => s + getCusto(h, 'custoTinta'), 0),
      Máquina:     dados.reduce((s, h) => s + getCusto(h, 'custoMaquina'), 0),
      Indiretos:   dados.reduce((s, h) => s + getCusto(h, 'custoIndireto'), 0),
      Acabamentos: dados.reduce((s, h) => s + getCusto(h, 'custoAcab'), 0),
      Margem:      dados.reduce((s, h) => s + getMargem(h), 0),
    }];
  }, [dados]);

  const custoColors: Record<string, string> = {
    Papel: '#7c3aed', Chapas: '#06b6d4', Tinta: '#e11d48',
    Máquina: '#f59e0b', Indiretos: '#10b981', Acabamentos: '#3b82f6', Margem: '#8b5cf6',
  };

  const tooltipStyle = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px',
  };

  const clientesRecentes = useMemo(
    () => clientes.filter(c => Date.now() - c.ts < 30 * 24 * 3600 * 1000).length,
    [clientes]
  );

  return (
    <div className="section active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
          Dashboard <span className="grad-text">Gráfica</span>
        </h2>
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value as Periodo)}
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 12px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
          <option value="todos">Todos os períodos</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {([
          { label: 'Faturamento Total',   value: fmtBRL(kpis.fatTotal),            color: 'var(--accent)' },
          { label: 'Faturamento Aprovado',value: fmtBRL(kpis.fatAprov),            color: '#10b981' },
          { label: 'Taxa de Conversão',   value: `${kpis.taxa.toFixed(1)}%`,       color: '#a78bfa' },
          { label: 'Orçamentos Emitidos', value: kpis.total,                        color: '#f59e0b' },
          { label: 'Aprovados / Pendentes', value: `${kpis.aceitos} / ${kpis.pendentes}`, color: '#06b6d4' },
          { label: 'Margem Média',        value: `${kpis.pctMargem.toFixed(1)}%`,  color: '#ec4899' },
          { label: 'Ticket Médio',        value: fmtBRL(kpis.ticketMedio),         color: '#7c3aed' },
          { label: 'Total de Clientes',   value: clientes.length,                  color: 'var(--accent2)' },
          { label: 'Clientes (30 dias)',  value: clientesRecentes,                 color: '#10b981' },
        ] as { label: string; value: string | number; color: string }[]).map(k => (
          <div key={k.label} className="card" style={{ padding: '16px', margin: 0 }}>
            <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: k.color, fontFamily: 'var(--mono)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {dados.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>
          {periodo !== 'todos' ? 'Nenhum orçamento no período selecionado.' : 'Sem dados ainda. Salve orçamentos para ver os gráficos.'}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,380px), 1fr))', gap: '16px' }}>

            {/* Chart 1: Orçamentos por mês */}
            <div className="card" style={{ padding: '20px', margin: 0 }}>
              <div className="card-title">Orçamentos por Mês</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={dadosMeses} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="qtd" name="Orçamentos" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Distribuição por status */}
            <div className="card" style={{ padding: '20px', margin: 0 }}>
              <div className="card-title">Status dos Orçamentos</div>
              {dadosStatus.length === 0 ? (
                <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: '13px' }}>Sem dados de status</div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={dadosStatus} cx="50%" cy="45%" outerRadius={80} dataKey="value" nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {dadosStatus.map((d, i) => (
                        <Cell key={d.status} fill={STATUS_COLORS[d.status] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend formatter={v => <span style={{ fontSize: '11px', color: 'var(--text)' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart 3: Top clientes por valor */}
            <div className="card" style={{ padding: '20px', margin: 0 }}>
              <div className="card-title">Top 5 Clientes (por Valor)</div>
              {dadosClientes.length === 0 ? (
                <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: '13px' }}>Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={dadosClientes} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text2)' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: 'var(--text2)' }} width={90} />
                    <Tooltip formatter={tooltipFmt} contentStyle={tooltipStyle} />
                    <Bar dataKey="valor" name="Valor" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart 4: Receita mensal (área) */}
            <div className="card" style={{ padding: '20px', margin: 0 }}>
              <div className="card-title">Receita Mensal (R$)</div>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={dadosMeses} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                  <defs>
                    <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={tooltipFmt} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="valor" name="Receita" stroke="#7c3aed" fill="url(#receitaGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Composição de Custos (stacked horizontal) */}
          {dadosCustos.length > 0 && (
            <div className="card" style={{ marginTop: '16px' }}>
              <div className="card-title">Composição de Custos (total do período)</div>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={dadosCustos} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text2)' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)' }} width={80} />
                  <Tooltip
                    formatter={(v: number, name: string) => [fmtBRL(v), name]}
                    contentStyle={tooltipStyle}
                  />
                  <Legend formatter={v => <span style={{ fontSize: '10px', color: 'var(--text)' }}>{v}</span>} />
                  {Object.entries(custoColors).map(([name, color]) => (
                    <Bar key={name} dataKey={name} stackId="a" fill={color + 'bb'} stroke={color} strokeWidth={0} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
