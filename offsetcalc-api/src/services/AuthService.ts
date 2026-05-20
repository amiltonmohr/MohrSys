import bcrypt from 'bcrypt';
import { query, withTenantContext } from '../db/pool';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { LoginRequest, LoginResponse, User, Tenant } from '../types';
import { logger } from '../utils/logger';

export class AuthService {
  async login(req: LoginRequest, ip?: string): Promise<LoginResponse> {
    // Find user by email (no tenant context yet — login is pre-auth)
    const { rows: users } = await query<User & { password_hash: string }>(
      `SELECT u.*, t.name as tenant_name, t.plan as tenant_plan, t.status as tenant_status
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.email = $1 AND u.disabled = false`,
      [req.email.toLowerCase()]
    );

    const user = users[0];
    if (!user) {
      logger.warn('Login failed: user not found', { email: req.email, ip });
      throw Object.assign(new Error('Invalid email or password'), { status: 401, code: 'INVALID_CREDENTIALS' });
    }

    if ((user as unknown as { tenant_status: string }).tenant_status !== 'active') {
      throw Object.assign(new Error('Account suspended'), { status: 403, code: 'TENANT_INACTIVE' });
    }

    const valid = await bcrypt.compare(req.password, user.password_hash);
    if (!valid) {
      logger.warn('Login failed: wrong password', { email: req.email, ip });
      throw Object.assign(new Error('Invalid email or password'), { status: 401, code: 'INVALID_CREDENTIALS' });
    }

    // Update last_login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const accessToken = signAccessToken({
      sub: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = signRefreshToken(user.id, user.tenant_id);

    const u = user as unknown as { tenant_name: string; tenant_plan: string };

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: parseInt(process.env.JWT_EXPIRY || '900'),
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        mfa_enabled: user.mfa_enabled,
        last_login: user.last_login,
        disabled: user.disabled,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      tenant: {
        id: user.tenant_id,
        name: u.tenant_name,
        plan: u.tenant_plan as Tenant['plan'],
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    let payload: { sub: string; tenant_id: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401, code: 'INVALID_REFRESH_TOKEN' });
    }

    const { rows } = await query<User>(
      'SELECT * FROM users WHERE id = $1 AND disabled = false',
      [payload.sub]
    );
    const user = rows[0];
    if (!user) {
      throw Object.assign(new Error('User not found'), { status: 401, code: 'USER_NOT_FOUND' });
    }

    const accessToken = signAccessToken({
      sub: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: accessToken,
      expires_in: parseInt(process.env.JWT_EXPIRY || '900'),
    };
  }

  async getMe(userId: string, tenantId: string): Promise<Omit<User, 'password_hash'>> {
    return withTenantContext(tenantId, userId, async (client) => {
      const { rows } = await client.query<User>(
        'SELECT id, tenant_id, email, first_name, last_name, role, mfa_enabled, last_login, disabled, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      const user = rows[0];
      if (!user) {
        throw Object.assign(new Error('User not found'), { status: 404, code: 'NOT_FOUND' });
      }
      return user;
    });
  }
}
