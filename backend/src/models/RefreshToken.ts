import sql from '../config/database';

export interface RefreshTokenData {
    id?: bigint;
    user_id: bigint;
    token_hash: string;
    expires_at: Date;
    created_at?: Date;
    is_revoked?: boolean;
}

class RefreshToken {
    id?: bigint;
    user_id: bigint;
    token_hash: string;
    expires_at: Date;
    created_at?: Date;
    is_revoked?: boolean;

    constructor(data: RefreshTokenData) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.token_hash = data.token_hash;
        this.expires_at = data.expires_at;
        this.created_at = data.created_at;
        this.is_revoked = data.is_revoked;
    }

    static async create(data: { user_id: bigint; token_hash: string; expires_at: Date; }): Promise<RefreshToken> {
        try {
            const result: RefreshTokenData[] = await sql`
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at)
        VALUES (${data.user_id}, ${data.token_hash}, ${data.expires_at}, NOW())
        RETURNING *;
      `;
            return new RefreshToken(result[0]);
        } catch (error) {
            console.error('Error creating refresh token:', error);
            throw error;
        }
    }

    static async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
        try {
            const result: RefreshTokenData[] = await sql`
        SELECT * FROM refresh_tokens 
        WHERE token_hash = ${tokenHash} 
        AND is_revoked = false 
        AND expires_at > NOW()
        LIMIT 1;
      `;
            return result.length > 0 ? new RefreshToken(result[0]) : null;
        } catch (error) {
            console.error('Error finding refresh token:', error);
            throw error;
        }
    }

    static async revokeByTokenHash(tokenHash: string): Promise<void> {
        try {
            await sql`
        UPDATE refresh_tokens 
        SET is_revoked = true 
        WHERE token_hash = ${tokenHash};
      `;
        } catch (error) {
            console.error('Error revoking refresh token:', error);
            throw error;
        }
    }

    static async revokeAllForUser(userId: bigint): Promise<void> {
        try {

            await sql`
        UPDATE refresh_tokens 
        SET is_revoked = true 
        WHERE user_id = ${userId};
      `;
        } catch (error) {
            console.error('Error revoking all tokens for user:', error);
            throw error;
        }
    }

    static async cleanupExpired(): Promise<void> {
        try {
            await sql`
        DELETE FROM refresh_tokens 
        WHERE expires_at < NOW() OR is_revoked = true;
      `;
        } catch (error) {
            console.error('Error cleaning up expired tokens:', error);
            throw error;
        }
    }
}

export default RefreshToken;