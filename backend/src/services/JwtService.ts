import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface JwtPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

class JwtService {
    private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-dev';
    private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-dev';
    private static readonly ACCESS_TOKEN_EXPIRY = '30m';
    private static readonly REFRESH_TOKEN_EXPIRY = '7d';

    static generateTokenPair(payload: { userId: string; email: string; }): TokenPair {
        const accessToken = jwt.sign(
            payload,
            this.ACCESS_TOKEN_SECRET,
            { expiresIn: this.ACCESS_TOKEN_EXPIRY }
        );

        const refreshToken = jwt.sign(
            payload,
            this.REFRESH_TOKEN_SECRET,
            { expiresIn: this.REFRESH_TOKEN_EXPIRY }
        );

        return { accessToken, refreshToken };
    }

    static verifyAccessToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JwtPayload;
        } catch (error) {
            throw new Error('Invalid access token');
        }
    }

    static verifyRefreshToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as JwtPayload;
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    static generateSecureToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    static extractTokenFromHeader(authHeader: string | undefined): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}

export default JwtService;