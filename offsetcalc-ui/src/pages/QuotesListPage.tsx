import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quoteService } from '../services/quoteService';
import { Quote, PaginatedResponse } from '../types';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho', sent: 'Enviado', accepted: 'Aprovado', rejected: 'Rejeitado', archived: 'Arquivado',
};

export default function QuotesListPage() {
  const [data, setData] = useState<PaginatedResponse<Quote> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await quoteService.list({ page, limit: 15, search: search || undefined });
    setData(res);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, search]);

  const handleStatusChange = async (id: string, status: Quote['status']) => {
    await quoteService.update(id, { status });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black font-display text-gray-800">
          Gestão de <span className="text-accent-600">Orçamentos</span>
        </h1>
        <Link
          to="/quotes/new"
          className="px-5 py-2.5 bg-accent-600 text-white font-bold font-display uppercase tracking-wider text-sm rounded-lg shadow-md shadow-accent-600/30 hover:bg-accent-700 transition-colors"
        >
          + Novo Orçamento
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por referência, cliente, descrição..."
          className="w-full max-w-md bg-white border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-sm focus:border-accent-600 focus:ring-2 focus:ring-accent-600/10 outline-none"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Referência', 'Cliente', 'Produto', 'Tiragem', 'Total', 'Unitário', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-display font-bold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 font-mono text-sm">Carregando...</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400 font-mono text-sm">Nenhum orçamento encontrado</td></tr>
            ) : data.items.map(q => (
              <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-sm text-accent-600">#{q.reference_number}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{q.client_name || '—'}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-500">{q.paper_type} {q.paper_gramatura}</td>
                <td className="px-4 py-3 font-mono text-sm">{q.quantity.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3 font-mono font-bold text-accent-600">{brl(q.total_brl)}</td>
                <td className="px-4 py-3 font-mono text-xs text-teal-600">R$ {q.unit_price_brl.toFixed(4).replace('.', ',')}</td>
                <td className="px-4 py-3">
                  <select
                    value={q.status}
                    onChange={e => handleStatusChange(q.id, e.target.value as Quote['status'])}
                    className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                      q.status === 'accepted' ? 'bg-green-100 text-green-700 border-green-200' :
                      q.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                      q.status === 'sent' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => quoteService.archive(q.id).then(load)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    title="Arquivar"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-xs font-mono text-gray-400">{data.total} orçamentos</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-40">← Anterior</button>
              <span className="px-3 py-1 text-xs font-mono">{page}/{data.pages}</span>
              <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs rounded border border-gray-200 disabled:opacity-40">Próximo →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
