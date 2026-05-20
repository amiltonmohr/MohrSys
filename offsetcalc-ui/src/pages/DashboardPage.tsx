import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quoteService } from '../services/quoteService';
import { useAuthStore } from '../store/authStore';
import { Quote } from '../types';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DashboardPage() {
  const { user, tenant } = useAuthStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quoteService.list({ limit: 10 }).then(r => {
      setQuotes(r.items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalRevenue = quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.total_brl, 0);
  const pendingCount = quotes.filter(q => q.status === 'draft' || q.status === 'sent').length;

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-black font-display text-gray-800">
          Olá, <span className="text-accent-600">{user?.first_name || user?.email}</span>
        </h1>
        <p className="text-gray-400 font-mono text-sm mt-0.5">{tenant?.name} · {tenant?.plan}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Orçamentos', value: quotes.length.toString(), color: 'text-accent-600' },
          { label: 'Aguardando', value: pendingCount.toString(), color: 'text-yellow-600' },
          { label: 'Aprovados', value: quotes.filter(q => q.status === 'accepted').length.toString(), color: 'text-green-600' },
          { label: 'Receita', value: brl(totalRevenue), color: 'text-teal-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-display font-bold uppercase tracking-wider text-gray-400 mb-2">{kpi.label}</div>
            <div className={`font-mono text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-6">
        <Link
          to="/quotes/new"
          className="px-5 py-2.5 bg-accent-600 text-white font-bold font-display uppercase tracking-wider text-sm rounded-lg shadow-md shadow-accent-600/30 hover:bg-accent-700 transition-colors"
        >
          + Novo Orçamento
        </Link>
        <Link
          to="/clients"
          className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold font-display uppercase tracking-wider text-sm rounded-lg hover:border-accent-600 hover:text-accent-600 transition-colors"
        >
          Clientes
        </Link>
      </div>

      {/* Recent quotes */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-display font-bold text-sm text-accent-600">Orçamentos Recentes</h2>
          <Link to="/quotes" className="text-xs font-mono text-teal-600 hover:underline">Ver todos</Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-400 font-mono text-sm">Carregando...</div>
        ) : quotes.length === 0 ? (
          <div className="py-10 text-center text-gray-400 font-mono text-sm">Nenhum orçamento ainda</div>
        ) : (
          <div>
            {quotes.slice(0, 8).map(q => (
              <div key={q.id} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <div>
                  <div className="font-display font-bold text-sm text-gray-800">
                    #{q.reference_number}
                    <span className="text-gray-400 font-normal text-xs ml-2">— {q.client_name || 'Sem cliente'}</span>
                  </div>
                  <div className="text-xs font-mono text-gray-400 mt-0.5">
                    {q.description || `${q.paper_type} ${q.paper_gramatura}`} · {new Date(q.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono font-bold text-accent-600">{brl(q.total_brl)}</div>
                    <div className="text-xs font-mono text-gray-400">R$ {q.unit_price_brl.toFixed(4).replace('.', ',')} /un</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    q.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    q.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    q.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {q.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
