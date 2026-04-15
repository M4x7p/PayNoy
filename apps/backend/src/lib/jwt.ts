import jwt from 'jsonwebtoken';

// Types for our JWT payload
export interface JwtPayload {
    id: string;          // Maps to users.id
    discord_id: string;  // Maps to users.discord_id
    iat?: number;
    exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_LIFESPAN = '24h'; // Default lifetime

/**
 * Sign a new JWT token for a user
 */
export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is missing');
    }

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: TOKEN_LIFESPAN,
    });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is missing');
    }

    // Verify throws an error if token is invalid or expired
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * Check if the token is close to expiry (sliding session).
 * If the token expires in less than `thresholdMs`, return true.
 */
export function shouldRefresh(payload: JwtPayload, thresholdMs: number = 6 * 60 * 60 * 1000): boolean {
    if (!payload.exp) return false;

    // Payload.exp is in seconds
    const expiresAtMs = payload.exp * 1000;
    const nowMs = Date.now();
    const timeToExpiryMs = expiresAtMs - nowMs;

    // Renew if within threshold
    return timeToExpiryMs < thresholdMs && timeToExpiryMs > 0;
}
