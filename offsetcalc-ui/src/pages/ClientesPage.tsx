import { useState, useMemo } from 'react';
import { useApp, Cliente } from '../context/AppContext';

type Secao = 'orcamento' | 'clientes' | 'config' | 'historico' | 'dashboard';

interface Props {
  onGoTo: (s: Secao) => void;
}

export default function ClientesPage({ onGoTo }: Props) {
  const { clientes, addCliente, editCliente, removeCliente, toast } = useApp();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTel, setNovoTel] = useState('');

  // Edição inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTel, setEditTel] = useState('');

  // Confirmação de exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(q) || c.tel.toLowerCase().includes(q)
    );
  }, [clientes, search]);

  const handleAdd = () => {
    if (!novoNome.trim()) { toast('Informe o nome do cliente'); return; }
    addCliente(novoNome.trim(), novoTel.trim());
    setNovoNome(''); setNovoTel(''); setShowForm(false);
    toast('Cliente adicionado!');
  };

  const startEdit = (c: Cliente) => {
    setEditId(c.id); setEditNome(c.nome); setEditTel(c.tel);
  };

  const confirmEdit = () => {
    if (!editId || !editNome.trim()) return;
    editCliente(editId, editNome.trim(), editTel.trim());
    setEditId(null);
    toast('Cliente atualizado!');
  };

  const cancelEdit = () => setEditId(null);

  const handleDelete = (id: string) => {
    removeCliente(id);
    setDeleteId(null);
    toast('Cliente removido.');
  };

  const irParaOrcamento = (c: Cliente) => {
    localStorage.setItem('mohrsys_goto_cliente', c.nome);
    onGoTo('orcamento');
  };

  // KPI
  const total = clientes.length;
  const recentes = clientes.filter(c => Date.now() - c.ts < 30 * 24 * 3600 * 1000).length;

  return (
    <div className="section active">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
          Gerenciar <span style={{ color: 'var(--accent)' }}>Clientes</span>
        </h2>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancelar' : '+ Novo Cliente'}
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total de Clientes</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{total}</div>
        </div>
        <div className="card" style={{ padding: '16px', margin: 0 }}>
          <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Cadastrados (30 dias)</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--mono)' }}>{recentes}</div>
        </div>
      </div>

      {/* Formulário de adição */}
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Novo Cliente</div>
          <div className="grid-2">
            <div className="field">
              <label>Nome / Razão Social</label>
              <input
                type="text" value={novoNome} onChange={e => setNovoNome(e.target.value)}
                placeholder="Digite o nome..." autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input
                type="tel" value={novoTel} onChange={e => setNovoTel(e.target.value)}
                placeholder="(00) 00000-0000"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>Salvar Cliente</button>
        </div>
      )}

      {/* Busca */}
      <div className="card">
        <div className="field" style={{ margin: 0, marginBottom: filtered.length > 0 ? '16px' : 0 }}>
          <label>Pesquisar</label>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nome ou telefone..."
          />
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text2)', fontSize: '13px' }}>
            {search ? 'Nenhum cliente encontrado para a pesquisa.' : 'Nenhum cliente cadastrado ainda.'}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px', fontWeight: 600 }}>
              {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
              {search && ` encontrado${filtered.length !== 1 ? 's' : ''}`}
            </div>

            {filtered.map(c => (
              <div key={c.id} className="cli-row" style={{ borderRadius: '6px' }}>
                {editId === c.id ? (
                  // Modo edição
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                    <input
                      value={editNome} onChange={e => setEditNome(e.target.value)}
                      style={{ flex: 2, minWidth: '140px', background: 'var(--surface2)', border: '1px solid var(--accent)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px' }}
                      autoFocus onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }}
                    />
                    <input
                      value={editTel} onChange={e => setEditTel(e.target.value)}
                      placeholder="Telefone"
                      style={{ flex: 1, minWidth: '120px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '13px' }}
                      onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') cancelEdit(); }}
                    />
                    <button className="btn btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={confirmEdit}>OK</button>
                    <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={cancelEdit}>Cancelar</button>
                  </div>
                ) : (
                  // Modo visualização
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.nome}</div>
                      {c.tel && <div className="cli-tel">{c.tel}</div>}
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                        Cadastrado em {new Date(c.ts).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}
                        onClick={() => irParaOrcamento(c)}
                        title="Abrir cálculo com este cliente">
                        → Orçamento
                      </button>
                      <button className="btn-icon" onClick={() => startEdit(c)} title="Editar">✎</button>
                      <button className="btn-icon" onClick={() => setDeleteId(c.id)} title="Excluir"
                        style={{ color: '#ef4444' }}>✕</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '28px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>🗑️</div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Excluir cliente?</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
              <strong>{clientes.find(c => c.id === deleteId)?.nome}</strong><br />
              Esta ação não pode ser desfeita.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => handleDelete(deleteId)}
                style={{ background: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,.3)' }}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
