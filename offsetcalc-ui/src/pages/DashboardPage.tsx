import { useMemo } from 'react';
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

function getStatus(h: Record<string, unknown>): string {
  return (h.status as string) || (h.aprovado ? 'aceito' : 'rascunho');
}

function getTotal(h: Record<string, unknown>): number {
  const res = h.resultado as Record<string, unknown> | undefined;
  return typeof res?.total === 'number' ? res.total : 0;
}

const fmtBRL = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function DashboardPage() {
  const { historico, clientes } = useApp();

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = historico.length;
    const aceitos = historico.filter(h => getStatus(h) === 'aceito');
    const valorAceito = aceitos.reduce((sum, h) => sum + getTotal(h), 0);
    const taxa = total > 0 ? (aceitos.length / total) * 100 : 0;
    const recentes30 = historico.filter(h => Date.now() - h.ts < 30 * 24 * 3600 * 1000).length;
    const ticketMedio = aceitos.length > 0 ? valorAceito / aceitos.length : 0;
    const clientesRecentes = clientes.filter(c => Date.now() - c.ts < 30 * 24 * 3600 * 1000).length;
    return { total, aceitos: aceitos.length, valorAceito, taxa, recentes30, ticketMedio, clientesRecentes };
  }, [historico, clientes]);

  // ── Chart 1 & 4: Orçamentos + Receita por mês (últimos 6 meses) ──────────
  const dadosMeses = useMemo(() => {
    const meses: Record<string, { mes: string; qtd: number; valor: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      meses[key] = { mes: label, qtd: 0, valor: 0 };
    }
    historico.forEach(h => {
      const d = new Date(h.ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (meses[key]) {
        meses[key].qtd++;
        meses[key].valor += getTotal(h);
      }
    });
    return Object.values(meses);
  }, [historico]);

  // ── Chart 2: Distribuição por status ─────────────────────────────────────
  const dadosStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    historico.forEach(h => {
      const s = getStatus(h);
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([s, v]) => ({
      name: STATUS_LABELS[s] || s, value: v, status: s,
    }));
  }, [historico]);

  // ── Chart 3: Top 5 clientes por valor ────────────────────────────────────
  const dadosClientes = useMemo(() => {
    const byCliente: Record<string, number> = {};
    historico.forEach(h => {
      const nome = (h.cliente as string) || '(sem cliente)';
      byCliente[nome] = (byCliente[nome] || 0) + getTotal(h);
    });
    return Object.entries(byCliente)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nome, valor]) => ({ nome: nome.length > 16 ? nome.slice(0, 16) + '…' : nome, valor }));
  }, [historico]);

  const tooltipStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <div className="section active">
      <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>
        Dashboard <span style={{ color: 'var(--accent)' }}>Gráfica</span>
      </h2>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {([
          { label: 'Total de Orçamentos', value: kpis.total, color: 'var(--accent)' },
          { label: 'Aceitos', value: kpis.aceitos, color: '#10b981' },
          { label: 'Valor Aceito', value: fmtBRL(kpis.valorAceito), color: '#7c3aed' },
          { label: 'Taxa de Conversão', value: `${kpis.taxa.toFixed(1)}%`, color: '#a78bfa' },
          { label: 'Últimos 30 dias', value: kpis.recentes30, color: '#f59e0b' },
          { label: 'Ticket Médio', value: fmtBRL(kpis.ticketMedio), color: '#ec4899' },
        ] as { label: string; value: string | number; color: string }[]).map(k => (
          <div key={k.label} className="card" style={{ padding: '16px', margin: 0 }}>
            <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {k.label}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: k.color, fontFamily: 'var(--mono)' }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {historico.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text2)', fontSize: '14px' }}>
          Sem dados ainda. Salve orçamentos para ver os gráficos.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>

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
              <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: '13px' }}>
                Sem dados de status
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={dadosStatus}
                    cx="50%" cy="45%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {dadosStatus.map((d, i) => (
                      <Cell key={d.status} fill={STATUS_COLORS[d.status] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    formatter={v => <span style={{ fontSize: '11px', color: 'var(--text)' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart 3: Top clientes por valor */}
          <div className="card" style={{ padding: '20px', margin: 0 }}>
            <div className="card-title">Top 5 Clientes (por Valor)</div>
            {dadosClientes.length === 0 ? (
              <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: '13px' }}>
                Sem dados de clientes
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={dadosClientes} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'var(--text2)' }}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: 'var(--text2)' }} width={90} />
                  <Tooltip
                    formatter={(v: number) => fmtBRL(v)}
                    contentStyle={tooltipStyle}
                  />
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
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text2)' }}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => fmtBRL(v)}
                  contentStyle={tooltipStyle}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  name="Receita"
                  stroke="#7c3aed"
                  fill="url(#receitaGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Clientes KPI extras */}
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total Clientes</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{clientes.length}</div>
        </div>
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Clientes (30 dias)</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--mono)' }}>{kpis.clientesRecentes}</div>
        </div>
      </div>
    </div>
  );
}
