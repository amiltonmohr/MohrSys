import { withTenantContext } from '../db/pool';
import { Client, PaginatedResponse } from '../types';

export class ClientService {
  async create(tenantId: string, userId: string, data: Partial<Client>): Promise<Client> {
    return withTenantContext(tenantId, userId, async (client) => {
      const { rows } = await client.query<Client>(
        `INSERT INTO clients (tenant_id, name, email, phone, address, city, state, zip_code, country, notes, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [tenantId, data.name, data.email || null, data.phone || null,
         data.address || null, data.city || null, data.state || null,
         data.zip_code || null, data.country || 'Brasil', data.notes || null,
         data.metadata ? JSON.stringify(data.metadata) : '{}']
      );
      return rows[0];
    });
  }

  async findById(tenantId: string, userId: string, clientId: string): Promise<Client> {
    return withTenantContext(tenantId, userId, async (client) => {
      const { rows } = await client.query<Client>(
        'SELECT * FROM clients WHERE id = $1 AND tenant_id = $2',
        [clientId, tenantId]
      );
      if (!rows[0]) throw Object.assign(new Error('Client not found'), { status: 404, code: 'NOT_FOUND' });
      return rows[0];
    });
  }

  async list(
    tenantId: string, userId: string,
    { page = 1, limit = 20, search }: { page?: number; limit?: number; search?: string }
  ): Promise<PaginatedResponse<Client>> {
    return withTenantContext(tenantId, userId, async (client) => {
      const offset = (page - 1) * limit;
      const params: unknown[] = [tenantId];
      let where = 'tenant_id = $1';
      let pIdx = 2;

      if (search) {
        where += ` AND (name ILIKE $${pIdx} OR email ILIKE $${pIdx} OR phone ILIKE $${pIdx})`;
        params.push(`%${search}%`); pIdx++;
      }

      const { rows: countRows } = await client.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM clients WHERE ${where}`, params
      );
      const total = parseInt(countRows[0].count);

      params.push(limit, offset);
      const { rows } = await client.query<Client>(
        `SELECT * FROM clients WHERE ${where} ORDER BY name ASC LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
        params
      );

      return { items: rows, total, page, limit, pages: Math.ceil(total / limit) };
    });
  }

  async update(tenantId: string, userId: string, clientId: string, data: Partial<Client>): Promise<Client> {
    return withTenantContext(tenantId, userId, async (client) => {
      const { rows } = await client.query<Client>(
        `UPDATE clients SET
          name = COALESCE($3, name), email = COALESCE($4, email), phone = COALESCE($5, phone),
          address = COALESCE($6, address), city = COALESCE($7, city), state = COALESCE($8, state),
          zip_code = COALESCE($9, zip_code), country = COALESCE($10, country), notes = COALESCE($11, notes),
          metadata = COALESCE($12, metadata),
          updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [clientId, tenantId, data.name, data.email, data.phone, data.address,
         data.city, data.state, data.zip_code, data.country, data.notes,
         data.metadata ? JSON.stringify(data.metadata) : null]
      );
      if (!rows[0]) throw Object.assign(new Error('Client not found'), { status: 404, code: 'NOT_FOUND' });
      return rows[0];
    });
  }

  async archive(tenantId: string, userId: string, clientId: string): Promise<void> {
    await withTenantContext(tenantId, userId, async (client) => {
      const { rowCount } = await client.query(
        `DELETE FROM clients WHERE id = $1 AND tenant_id = $2`,
        [clientId, tenantId]
      );
      if (!rowCount) throw Object.assign(new Error('Client not found'), { status: 404, code: 'NOT_FOUND' });
    });
  }
}
