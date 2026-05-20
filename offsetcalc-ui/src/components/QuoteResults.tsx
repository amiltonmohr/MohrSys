import { QuoteResult } from '../types';

interface Props { result: QuoteResult }

const brl = (n: number) => 'R$ ' + n.toFixed(2).replace('.', ',');
const brl4 = (n: number) => 'R$ ' + n.toFixed(4).replace('.', ',');

export default function QuoteResults({ result }: Props) {
  return (
    <div className="bg-gradient-to-br from-accent-50 to-teal-50 border border-accent-200/50 rounded-xl p-5 shadow-sm">
      <div className="text-xs font-bold font-display uppercase tracking-widest text-accent-600 mb-4">
        ▸ Resultado do Cálculo
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
          <div className="text-xs font-display font-bold uppercase tracking-wider text-gray-400 mb-1.5">Custo</div>
          <div className="font-mono text-base font-medium text-gray-700">{brl(result.subtotal)}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
          <div className="text-xs font-display font-bold uppercase tracking-wider text-gray-400 mb-1.5">Preço de Venda</div>
          <div className="font-mono text-xl font-bold text-accent-600">{brl(result.total)}</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
          <div className="text-xs font-display font-bold uppercase tracking-wider text-gray-400 mb-1.5">Unitário</div>
          <div className="font-mono text-base font-medium text-teal-600">{brl4(result.unitario)}</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-accent-100 text-accent-700 border border-accent-200">
          {result.desc_tiragem}
        </span>
        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-accent-100 text-accent-700 border border-accent-200">
          {result.formato_nome} ({result.formato_w}×{result.formato_h} cm)
        </span>
        {result.tira_retira && (
          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-700 border border-teal-200">
            ✓ Tira/Retira
          </span>
        )}
      </div>

      {/* Cost breakdown */}
      <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-1.5">
        <div className="text-xs font-display font-bold uppercase tracking-wider text-gray-400 mb-2">
          Composição do Custo
        </div>
        {[
          ['Papel', result.custo_papel],
          ['Chapas', result.custo_chapas],
          ['Setup', result.custo_setup],
          ['Tinta', result.custo_tinta],
          ['Máquina', result.custo_maquina],
          ['Custos Indiretos', result.custo_indireto],
          ['Acabamentos', result.custo_acabamentos],
          ['Margem', result.margem],
        ].filter(([, v]) => (v as number) > 0).map(([label, val]) => (
          <div key={label as string} className="flex justify-between text-xs">
            <span className="text-gray-500 font-sans">{label as string}</span>
            <span className="font-mono text-gray-700">{brl(val as number)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
          <span className="text-accent-600">TOTAL DE VENDA</span>
          <span className="font-mono text-accent-600">{brl(result.total)}</span>
        </div>
      </div>

      {/* Technical */}
      <div className="mt-3 text-xs font-mono text-gray-400 space-y-0.5">
        <div>{result.folhas_brutas.toLocaleString('pt-BR')} folhas 66×96 · M{result.pecas_por_folha} · {result.num_chapas} chapas</div>
        <div>{result.consumo_tinta_kg.toFixed(2).replace('.', ',')} kg tinta · {result.horas_maquina.toFixed(1).replace('.', ',')}h máquina</div>
      </div>

      {/* Comparison table */}
      {result.comparison_quantities && result.comparison_quantities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-accent-200">
          <div className="text-xs font-display font-bold uppercase tracking-wider text-gray-400 mb-2">
            Comparativo de Tiragens
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 font-display uppercase">
                <th className="text-left py-1">Tiragem</th>
                <th className="text-left py-1">Custo</th>
                <th className="text-left py-1">Preço</th>
                <th className="text-left py-1">Unitário</th>
              </tr>
            </thead>
            <tbody>
              {result.comparison_quantities.map(c => (
                <tr key={c.tiраgemInput} className="border-t border-gray-100">
                  <td className="py-1 font-mono">{c.tiраgemInput.toLocaleString('pt-BR')}</td>
                  <td className="py-1 font-mono text-gray-500">{brl(c.subtotal)}</td>
                  <td className="py-1 font-mono font-bold text-gray-700">{brl(c.total)}</td>
                  <td className="py-1 font-mono text-teal-600">{brl4(c.unitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
