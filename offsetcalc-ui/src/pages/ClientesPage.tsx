import { useState, useEffect } from 'react';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  cnpj?: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/v1/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) {
        setClientes(data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    }
  };

  const adicionarCliente = async () => {
    if (!nome || !email) {
      alert('Preencha nome e email');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/v1/clients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nome, email, telefone, cidade, estado, cnpj })
      });

      if (res.ok) {
        setNome('');
        setEmail('');
        setTelefone('');
        setCidade('');
        setEstado('');
        setCnpj('');
        setShowForm(false);
        carregarClientes();
      }
    } catch (err) {
      console.error('Erro ao adicionar cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section active">
      <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>
        Gerenciar <span style={{ color: 'var(--accent)' }}>Clientes</span>
      </h2>

      <div style={{ marginBottom: '20px' }}>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancelar' : '+ Novo Cliente'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Adicionar Cliente</div>

          <div className="grid-2">
            <div className="field">
              <label>Nome / Razão Social</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite o nome..."
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>CNPJ</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Cidade</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="São Paulo"
              />
            </div>
            <div className="field">
              <label>Estado</label>
              <input
                type="text"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                placeholder="SP"
              />
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={adicionarCliente}
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            {loading ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-title">Lista de Clientes ({clientes.length})</div>
        {clientes.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Nome</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Telefone</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Cidade</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px' }}>{cliente.nome}</td>
                    <td style={{ padding: '10px', fontSize: '12px', color: 'var(--text2)' }}>{cliente.email}</td>
                    <td style={{ padding: '10px', fontSize: '12px' }}>{cliente.telefone || '—'}</td>
                    <td style={{ padding: '10px', fontSize: '12px' }}>{cliente.cidade || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ padding: '20px', color: 'var(--text2)' }}>Nenhum cliente cadastrado</p>
        )}
      </div>
    </div>
  );
}
