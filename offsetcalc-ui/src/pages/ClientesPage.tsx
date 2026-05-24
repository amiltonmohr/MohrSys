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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);

  const set = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    const qNum = q.replace(/\D/g, '');
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(q) ||
      (c.tel || '').includes(q) ||
      (qNum && (c.doc || '').replace(/\D/g, '').includes(qNum)) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.cidade || '').toLowerCase().includes(q)
    );
  }, [clientes, search]);

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
  };

  const handleCancel = () => {
    setDraft(emptyDraft());
    setEditId(null);
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

  const abrirEditForm = (c: Cliente) => {
    setDraft({
      nome: c.nome, tipo: c.tipo || 'pf', doc: c.doc || '', tel: c.tel || '',
      email: c.email || '', cep: c.cep || '', uf: c.uf || 'SC',
      rua: c.rua || '', num: c.num || '', bairro: c.bairro || '',
      cidade: c.cidade || '', obs: c.obs || '',
    });
    setEditId(c.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDocChange = async (v: string) => {
    const masked = maskDoc(v, draft.tipo || 'pf');
    set({ doc: masked });
    if (draft.tipo === 'pj' && masked.replace(/\D/g, '').length === 14) {
      setCnpjLoading(true);
      toast('Buscando CNPJ...');
      const dados = await buscarCnpj(masked);
      if (dados) { set(dados as Partial<Draft>); toast('Dados preenchidos automaticamente!'); }
      else toast('CNPJ não encontrado');
      setCnpjLoading(false);
    }
  };

  const handleCepBlur = async () => {
    if (!draft.cep || draft.cep.replace(/\D/g, '').length !== 8) return;
    setCepLoading(true);
    const dados = await buscarCep(draft.cep);
    if (dados) set(dados as Partial<Draft>);
    setCepLoading(false);
  };

  return (
    <div className="section active">
      <div className="section-header">
        <h2>Cadastro de <span>Clientes</span></h2>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>

        {/* ── COLUNA ESQUERDA: formulário ─────────────────────────────── */}
        <div className="card">
          <div className="card-title">{editId ? 'Editar Cliente' : 'Novo Cliente'}</div>

          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
            Identificação
          </div>

          <div className="field">
            <label>Nome / Razão Social</label>
            <input type="text" value={draft.nome} onChange={e => set({ nome: e.target.value })}
              placeholder="Nome completo ou empresa" />
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

          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 8px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
            Endereço
          </div>

          <div className="grid-2">
            <div className="field">
              <label>CEP {cepLoading && <span style={{ color: 'var(--accent2)', fontSize: '10px', fontWeight: 400, textTransform: 'none' }}>buscando...</span>}</label>
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
                placeholder="123" />
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

          <div className="field">
            <label>Observações</label>
            <textarea value={draft.obs || ''} onChange={e => set({ obs: e.target.value })} rows={2}
              placeholder="Prazo especial, condições de pagamento, preferências..."
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: 'var(--text)', fontFamily: 'var(--mono)', fontSize: '12px', resize: 'vertical', outline: 'none', transition: 'border-color .2s,box-shadow .2s' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSalvar}>
              Salvar Cliente
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>Cancelar</button>
          </div>
        </div>

        {/* ── COLUNA DIREITA: lista ───────────────────────────────────── */}
        <div>
          <div className="card">
            <div className="card-title">Clientes Cadastrados</div>
            <div className="field">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, CPF/CNPJ, telefone ou cidade..." />
            </div>

            <div id="lista-clientes">
              {filtered.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: '12px', textAlign: 'center', padding: '30px 0' }}>
                  {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </div>
              ) : filtered.map(c => {
                const endParts = [
                  c.rua ? (c.rua + (c.num ? ', ' + c.num : '')) : '',
                  (c.cidade && c.uf) ? c.cidade + '/' + c.uf : (c.cidade || c.uf || ''),
                ].filter(Boolean);
                return (
                  <div key={c.id} className="cli-row">
                    <div className="cli-info" style={{ flex: 1, minWidth: 0 }}>
                      <div className="cli-nome">
                        {c.nome}
                        {c.tipo === 'pj' && (
                          <span style={{ fontSize: '9px', background: 'rgba(124,58,237,.12)', color: 'var(--accent)', borderRadius: '3px', padding: '1px 5px', fontFamily: 'var(--display)', fontWeight: 700, verticalAlign: 'middle', marginLeft: '5px' }}>PJ</span>
                        )}
                      </div>
                      {c.doc && <div className="cli-tel" style={{ color: 'var(--text2)' }}>{c.tipo === 'pj' ? 'CNPJ' : 'CPF'}: {c.doc}</div>}
                      {c.tel && <div className="cli-tel">📞 {c.tel}</div>}
                      {c.email && <div className="cli-tel">✉ {c.email}</div>}
                      {endParts.length > 0 && <div className="cli-tel" style={{ color: 'var(--text3)' }}>📍 {endParts.join(' · ')}</div>}
                    </div>
                    <div className="cli-actions" style={{ flexShrink: 0 }}>
                      <button className="btn-icon" onClick={() => irParaOrcamento(c)}>→ Orçamento</button>
                      <button className="btn-icon" onClick={() => abrirEditForm(c)}>✎</button>
                      <button className="btn-icon" onClick={() => setDeleteId(c.id)}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de exclusão */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-pop" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', width: '380px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(124,58,237,.2)' }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: '15px', color: 'var(--accent)', marginBottom: '10px' }}>Excluir cliente?</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
              <strong>{clientes.find(c => c.id === deleteId)?.nome}</strong>
              <br />Esta ação não pode ser desfeita.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" style={{ flex: 1, background: '#e11d48', boxShadow: '0 2px 8px rgba(225,29,72,.3)' }}
                onClick={() => handleDelete(deleteId)}>Excluir</button>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
