import { api, apiCall } from './api';
import { TenantConfig } from '../types';

export const configService = {
  async get(): Promise<TenantConfig> {
    return apiCall(() => api.get('/config'));
  },

  async update(data: Partial<TenantConfig>): Promise<TenantConfig> {
    return apiCall(() => api.put('/config', data));
  },

  async listVersions(): Promise<TenantConfig[]> {
    return apiCall(() => api.get('/config/versions'));
  },
};
