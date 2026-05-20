import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY || '900');
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!;
const REFRESH_EXPIRY = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800');

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function signRefreshToken(userId: string, tenantId: string): string {
  return jwt.sign({ sub: userId, tenant_id: tenantId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string; tenant_id: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string; tenant_id: string };
}
