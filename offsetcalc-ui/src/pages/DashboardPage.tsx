import { useState, useEffect } from 'react';

interface DashboardStats {
  total_orcamentos: number;
  orcamentos_aceitos: number;
  orcamentos_pendentes: number;
  valor_total_aceito: number;
  clientes_totais: number;
  clientes_ativos: number;
}

interface RecentQuote {
  id: string;
  numero: string;
  cliente: string;
  total: number;
  data: string;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/v1/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) {
        setStats(data.data.stats);
        setRecentQuotes(data.data.recentQuotes);
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="section active">
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>
          📈 <span style={{ color: 'var(--accent)' }}>Dashboard</span>
        </h2>
        <p style={{ padding: '20px', color: 'var(--text2)' }}>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="section active">
      <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>
        📈 <span style={{ color: 'var(--accent)' }}>Dashboard</span>
      </h2>

      {stats && (
        <>
          {/* Key Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', color: '#fff', padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total de Orçamentos
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>
                {stats.total_orcamentos}
              </div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Orçamentos Aceitos
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>
                {stats.orcamentos_aceitos}
              </div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pendentes
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>
                {stats.orcamentos_pendentes}
              </div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: '#fff', padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Valor Total
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>
                R$ {stats.valor_total_aceito.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Clients */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Clientes Cadastrados
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>
                {stats.clientes_totais}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Clientes Ativos
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent2)' }}>
                {stats.clientes_ativos}
              </div>
            </div>
          </div>

          {/* Recent Quotes */}
          <div className="card">
            <div className="card-title">Últimos Orçamentos</div>

            {recentQuotes.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Número</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Cliente</th>
                      <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: 'var(--text2)' }}>Valor</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: 'var(--text2)' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentQuotes.map((q) => (
                      <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px', fontWeight: 600, color: 'var(--accent)' }}>{q.numero}</td>
                        <td style={{ padding: '10px' }}>{q.cliente}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                          R$ {q.total.toFixed(2)}
                        </td>
                        <td style={{
                          padding: '10px',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            background: q.status === 'aceito' ? '#10b981' : q.status === 'enviado' ? '#f59e0b' : '#6b7280',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {q.status === 'aceito' ? 'Aceito' : q.status === 'enviado' ? 'Enviado' : 'Rascunho'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', fontSize: '12px', color: 'var(--text2)' }}>
                          {new Date(q.data).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ padding: '20px', color: 'var(--text2)' }}>Nenhum orçamento ainda</p>
            )}
          </div>

          {/* Performance Info */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'var(--surface2)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text2)'
          }}>
            <strong>Taxa de conversão:</strong>{' '}
            {stats.total_orcamentos > 0
              ? ((stats.orcamentos_aceitos / stats.total_orcamentos) * 100).toFixed(1)
              : '0'
            }%
          </div>
        </>
      )}
    </div>
  );
}
