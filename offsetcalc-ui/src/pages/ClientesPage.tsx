import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Cliente } from '../context/AppContext';

type Secao = 'orcamento' | 'clientes' | 'config' | 'historico' | 'dashboard';

interface Props {
  onGoTo: (s: Secao) => void;
}

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function maskTel(v: string): string {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/\(\).*/, '');
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

function maskCep(v: string): string {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{1,3})/, '$1-$2');
}

function maskDoc(v: string, tipo: 'pf' | 'pj'): string {
  const n = v.replace(/\D/g, '');
  if (tipo === 'pf') {
    return n.slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return n.slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

async function buscarCnpj(cnpj: string): Promise<Partial<Draft> | null> {
  const v = cnpj.replace(/\D/g, '');
  if (v.length !== 14) return null;
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${v}`);
    if (!r.ok) return null;
    const d = await r.json();
    const nome = (d.nome_fantasia?.trim())
      ? `${d.razao_social} (${d.nome_fantasia.trim()})`
      : d.razao_social || '';
    const cepFmt = (d.cep || '').replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2');
    const telRaw = (d.telefone || '').split('/')[0].trim().replace(/\D/g, '').slice(0, 11);
    const tel = telRaw.length > 10
      ? telRaw.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
      : telRaw.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    return {
      nome,
      cep: cepFmt,
      rua: d.logradouro || '',
      num: d.numero || '',
      bairro: d.bairro || '',
      cidade: d.municipio || '',
      uf: d.uf || '',
      ...(tel ? { tel } : {}),
      ...(d.email ? { email: (d.email as string).toLowerCase() } : {}),
    };
  } catch { return null; }
}

async function buscarCep(cep: string): Promise<Partial<Cliente> | null> {
  const n = cep.replace(/\D/g, '');
  if (n.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${n}/json/`);
    const d = await res.json();
    if (d.erro) return null;
    return { rua: d.logradouro || '', bairro: d.bairro || '', cidade: d.localidade || '', uf: d.uf || '' };
  } catch { return null; }
}

type Draft = Omit<Cliente, 'id' | 'ts'>;
const emptyDraft = (): Draft => ({
  nome: '', tipo: 'pf', doc: '', tel: '', email: '',
  cep: '', uf: 'SC', rua: '', num: '', bairro: '', cidade: '', obs: '',
});

export default function ClientesPage({ onGoTo }: Props) {
  const { clientes, addCliente, editCliente, removeCliente, toast } = useApp();
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);

  const set = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(q) ||
      (c.tel || '').includes(q) ||
      (c.doc || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      (c.cidade || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  }, [clientes, search]);

  const recentes30 = useMemo(() => {
    const corte = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return clientes.filter(c => c.ts > corte).length;
  }, [clientes]);

  const abrirNovoForm = () => {
    setDraft(emptyDraft());
    setEditId(null);
    setShowForm(true);
  };

  const abrirEditForm = (c: Cliente) => {
    setDraft({
      nome: c.nome, tipo: c.tipo || 'pf', doc: c.doc || '', tel: c.tel || '',
      email: c.email || '', cep: c.cep || '', uf: c.uf || 'SC',
      rua: c.rua || '', num: c.num || '', bairro: c.bairro || '',
      cidade: c.cidade || '', obs: c.obs || '',
    });
    setEditId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSalvar = () => {
    if (!draft.nome.trim()) { toast('Informe o nome do cliente'); return; }
    if (editId) {
      editCliente(editId, draft);
      toast('Cliente atualizado!');
    } else {
      addCliente(draft);
      toast('Cliente cadastrado!');
    }
    setDraft(emptyDraft());
    setEditId(null);
    setShowForm(false);
  };

  const handleCancel = () => {
    setDraft(emptyDraft());
    setEditId(null);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    removeCliente(id);
    setDeleteId(null);
    toast('Cliente removido.');
  };

  const irParaOrcamento = (c: Cliente) => {
    localStorage.setItem('mohrsys_goto_cliente', c.nome);
    onGoTo('orcamento');
  };

  const handleDocChange = async (v: string) => {
    const masked = maskDoc(v, draft.tipo || 'pf');
    set({ doc: masked });
    if (draft.tipo === 'pj' && masked.replace(/\D/g, '').length === 14) {
      setCnpjLoading(true);
      toast('🔍 Buscando CNPJ...');
      const dados = await buscarCnpj(masked);
      if (dados) { set(dados); toast('✅ Dados preenchidos automaticamente!'); }
      else toast('CNPJ não encontrado');
      setCnpjLoading(false);
    }
  };

  const handleCepBlur = async () => {
    if (!draft.cep || draft.cep.replace(/\D/g, '').length !== 8) return;
    setCepLoading(true);
    const dados = await buscarCep(draft.cep);
    if (dados) set(dados);
    setCepLoading(false);
  };

  return (
    <div className="section active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
          Cadastro de <span style={{ color: 'var(--accent)' }}>Clientes</span>
        </h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={abrirNovoForm}>+ Novo Cliente</button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total de Clientes', value: clientes.length, color: 'var(--accent)' },
          { label: 'Cadastrados 30 dias', value: recentes30, color: '#10b981' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '16px', margin: 0 }}>
            <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: k.color, fontFamily: 'var(--mono)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Formulário de cadastro/edição */}
      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">{editId ? 'Editar Cliente' : 'Novo Cliente'}</div>

          {/* Identificação */}
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
            Identificação
          </div>
          <div className="field">
            <label>Nome / Razão Social</label>
            <input type="text" value={draft.nome} onChange={e => set({ nome: e.target.value })}
              placeholder="Nome completo ou empresa" autoFocus />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Tipo</label>
              <select value={draft.tipo} onChange={e => set({ tipo: e.target.value as 'pf' | 'pj', doc: '' })}>
                <option value="pf">Pessoa Física</option>
                <option value="pj">Pessoa Jurídica</option>
              </select>
            </div>
            <div className="field">
              <label>{draft.tipo === 'pj' ? 'CNPJ' : 'CPF'}</label>
              <input type="text" value={draft.doc || ''}
                onChange={e => handleDocChange(e.target.value)}
                placeholder={draft.tipo === 'pj' ? '00.000.000/0001-00' : '000.000.000-00'}
                style={cnpjLoading ? { borderColor: 'var(--accent2)' } : undefined} />
            </div>
          </div>

          {/* Contato */}
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
            Contato
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Telefone / WhatsApp</label>
              <input type="tel" value={draft.tel || ''}
                onChange={e => set({ tel: maskTel(e.target.value) })}
                placeholder="(47) 99999-9999" />
            </div>
            <div className="field">
              <label>E-mail</label>
              <input type="email" value={draft.email || ''}
                onChange={e => set({ email: e.target.value })}
                placeholder="cliente@email.com" />
            </div>
          </div>

          {/* Endereço */}
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
            Endereço
          </div>
          <div className="grid-2">
            <div className="field">
              <label>CEP {cepLoading && <span style={{ color: 'var(--accent2)', fontSize: '10px' }}>buscando...</span>}</label>
              <input type="text" value={draft.cep || ''}
                onChange={e => set({ cep: maskCep(e.target.value) })}
                onBlur={handleCepBlur}
                placeholder="00000-000" />
            </div>
            <div className="field">
              <label>Estado (UF)</label>
              <select value={draft.uf || ''} onChange={e => set({ uf: e.target.value })}>
                <option value="">— UF —</option>
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Logradouro</label>
              <input type="text" value={draft.rua || ''}
                onChange={e => set({ rua: e.target.value })}
                placeholder="Rua, Avenida..." />
            </div>
            <div className="field">
              <label>Número</label>
              <input type="text" value={draft.num || ''}
                onChange={e => set({ num: e.target.value })}
                placeholder="123" style={{ maxWidth: '100px' }} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Bairro</label>
              <input type="text" value={draft.bairro || ''}
                onChange={e => set({ bairro: e.target.value })}
                placeholder="Centro" />
            </div>
            <div className="field">
              <label>Cidade</label>
              <input type="text" value={draft.cidade || ''}
                onChange={e => set({ cidade: e.target.value })}
                placeholder="Blumenau" />
            </div>
          </div>

          {/* Observações */}
          <div className="field">
            <label>Observações</label>
            <textarea value={draft.obs || ''} onChange={e => set({ obs: e.target.value })} rows={2}
              placeholder="Prazo especial, condições de pagamento, preferências..."
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '12px', resize: 'vertical', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSalvar}>
              {editId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Busca + lista */}
      <div className="card">
        <div className="field" style={{ margin: 0, marginBottom: filtered.length > 0 ? '16px' : 0 }}>
          <label>Pesquisar</label>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nome, CPF/CNPJ, telefone, e-mail ou cidade..." />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text2)', fontSize: '13px' }}>
            {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px', fontWeight: 600 }}>
              {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
              {search && ` encontrado${filtered.length !== 1 ? 's' : ''}`}
            </div>

            {filtered.map(c => (
              <div key={c.id} className="cli-row" style={{ borderRadius: '6px', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', width: '100%', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>
                      {c.nome}
                      {c.tipo && (
                        <span style={{ marginLeft: '6px', fontSize: '10px', padding: '1px 5px', borderRadius: '4px', background: c.tipo === 'pj' ? 'rgba(124,58,237,.12)' : 'rgba(16,185,129,.1)', color: c.tipo === 'pj' ? 'var(--accent)' : '#10b981', fontWeight: 700 }}>
                          {c.tipo === 'pj' ? 'PJ' : 'PF'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {c.doc && <span>{c.doc}</span>}
                      {c.tel && <span>{c.tel}</span>}
                      {c.email && <span>{c.email}</span>}
                      {(c.cidade || c.uf) && <span>{[c.cidade, c.uf].filter(Boolean).join(' — ')}</span>}
                    </div>
                    {c.obs && (
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px', fontStyle: 'italic' }}>
                        {c.obs.slice(0, 80)}{c.obs.length > 80 ? '…' : ''}
                      </div>
                    )}
                    <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>
                      Cadastrado em {new Date(c.ts).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }}
                      onClick={() => irParaOrcamento(c)} title="Abrir cálculo com este cliente">
                      → Orçamento
                    </button>
                    <button className="btn-icon" onClick={() => abrirEditForm(c)} title="Editar">✎</button>
                    <button className="btn-icon" onClick={() => setDeleteId(c.id)} title="Excluir"
                      style={{ color: '#ef4444' }}>✕</button>
                  </div>
                </div>
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
