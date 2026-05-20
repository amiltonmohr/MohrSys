import { useState, useCallback } from 'react';
import { quoteService } from '../services/quoteService';
import { QuoteInput, QuoteResult, Quote } from '../types';

export function useQuoteCalculator() {
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (input: QuoteInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await quoteService.calculate(input);
      setResult(res);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao calcular';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (input: QuoteInput): Promise<Quote | null> => {
    setLoading(true);
    setError(null);
    try {
      return await quoteService.create(input);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, calculate, save };
}
