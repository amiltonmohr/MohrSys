import { withTenantContext } from '../db/pool';
import { TenantConfig } from '../types';
import { logger } from '../utils/logger';

const DEFAULT_CONFIG = {
  materials: [
    { tipo: 'Couchê', gramatura: '90g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê', gramatura: '115g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê', gramatura: '150g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê', gramatura: '250g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê', gramatura: '300g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê Fosco', gramatura: '90g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê Fosco', gramatura: '115g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Couchê Fosco', gramatura: '150g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.0 },
    { tipo: 'Offset', gramatura: '56g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset', gramatura: '63g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset', gramatura: '75g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset', gramatura: '90g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset', gramatura: '120g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Offset', gramatura: '150g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Reciclato', gramatura: '75g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Reciclato', gramatura: '90g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.2 },
    { tipo: 'Kraft', gramatura: '80g', formato: '66x96cm', precoPorKg: 12.50, fatorAbs: 1.4 },
    { tipo: 'Duplex', gramatura: '250g', formato: '66x96cm', precoPorKg: 12.00, fatorAbs: 1.4 },
    { tipo: 'AC Branco CF', gramatura: '50g', formato: '66x96cm', precoPorKg: 27.00, fatorAbs: 1.2 },
    { tipo: 'AC Amarelo CFB', gramatura: '50g', formato: '66x96cm', precoPorKg: 29.00, fatorAbs: 1.2 },
    { tipo: 'AC Azul CFB', gramatura: '50g', formato: '66x96cm', precoPorKg: 29.00, fatorAbs: 1.2 },
    { tipo: 'Adesivo Brilho', gramatura: '180g', formato: '66x96cm', precoPorKg: 23.00, fatorAbs: 1.0 },
  ],
  machines: [
    { nome: 'GTO 52 (1 cor)', formato: '36x52cm', custoHora: 90, velocidade: 5000, pinca: 1.2 },
    { nome: 'GTO 52 (4 cores)', formato: '36x52cm', custoHora: 140, velocidade: 5000, pinca: 1.2 },
  ],
  finishing: [
    { nome: 'Laminação Fosca', formula: 'laminacao', valorM2: 1.80 },
    { nome: 'Laminação Brilho', formula: 'laminacao', valorM2: 1.80 },
    { nome: 'Verniz UV Total', formula: 'verniz_total', valorM2: 2.90 },
    { nome: 'Verniz UV Localizado', formula: 'verniz_local', valorM2: 4.60, percArea: 30 },
    { nome: 'Corte e Vinco', formula: 'corte_vinco', setup: 80, valorMil: 100 },
    { nome: 'Dobra Simples', formula: 'por_mil', valorMil: 40 },
    { nome: 'Dobra Cruzada', formula: 'por_mil', valorMil: 40 },
    { nome: 'Grampeamento', formula: 'por_mil', valorMil: 90 },
    { nome: 'Picote', formula: 'por_mil', valorMil: 80 },
    { nome: 'Numeração', formula: 'por_mil', valorMil: 60 },
    { nome: 'Blocagem', formula: 'por_mil', valorMil: 50 },
    { nome: 'Relevo Seco', formula: 'fixo', valor: 350 },
  ],
  chapa_cost_brl: 18.00,
  ink_cost_cmyk_per_ml: 0.048,
  ink_cost_pantone_per_ml: 0.090,
  labor_cost_per_hour_brl: 50.00,
  setup_cost_per_chapa_brl: 12.00,
  overhead_pct: 35.00,
  margin_pct: 30.00,
};

export class ConfigService {
  async getActive(tenantId: string, userId: string): Promise<TenantConfig> {
    return withTenantContext(tenantId, userId, async (client) => {
      const { rows } = await client.query<TenantConfig>(
        `SELECT * FROM configs WHERE tenant_id = $1 AND status = 'active' ORDER BY version DESC LIMIT 1`,
        [tenantId]
      );

      if (rows[0]) return rows[0];

      // Auto-create default config for new tenants
      logger.info('Creating default config for tenant', { tenantId });
      const { rows: created } = await client.query<TenantConfig>(
        `INSERT INTO configs (tenant_id, version, status, materials, machines, finishing,
          chapa_cost_brl, ink_cost_cmyk_per_ml, ink_cost_pantone_per_ml,
          labor_cost_per_hour_brl, setup_cost_per_chapa_brl, overhead_pct, margin_pct, created_by)
         VALUES ($1, 1, 'active', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          tenantId,
          JSON.stringify(DEFAULT_CONFIG.materials),
          JSON.stringify(DEFAULT_CONFIG.machines),
          JSON.stringify(DEFAULT_CONFIG.finishing),
          DEFAULT_CONFIG.chapa_cost_brl,
          DEFAULT_CONFIG.ink_cost_cmyk_per_ml,
          DEFAULT_CONFIG.ink_cost_pantone_per_ml,
          DEFAULT_CONFIG.labor_cost_per_hour_brl,
          DEFAULT_CONFIG.setup_cost_per_chapa_brl,
          DEFAULT_CONFIG.overhead_pct,
          DEFAULT_CONFIG.margin_pct,
          userId,
        ]
      );
      return created[0];
    });
  }

  async update(
    tenantId: string,
    userId: string,
    updates: Partial<TenantConfig>
  ): Promise<TenantConfig> {
    return withTenantContext(tenantId, userId, async (client) => {
      const { rows: current } = await client.query<TenantConfig>(
        `SELECT * FROM configs WHERE tenant_id = $1 AND status = 'active' ORDER BY version DESC LIMIT 1`,
        [tenantId]
      );
      const currentConfig = current[0];

      const newVersion = currentConfig ? currentConfig.version + 1 : 1;

      // Archive current
      if (currentConfig) {
        await client.query(
          `UPDATE configs SET status = 'archived' WHERE id = $1`,
          [currentConfig.id]
        );

        // Log changelog
        await client.query(
          `INSERT INTO config_changelog (tenant_id, config_id, from_version, to_version, changes, changed_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [tenantId, currentConfig.id, currentConfig.version, newVersion, JSON.stringify(updates), userId]
        );
      }

      const merged = { ...currentConfig, ...updates };
      const { rows: created } = await client.query<TenantConfig>(
        `INSERT INTO configs (tenant_id, version, status, materials, machines, finishing,
          chapa_cost_brl, ink_cost_cmyk_per_ml, ink_cost_pantone_per_ml,
          labor_cost_per_hour_brl, setup_cost_per_chapa_brl, overhead_pct, margin_pct, created_by)
         VALUES ($1, $2, 'active', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          tenantId, newVersion,
          JSON.stringify(merged.materials ?? DEFAULT_CONFIG.materials),
          JSON.stringify(merged.machines ?? DEFAULT_CONFIG.machines),
          JSON.stringify(merged.finishing ?? DEFAULT_CONFIG.finishing),
          merged.chapa_cost_brl ?? DEFAULT_CONFIG.chapa_cost_brl,
          merged.ink_cost_cmyk_per_ml ?? DEFAULT_CONFIG.ink_cost_cmyk_per_ml,
          merged.ink_cost_pantone_per_ml ?? DEFAULT_CONFIG.ink_cost_pantone_per_ml,
          merged.labor_cost_per_hour_brl ?? DEFAULT_CONFIG.labor_cost_per_hour_brl,
          merged.setup_cost_per_chapa_brl ?? DEFAULT_CONFIG.setup_cost_per_chapa_brl,
          merged.overhead_pct ?? DEFAULT_CONFIG.overhead_pct,
          merged.margin_pct ?? DEFAULT_CONFIG.margin_pct,
          userId,
        ]
      );
      return created[0];
    });
  }

  async listVersions(tenantId: string, userId: string): Promise<TenantConfig[]> {
    return withTenantContext(tenantId, userId, async (client) => {
      const { rows } = await client.query<TenantConfig>(
        `SELECT id, tenant_id, version, status, created_at, updated_at, created_by,
                chapa_cost_brl, setup_cost_per_chapa_brl, margin_pct, overhead_pct
         FROM configs WHERE tenant_id = $1 ORDER BY version DESC`,
        [tenantId]
      );
      return rows;
    });
  }
}
