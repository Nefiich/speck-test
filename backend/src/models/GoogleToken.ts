import sql from '../config/database';

export interface GoogleTokenData {
    id?: bigint;
    created_at?: Date;
    user_id: bigint;
    access_token?: string;
    refresh_token?: string;
    expiry?: Date;
    updated_at?: Date;
}

export interface GoogleTokenCreateData {
    userId: bigint;
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: number | Date;
    scope?: string;
}

class GoogleToken {
    id?: bigint;
    created_at?: Date;
    user_id: bigint;
    access_token?: string;
    refresh_token?: string;
    expiry?: Date;
    updated_at?: Date;

    constructor(data: GoogleTokenData) {
        this.id = data.id;
        this.created_at = data.created_at;
        this.user_id = data.user_id;
        this.access_token = data.access_token;
        this.refresh_token = data.refresh_token;
        this.expiry = data.expiry;
        this.updated_at = data.updated_at;
    }

    static async saveOrUpdate(data: GoogleTokenCreateData): Promise<GoogleToken> {
        try {
            const expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

            const result: GoogleTokenData[] = await sql`
                INSERT INTO google_tokens (user_id, access_token, refresh_token, expiry, created_at, updated_at)
                VALUES (${data.userId.toString()}, ${data.accessToken ?? null}, ${data.refreshToken ?? null}, ${expiryDate}, NOW(), NOW())
                ON CONFLICT (user_id)
                DO UPDATE SET
                  access_token = EXCLUDED.access_token,
                  refresh_token = EXCLUDED.refresh_token,
                  expiry = EXCLUDED.expiry,
                  updated_at = NOW()
                RETURNING *;
            `;

            return new GoogleToken(result[0]);
        } catch (error) {
            console.error('Error saving/updating Google token:', error);
            throw error;
        }
    }

    static async findByUserId(userId: bigint): Promise<GoogleToken | null> {
        try {
            const result: GoogleTokenData[] = await sql`SELECT * FROM google_tokens WHERE user_id = ${userId.toString()}`;

            if (result.length === 0) {
                return null;
            }

            return new GoogleToken(result[0]);
        } catch (error) {
            console.error('Error finding Google token by user ID:', error);
            throw error;
        }
    }

    static async deleteByUserId(userId: bigint): Promise<boolean> {
        try {
            const result = await sql`DELETE FROM google_tokens WHERE user_id = ${userId.toString()}`;
            return result.count > 0;
        } catch (error) {
            console.error('Error deleting Google token:', error);
            throw error;
        }
    }
}

export default GoogleToken;