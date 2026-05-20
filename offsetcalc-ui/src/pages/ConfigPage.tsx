import { useState, useEffect } from 'react';

interface Material {
  id: string;
  tipo: string;
  gramatura: string;
  preco_kg: number;
  fator_absorcao: number;
}

interface Maquina {
  id: string;
  nome: string;
  largura_util_cm: number;
  altura_util_cm: number;
  cpm: number;
  setup_minutos: number;
}

export default function ConfigPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [machines, setMachines] = useState<Maquina[]>([]);
  const [activeTab, setActiveTab] = useState('materiais');
  const [loading, setLoading] = useState(false);

  // Material form
  const [matTipo, setMatTipo] = useState('');
  const [matGramatura, setMatGramatura] = useState('');
  const [matPreco, setMatPreco] = useState('');
  const [matFator, setMatFator] = useState('');

  // Machine form
  const [maqNome, setMaqNome] = useState('');
  const [maqLargura, setMaqLargura] = useState('');
  const [maqAltura, setMaqAltura] = useState('');
  const [maqCpm, setMaqCpm] = useState('');
  const [maqSetup, setMaqSetup] = useState('');

  useEffect(() => {
    carregarConfig();
  }, []);

  const carregarConfig = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/v1/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) {
        setMaterials(data.data.materials);
        setMachines(data.data.machines);
      }
    } catch (err) {
      console.error('Erro ao carregar config:', err);
    }
  };

  const adicionarMaterial = async () => {
    if (!matTipo || !matGramatura || !matPreco) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/v1/config/materials', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: matTipo,
          gramatura: matGramatura,
          preco_kg: parseFloat(matPreco),
          fator_absorcao: parseFloat(matFator) || 1.0
        })
      });

      if (res.ok) {
        setMatTipo('');
        setMatGramatura('');
        setMatPreco('');
        setMatFator('');
        carregarConfig();
      } else {
        alert('Erro ao salvar material');
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const adicionarMaquina = async () => {
    if (!maqNome || !maqLargura || !maqAltura || !maqCpm) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/v1/config/machines', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: maqNome,
          largura_util_cm: parseFloat(maqLargura),
          altura_util_cm: parseFloat(maqAltura),
          cpm: parseFloat(maqCpm),
          setup_minutos: parseFloat(maqSetup) || 15
        })
      });

      if (res.ok) {
        setMaqNome('');
        setMaqLargura('');
        setMaqAltura('');
        setMaqCpm('');
        setMaqSetup('');
        carregarConfig();
      } else {
        alert('Erro ao salvar máquina');
      }
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section active">
      <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>
        ⚙️ <span style={{ color: 'var(--accent)' }}>Configurações</span>
      </h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
        <button
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'materiais' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'materiais' ? '#fff' : 'var(--text)',
            cursor: 'pointer',
            borderRadius: '6px 6px 0 0',
            fontWeight: 600
          }}
          onClick={() => setActiveTab('materiais')}
        >
          Materiais
        </button>
        <button
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'maquinas' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'maquinas' ? '#fff' : 'var(--text)',
            cursor: 'pointer',
            borderRadius: '6px 6px 0 0',
            fontWeight: 600
          }}
          onClick={() => setActiveTab('maquinas')}
        >
          Máquinas
        </button>
      </div>

      {activeTab === 'materiais' && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title">Adicionar Material</div>

            <div className="grid-2">
              <div className="field">
                <label>Tipo de Papel</label>
                <input
                  type="text"
                  value={matTipo}
                  onChange={(e) => setMatTipo(e.target.value)}
                  placeholder="ex: Couchê, Offset, Couché..."
                />
              </div>
              <div className="field">
                <label>Gramatura</label>
                <input
                  type="text"
                  value={matGramatura}
                  onChange={(e) => setMatGramatura(e.target.value)}
                  placeholder="ex: 115g, 240g..."
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Preço por kg (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={matPreco}
                  onChange={(e) => setMatPreco(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="field">
                <label>Fator de Absorção</label>
                <input
                  type="number"
                  step="0.01"
                  value={matFator}
                  onChange={(e) => setMatFator(e.target.value)}
                  placeholder="1.0"
                />
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={adicionarMaterial}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Adicionar Material'}
            </button>
          </div>

          <div className="card">
            <div className="card-title">Materiais Cadastrados ({materials.length})</div>
            {materials.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Tipo</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Gramatura</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--text2)' }}>R$/kg</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--text2)' }}>Fator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px' }}>{m.tipo}</td>
                        <td style={{ padding: '8px' }}>{m.gramatura}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>R$ {m.preco_kg.toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{m.fator_absorcao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ padding: '20px', color: 'var(--text2)' }}>Nenhum material cadastrado</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'maquinas' && (
        <>
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-title">Adicionar Máquina</div>

            <div className="field">
              <label>Nome da Máquina</label>
              <input
                type="text"
                value={maqNome}
                onChange={(e) => setMaqNome(e.target.value)}
                placeholder="ex: GTO 52 (4 cores)"
              />
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Largura Útil (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={maqLargura}
                  onChange={(e) => setMaqLargura(e.target.value)}
                  placeholder="52"
                />
              </div>
              <div className="field">
                <label>Altura Útil (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={maqAltura}
                  onChange={(e) => setMaqAltura(e.target.value)}
                  placeholder="74"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>CPM (cópias/minuto)</label>
                <input
                  type="number"
                  value={maqCpm}
                  onChange={(e) => setMaqCpm(e.target.value)}
                  placeholder="5000"
                />
              </div>
              <div className="field">
                <label>Setup (minutos)</label>
                <input
                  type="number"
                  value={maqSetup}
                  onChange={(e) => setMaqSetup(e.target.value)}
                  placeholder="15"
                />
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={adicionarMaquina}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Adicionar Máquina'}
            </button>
          </div>

          <div className="card">
            <div className="card-title">Máquinas Cadastradas ({machines.length})</div>
            {machines.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Nome</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontWeight: 600, color: 'var(--text2)' }}>Útil</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--text2)' }}>CPM</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--text2)' }}>Setup</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px' }}>{m.nome}</td>
                        <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--text2)' }}>
                          {m.largura_util_cm}×{m.altura_util_cm}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{m.cpm}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{m.setup_minutos}min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ padding: '20px', color: 'var(--text2)' }}>Nenhuma máquina cadastrada</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
