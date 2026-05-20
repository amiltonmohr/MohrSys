export interface User {
  id: string;
  tenant_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  mfa_enabled: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  user: User;
  tenant: Tenant;
  access_token: string;
  refresh_token: string;
}

// ── Config ──────────────────────────────────────────────────
export interface PaperType {
  tipo: string;
  gramatura: string;
  formato: string;
  precoPorKg: number;
  fatorAbs: number;
}

export interface Machine {
  nome: string;
  formato: string;
  custoHora: number;
  velocidade: number;
  pinca: number;
}

export interface Finishing {
  nome: string;
  formula: string;
  valorM2?: number;
  valorMil?: number;
  setup?: number;
  valor?: number;
  percArea?: number;
}

export interface TenantConfig {
  id: string;
  version: number;
  status: string;
  materials: PaperType[];
  machines: Machine[];
  finishing: Finishing[];
  chapa_cost_brl: number;
  ink_cost_cmyk_per_ml: number;
  setup_cost_per_chapa_brl: number;
  labor_cost_per_hour_brl: number;
  overhead_pct: number;
  margin_pct: number;
}

// ── Quote ───────────────────────────────────────────────────
export type ProductType = 'simples' | 'bloco' | 'revista';

export interface FinishingSpec {
  nome: string;
  formula: string;
  lados?: number;
  percArea?: number;
  setup?: number;
  valorMil?: number;
  faca?: number;
}

export interface QuoteInput {
  reference_number?: string;
  client_id?: string;
  client_name?: string;
  description?: string;
  product_type: ProductType;
  paper_type: string;
  paper_gramatura: string;
  width_cm: number;
  height_cm: number;
  quantity: number;
  colors_front: number;
  colors_back: number;
  grafismo: number;
  margin_pct: number;
  urgency_pct: number;
  machine_name: string;
  finishing_specs: FinishingSpec[];
  bloco_folhas?: number;
  bloco_vias?: number;
  bloco_chapa_modo?: 'unica' | 'por-via';
  rev_paginas?: number;
  rev_capa_papel?: string;
  rev_capa_gram?: string;
  rev_capa_cores_f?: number;
  rev_capa_cores_v?: number;
  tira_retira?: boolean;
  comparison_quantities?: number[];
}

export interface BreakdownItem {
  nome: string;
  val: number;
}

export interface ComparisonQuantity {
  tiраgemInput: number;
  total: number;
  unitario: number;
  subtotal: number;
}

export interface QuoteResult {
  tiragem: number;
  folhas_brutas: number;
  num_chapas: number;
  num_blocos: number;
  laminas_por_exemplar: number;
  pecas_por_folha: number;
  consumo_tinta_kg: number;
  horas_maquina: number;
  custo_papel: number;
  custo_chapas: number;
  custo_setup: number;
  custo_tinta: number;
  custo_maquina: number;
  custo_indireto: number;
  custo_acabamentos: number;
  subtotal: number;
  margem: number;
  total: number;
  unitario: number;
  breakdown_items: BreakdownItem[];
  comparison_quantities?: ComparisonQuantity[];
  desc_tiragem: string;
  tira_retira: boolean;
  formato_nome: string;
  formato_w: number;
  formato_h: number;
}

export interface Quote {
  id: string;
  tenant_id: string;
  client_id?: string;
  client_name?: string;
  reference_number: string;
  description?: string;
  product_type: ProductType;
  paper_type: string;
  paper_gramatura: string;
  width_mm: number;
  height_mm: number;
  quantity: number;
  colors_front: number;
  colors_back: number;
  subtotal_brl: number;
  breakdown_items: BreakdownItem[];
  total_brl: number;
  unit_price_brl: number;
  comparison_quantities?: ComparisonQuantity[];
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'archived';
  validity_days: number;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T | null;
  meta: { timestamp: string; request_id: string; tenant_id?: string };
  error: { code: string; message: string; details?: unknown } | null;
}
