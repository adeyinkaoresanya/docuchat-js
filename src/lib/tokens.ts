import jwt, {type SignOptions} from 'jsonwebtoken';
import { config } from '../config/env'

type ExpiresIn = NonNullable<SignOptions['expiresIn']>;

const ACCESS_SECRET = config.JWT_ACCESS_SECRET;
const REFRESH_SECRET = config.JWT_REFRESH_SECRET;
const ACCESS_TTL = config.JWT_ACCESS_SECRET_EXPIRES_IN as ExpiresIn;
const REFRESH_TTL = config.JWT_REFRESH_SECRET_EXPIRES_IN as ExpiresIn;

// These should never be the same value.
// If they were, a refresh token could be used as an access token.

interface TokenPayload {
  sub: string;    // User ID
  role: string;   // User role/tier
  type: 'access' | 'refresh';
}

export function generateAccessToken(user: { id: string; tier: string }) {
  return jwt.sign(
    { sub: user.id, role: user.tier, type: 'access' },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

export function generateRefreshToken(user: { id: string; tier: string }) {
  return jwt.sign(
    { sub: user.id, role: user.tier, type: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}
