import jwt from 'jsonwebtoken';
import type { ParticipantType } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  userType: ParticipantType;
  email?: string;
  name?: string;
  role?: string;
  tenantId?: string; // Fase 4/6 Multi-Tenant: propagado do backend p/ isolar o bot
  citizenId?: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const tokenPayload: jwt.JwtPayload = {
    userId: payload.userId,
    userType: payload.userType as string,
  };

  if (payload.email) tokenPayload.email = payload.email;
  if (payload.name) tokenPayload.name = payload.name;
  if (payload.role) tokenPayload.role = payload.role;

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}
