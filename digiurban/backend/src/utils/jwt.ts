import * as jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  userType: 'SERVER' | 'CITIZEN' | 'ADMIN';
  role?: string;
  email?: string;
  name?: string;
}

/**
 * Gerar token JWT para UltraZend Messages
 */
export function generateToken(payload: TokenPayload): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    {
      userId: payload.userId,
      userType: payload.userType,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    },
    jwtSecret,
    {
      expiresIn: '7d',
    }
  );
}

/**
 * Verificar token JWT
 */
export function verifyToken(token: string): TokenPayload {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.verify(token, jwtSecret) as TokenPayload;
}
