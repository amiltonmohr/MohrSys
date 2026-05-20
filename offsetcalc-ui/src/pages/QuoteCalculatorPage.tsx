import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuoteCalculator } from '../hooks/useQuote';
import { TenantConfig, QuoteInput } from '../types';
import { configService } from '../services/configService';
import QuoteResults from '../components/QuoteResults';

const schema = z.object({
  reference_number: z.string().optional(),
  client_name: z.string().optional(),
  description: z.string().optional(),
  product_type: z.enum(['simples', 'bloco', 'revista']),
  paper_type: z.string().min(1, 'Selecione o papel'),
  paper_gramatura: z.string().min(1, 'Selecione a gramatura'),
  width_cm: z.coerce.number().positive('Informe a largura'),
  height_cm: z.coerce.number().positive('Informe a altura'),
  quantity: z.coerce.number().int().positive('Informe a tiragem'),
  colors_front: z.coerce.number().int().min(0).max(4),
  colors_back: z.coerce.number().int().min(0).max(4),
  grafismo: z.coerce.number(),
  margin_pct: z.coerce.number().min(0).max(300),
  urgency_pct: z.coerce.number().min(0).max(100),
  machine_name: z.string().min(1, 'Selecione a máquina'),
  bloco_folhas: z.coerce.number().int().positive().optional(),
  bloco_vias: z.coerce.number().int().min(1).max(5).optional(),
  rev_paginas: z.coerce.number().int().min(4).optional(),
});
type FormData = z.infer<typeof schema>;

export default function QuoteCalculatorPage() {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [paperTypes, setPaperTypes] = useState<string[]>([]);
  const [gramaturas, setGramaturas] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { result, loading, error, calculate, save } = useQuoteCalculator();

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_type: 'simples',
      colors_front: 4,
      colors_back: 0,
      grafismo: 0.7,
      margin_pct: 30,
      urgency_pct: 0,
      bloco_folhas: 50,
      bloco_vias: 1,
    },
  });

  const productType = watch('product_type');
  const paperType = watch('paper_type');

  useEffect(() => {
    configService.get().then((cfg) => {
      setConfig(cfg);
      const types = [...new Set(cfg.materials.map(p => p.tipo))];
      setPaperTypes(types);
    });
  }, []);

  useEffect(() => {
    if (!config || !paperType) return;
    const grams = config.materials.filter(p => p.tipo === paperType).map(p => p.gramatura);
    setGramaturas(grams);
    if (grams.length > 0) setValue('paper_gramatura', grams[0]);
  }, [paperType, config, setValue]);

  const onCalculate = useCallback(async (data: FormData) => {
    if (!config) return;
    const input: QuoteInput = {
      ...data,
      finishing_specs: [],
      comparison_quantities: [],
    };
    await calculate(input);
  }, [calculate, config]);

  const handleSave = async () => {
    const data = watch() as FormData;
    if (!config) return;
    setIsSaving(true);
    const input: QuoteInput = { ...data, finishing_specs: [], comparison_quantities: [] };
    const saved = await save(input);
    setIsSaving(false);
    if (saved) { setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }
  };

  const fieldClass = 'w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-mono text-sm focus:border-accent-600 focus:ring-2 focus:ring-accent-600/10 outline-none';
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black font-display text-gray-800">
          Novo <span className="text-accent-600">Cálculo</span>
        </h1>
        <button
          onClick={() => { /* reset */ }}
          className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold font-display uppercase tracking-wider hover:border-accent-600 hover:text-accent-600 transition-colors"
        >
          Limpar
        </button>
      </div>

      <form onSubmit={handleSubmit(onCalculate)}>
        <div className="grid grid-cols-[320px_1fr_1.5fr] gap-5 items-start">
          {/* Column 1 — Job ID */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-display font-bold text-sm text-accent-600 mb-4 flex items-center gap-2">
              <span className="w-0.5 h-3.5 bg-teal-500 rounded block" />
              Identificação do Job
            </h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Nº / Referência</label>
                <input {...register('reference_number')} className={fieldClass} placeholder="ORC-2026-001" />
              </div>
              <div>
                <label className={labelClass}>Cliente</label>
                <input {...register('client_name')} className={fieldClass} placeholder="Nome do cliente" />
              </div>
              <div>
                <label className={labelClass}>Tipo de Material</label>
                <Controller
                  control={control}
                  name="product_type"
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(['simples', 'bloco', 'revista'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => field.onChange(t)}
                          className={`p-2 rounded-lg border-2 text-center text-xs font-bold font-display uppercase transition-all ${
                            field.value === t
                              ? 'border-accent-600 bg-accent-50 text-accent-600'
                              : 'border-gray-200 text-gray-500 hover:border-accent-600'
                          }`}
                        >
                          {t === 'simples' ? 'Impressão' : t === 'bloco' ? 'Bloco' : 'Revista'}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <input {...register('description')} className={fieldClass} placeholder="Gerado automaticamente..." />
              </div>
            </div>
          </div>

          {/* Column 2 — Print Specs */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-display font-bold text-sm text-accent-600 mb-4 flex items-center gap-2">
                <span className="w-0.5 h-3.5 bg-teal-500 rounded block" />
                Especificações de Impressão
              </h3>

              {/* Bloco fields */}
              {productType === 'bloco' && (
                <div className="bg-accent-50 border border-accent-200 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Folhas por Bloco</label>
                      <input type="number" {...register('bloco_folhas')} className={fieldClass} min={1} />
                    </div>
                    <div>
                      <label className={labelClass}>Vias por Bloco</label>
                      <input type="number" {...register('bloco_vias')} className={fieldClass} min={1} max={5} />
                    </div>
                  </div>
                </div>
              )}

              {/* Revista fields */}
              {productType === 'revista' && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4">
                  <div>
                    <label className={labelClass}>Nº de Páginas</label>
                    <input type="number" {...register('rev_paginas')} className={fieldClass} min={4} step={4} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tipo de Papel</label>
                  <select {...register('paper_type')} className={fieldClass}>
                    <option value="">— selecione —</option>
                    {paperTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.paper_type && <p className="text-red-500 text-xs mt-1">{errors.paper_type.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Gramatura</label>
                  <select {...register('paper_gramatura')} className={fieldClass}>
                    <option value="">— selecione —</option>
                    {gramaturas.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={labelClass}>Formato (cm) Larg × Alt</label>
                  <div className="flex items-center gap-2">
                    <input type="number" {...register('width_cm')} className={fieldClass} placeholder="Larg." step="0.1" />
                    <span className="text-gray-400 font-bold shrink-0">×</span>
                    <input type="number" {...register('height_cm')} className={fieldClass} placeholder="Alt." step="0.1" />
                  </div>
                  {errors.width_cm && <p className="text-red-500 text-xs mt-1">{errors.width_cm.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Tiragem</label>
                  <input type="number" {...register('quantity')} className={fieldClass} placeholder="1000" />
                  {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={labelClass}>Cores Frente</label>
                  <select {...register('colors_front')} className={fieldClass}>
                    {[0,1,2,3,4].map(n => <option key={n} value={n}>{n === 0 ? '0 cores' : n === 1 ? '1 (P&B)' : n === 4 ? '4 (CMYK)' : `${n} cores`}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Cores Verso</label>
                  <select {...register('colors_back')} className={fieldClass}>
                    {[0,1,2,3,4].map(n => <option key={n} value={n}>{n === 0 ? '0 (sem verso)' : n === 1 ? '1 (P&B)' : n === 4 ? '4 (CMYK)' : `${n} cores`}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className={labelClass}>Tipo de Grafismo</label>
                <select {...register('grafismo')} className={fieldClass}>
                  <option value="0.2">Só texto</option>
                  <option value="0.4">Retícula 40%</option>
                  <option value="0.7">Retícula 70% (típico 4 cores)</option>
                  <option value="1.0">Chapado / Cores sólidas</option>
                  <option value="1.2">Chapado transparente</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column 3 — Operational + Results */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-display font-bold text-sm text-accent-600 mb-4 flex items-center gap-2">
                <span className="w-0.5 h-3.5 bg-teal-500 rounded block" />
                Parâmetros Operacionais
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Máquina</label>
                  <select {...register('machine_name')} className={fieldClass}>
                    <option value="">— selecione —</option>
                    {config?.machines.map(m => <option key={m.nome} value={m.nome}>{m.nome}</option>)}
                  </select>
                  {errors.machine_name && <p className="text-red-500 text-xs mt-1">{errors.machine_name.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>% Margem de Lucro</label>
                  <input type="number" {...register('margin_pct')} className={fieldClass} min={0} max={300} />
                </div>
              </div>
              <div className="mt-3">
                <label className={labelClass}>% Urgência (adicional)</label>
                <input type="number" {...register('urgency_pct')} className={fieldClass} min={0} max={100} />
              </div>
            </div>

            {/* Action button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-600 text-white font-bold font-display uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-accent-600/30 hover:bg-accent-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Calculando...' : 'Calcular'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-mono">
                {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <>
                <QuoteResults result={result} />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-accent-600 text-white font-bold font-display uppercase tracking-wider py-2.5 rounded-xl text-sm hover:bg-accent-700 transition-colors disabled:opacity-60"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Orçamento'}
                  </button>
                </div>
                {saveSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700 font-mono text-center">
                    Orçamento salvo com sucesso!
                  </div>
                )}
              </>
            )}

            {!result && !loading && (
              <div className="bg-gradient-to-br from-accent-50 to-teal-50 border border-accent-200/50 rounded-xl p-8 text-center">
                <p className="text-gray-400 font-mono text-sm">Preencha os dados do job para calcular</p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
