import { useState, useEffect } from 'react';

interface Material {
  tipo: string;
  gramatura: string;
  precoPorKg: number;
}

interface Maquina {
  nome: string;
}

interface QuoteResult {
  subtotal: number;
  margem: number;
  total: number;
  unitario: number;
  num_chapas: number;
  folhas_brutas: number;
  consumo_tinta_kg: number;
  horas_maquina: number;
}

export default function CalculoPage() {
  const [jobRef, setJobRef] = useState('');
  const [cliente, setCliente] = useState('');
  const [jobData, setJobData] = useState('');
  const [prazo, setPrazo] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState('simples');
  const [papel, setPapel] = useState('');
  const [gramatura, setGramatura] = useState('');
  const [largura, setLargura] = useState('');
  const [altura, setAltura] = useState('');
  const [tiragem, setTiragem] = useState('');
  const [coresF, setCoresF] = useState('4');
  const [coresV, setCoresV] = useState('0');
  const [grafismo, setGrafismo] = useState('0.7');
  const [margem, setMargem] = useState('30');
  const [urgencia, setUrgencia] = useState('0');
  const [maquina, setMaquina] = useState('');
  const [resultado, setResultado] = useState<QuoteResult | null>(null);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);

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
        setMateriais(data.data.materials);
        setMaquinas(data.data.machines);
      }
    } catch (err) {
      console.error('Erro ao carregar config:', err);
    }
  };

  const calcular = async () => {
    if (!largura || !altura || !tiragem || !maquina) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:3000/api/v1/quotes/calculate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_type: tipoMaterial,
          paper_type: papel,
          paper_gramatura: gramatura,
          width_cm: parseFloat(largura),
          height_cm: parseFloat(altura),
          quantity: parseInt(tiragem),
          colors_front: parseInt(coresF),
          colors_back: parseInt(coresV),
          grafismo: parseFloat(grafismo),
          margin_pct: parseInt(margem),
          urgency_pct: parseInt(urgencia),
          machine_name: maquina,
          finishing_specs: []
        })
      });

      const data = await res.json();
      if (data.data) {
        setResultado(data.data);
      }
    } catch (err) {
      console.error('Erro ao calcular:', err);
    }
  };

  const limpar = () => {
    setJobRef('');
    setCliente('');
    setPapel('');
    setGramatura('');
    setLargura('');
    setAltura('');
    setTiragem('');
    setCoresF('4');
    setCoresV('0');
    setMaquina('');
    setResultado(null);
  };

  return (
    <div className="section active">
      <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '20px' }}>
        Novo <span style={{ color: 'var(--accent)' }}>Cálculo</span>
      </h2>

      <div className="section-grid">
        {/* COLUNA 1 - Identificação */}
        <div>
          <div className="card">
            <div className="card-title">Identificação do Job</div>

            <div className="field">
              <label>Número / Referência</label>
              <input
                type="text"
                value={jobRef}
                onChange={(e) => setJobRef(e.target.value)}
                placeholder="ORC-2025-001"
              />
            </div>

            <div className="field">
              <label>Cliente</label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Digite o nome..."
              />
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Data</label>
                <input
                  type="date"
                  value={jobData}
                  onChange={(e) => setJobData(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Prazo de Entrega</label>
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Tipo de Material</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['simples', 'bloco', 'revista'].map((tipo) => (
                  <button
                    key={tipo}
                    style={{
                      padding: '10px 8px',
                      background: tipoMaterial === tipo ? 'var(--accent)' : 'var(--surface2)',
                      color: tipoMaterial === tipo ? '#fff' : 'var(--text)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '11px'
                    }}
                    onClick={() => setTipoMaterial(tipo)}
                  >
                    {tipo === 'simples' && '🖨 Simples'}
                    {tipo === 'bloco' && '📋 Bloco'}
                    {tipo === 'revista' && '📖 Revista'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 2 - Especificações */}
        <div>
          <div className="card">
            <div className="card-title">Especificações de Impressão</div>

            <div className="grid-2">
              <div className="field">
                <label>Tipo de Papel</label>
                <select value={papel} onChange={(e) => setPapel(e.target.value)}>
                  <option value="">— selecione —</option>
                  {materiais.map((m: Material) => (
                    <option key={m.tipo} value={m.tipo}>
                      {m.tipo} ({m.gramatura})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Gramatura</label>
                <input
                  type="text"
                  value={gramatura}
                  onChange={(e) => setGramatura(e.target.value)}
                  placeholder="115g"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Formato Final (cm)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={largura}
                    onChange={(e) => setLargura(e.target.value)}
                    placeholder="Larg."
                    step="0.1"
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '14px' }}>×</span>
                  <input
                    type="number"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    placeholder="Alt."
                    step="0.1"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div className="field">
                <label>Tiragem (unidades)</label>
                <input
                  type="number"
                  value={tiragem}
                  onChange={(e) => setTiragem(e.target.value)}
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Cores Frente</label>
                <select value={coresF} onChange={(e) => setCoresF(e.target.value)}>
                  <option value="0">0 cores</option>
                  <option value="1">1 cor (P&B)</option>
                  <option value="2">2 cores</option>
                  <option value="3">3 cores</option>
                  <option value="4">4 cores (CMYK)</option>
                </select>
              </div>
              <div className="field">
                <label>Cores Verso</label>
                <select value={coresV} onChange={(e) => setCoresV(e.target.value)}>
                  <option value="0">0 cores</option>
                  <option value="1">1 cor (P&B)</option>
                  <option value="2">2 cores</option>
                  <option value="3">3 cores</option>
                  <option value="4">4 cores (CMYK)</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Tipo de Grafismo</label>
              <select value={grafismo} onChange={(e) => setGrafismo(e.target.value)}>
                <option value="0.2">Só texto</option>
                <option value="0.4">Retícula 40%</option>
                <option value="0.7">Retícula 70% (típico 4 cores)</option>
                <option value="1.0">Chapado / Cores sólidas</option>
                <option value="1.2">Chapado transparente</option>
              </select>
            </div>
          </div>
        </div>

        {/* COLUNA 3 - Parâmetros e Resultados */}
        <div>
          <div className="card">
            <div className="card-title">Parâmetros Operacionais</div>

            <div className="grid-2">
              <div className="field">
                <label>Máquina</label>
                <select value={maquina} onChange={(e) => setMaquina(e.target.value)}>
                  <option value="">— selecione —</option>
                  {maquinas.map((m: Maquina) => (
                    <option key={m.nome} value={m.nome}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>% Margem de Lucro</label>
                <input
                  type="number"
                  value={margem}
                  onChange={(e) => setMargem(e.target.value)}
                  min="0"
                  max="300"
                />
              </div>
            </div>

            <div className="field">
              <label>% Urgência (adicional)</label>
              <input
                type="number"
                value={urgencia}
                onChange={(e) => setUrgencia(e.target.value)}
                min="0"
                max="100"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={calcular}>
                Calcular
              </button>
              <button className="btn btn-secondary" onClick={limpar}>
                Limpar
              </button>
            </div>
          </div>

          {resultado && (
            <div className="result-section">
              <div className="result-title">Resultado do Orçamento</div>

              <div className="result-grid">
                <div className="result-item">
                  <div className="result-item-label">Subtotal</div>
                  <div className="result-item-value">
                    R$ {resultado.subtotal.toFixed(2)}
                  </div>
                </div>
                <div className="result-item">
                  <div className="result-item-label">Margem</div>
                  <div className="result-item-value">
                    R$ {resultado.margem.toFixed(2)}
                  </div>
                </div>
                <div className="result-item">
                  <div className="result-item-label">Total</div>
                  <div className="result-item-value highlight">
                    R$ {resultado.total.toFixed(2)}
                  </div>
                </div>
                <div className="result-item">
                  <div className="result-item-label">Unitário</div>
                  <div className="result-item-value green">
                    R$ {resultado.unitario.toFixed(4)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
                <p><strong>Chapas:</strong> {resultado.num_chapas}</p>
                <p><strong>Folhas:</strong> {resultado.folhas_brutas}</p>
                <p><strong>Tinta:</strong> {resultado.consumo_tinta_kg.toFixed(3)} kg</p>
                <p><strong>Máquina:</strong> {resultado.horas_maquina.toFixed(2)} horas</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
