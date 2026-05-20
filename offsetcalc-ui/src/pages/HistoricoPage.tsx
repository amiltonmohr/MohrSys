import { useState, useEffect } from 'react';

interface Quote {
  id: string;
  numero: string;
  cliente: string;
  data: string;
  total: number;
  status: 'rascunho' | 'enviado' | 'aceito' | 'recusado';
  material: string;
  tiragem: number;
}

export default function HistoricoPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/v1/quotes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) {
        setQuotes(data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    const matchStatus = filtroStatus === 'todos' || q.status === filtroStatus;
    const matchSearch = q.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       q.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aceito': return '#10b981';
      case 'enviado': return '#f59e0b';
      case 'rascunho': return '#6b7280';
      case 'recusado': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'rascunho': 'Rascunho',
      'enviado': 'Enviado',
      'aceito': 'Aceito',
      'recusado': 'Recusado'
    };
    return labels[status] || status;
  };

  return (
    <div className="section active">
      <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>
        Histórico de <span style={{ color: 'var(--accent)' }}>Orçamentos</span>
      </h2>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="field">
            <label>Pesquisar Orçamento</label>
            <input
              type="text"
              placeholder="Número ou Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Filtrar por Status</label>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="todos">Todos os Status</option>
              <option value="rascunho">Rascunho</option>
              <option value="enviado">Enviado</option>
              <option value="aceito">Aceito</option>
              <option value="recusado">Recusado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Orçamentos ({filteredQuotes.length})</div>

        {loading ? (
          <p style={{ padding: '20px', color: 'var(--text2)' }}>Carregando...</p>
        ) : filteredQuotes.length > 0 ? (
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
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Material</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: 'var(--text2)' }}>Tiragem</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: 'var(--text2)' }}>Total</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600, color: 'var(--text2)' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((q) => (
                  <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--accent)' }}>{q.numero}</td>
                    <td style={{ padding: '10px' }}>{q.cliente}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: 'var(--text2)' }}>{q.material}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px' }}>
                      {q.tiragem.toLocaleString('pt-BR')}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                      R$ {q.total.toFixed(2)}
                    </td>
                    <td style={{
                      padding: '10px',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        background: getStatusColor(q.status),
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {getStatusLabel(q.status)}
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
          <p style={{ padding: '20px', color: 'var(--text2)' }}>Nenhum orçamento encontrado</p>
        )}
      </div>

      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'var(--surface2)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'var(--text2)'
      }}>
        <strong>Total de orçamentos:</strong> {quotes.length} •
        <strong style={{ marginLeft: '10px' }}>Aceitos:</strong> {quotes.filter(q => q.status === 'aceito').length} •
        <strong style={{ marginLeft: '10px' }}>Enviados:</strong> {quotes.filter(q => q.status === 'enviado').length}
      </div>
    </div>
  );
}
