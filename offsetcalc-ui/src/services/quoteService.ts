import { api, apiCall } from './api';
import { Quote, QuoteInput, QuoteResult, PaginatedResponse } from '../types';

export const quoteService = {
  async calculate(input: QuoteInput): Promise<QuoteResult> {
    return apiCall(() => api.post('/quotes/calculate', input));
  },

  async create(input: QuoteInput): Promise<Quote> {
    return apiCall(() => api.post('/quotes', input));
  },

  async list(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<PaginatedResponse<Quote>> {
    return apiCall(() => api.get('/quotes', { params }));
  },

  async getById(id: string): Promise<Quote> {
    return apiCall(() => api.get(`/quotes/${id}`));
  },

  async update(id: string, data: Partial<Quote>): Promise<Quote> {
    return apiCall(() => api.put(`/quotes/${id}`, data));
  },

  async archive(id: string): Promise<void> {
    return apiCall(() => api.delete(`/quotes/${id}`));
  },
};
