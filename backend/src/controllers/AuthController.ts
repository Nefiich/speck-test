import { Request, Response } from 'express';
import { google } from 'googleapis';
import crypto from 'crypto';
import { oauth2Client, GOOGLE_SCOPES } from '../config/googleAuth';
import User from '../models/User';
import GoogleToken from '../models/GoogleToken';
import RefreshToken from '../models/RefreshToken';
import EncryptionService from '../services/EncryptionService';
import JwtService from '../services/JwtService';

export async function googleLogin(req: Request, res: Response) {
    try {
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: GOOGLE_SCOPES,
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI
        });

        return res.redirect(url);
    } catch (error) {
        console.error('Error in googleLogin:', error);
        return res.status(500).json({
            message: 'OAuth initialization error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export async function googleCallback(req: Request, res: Response) {
    try {
        const { code } = req.query;

        if (!code) {
            console.error('No code received');
            return res.status(400).json({ message: 'No code received' });
        }

        const freshOAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        const { tokens } = await freshOAuth2Client.getToken(code as string);
        freshOAuth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: freshOAuth2Client });
        const { data: profile } = await oauth2.userinfo.get();

        if (!profile.id || !profile.email || !profile.name) {
            return res.status(400).json({ message: 'Incomplete google data' });
        }

        const user = await User.upsertGoogleUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            picture: profile.picture || undefined
        });

        if (!user.id) {
            return res.status(500).json({ message: 'Failed to create/retrieve user' });
        }

        await GoogleToken.saveOrUpdate({
            userId: user.id,
            accessToken: tokens.access_token || undefined,
            refreshToken: tokens.refresh_token && typeof tokens.refresh_token === 'string' && tokens.refresh_token.trim()
                ? EncryptionService.encrypt(tokens.refresh_token)
                : undefined,
            expiryDate: tokens.expiry_date || undefined,
            scope: tokens.scope || undefined,
        });

        // Generate JWT tokens
        const { accessToken, refreshToken } = JwtService.generateTokenPair({
            userId: user.id.toString(),
            email: user.email!
        });

        // Store refresh token in database
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await RefreshToken.create({
            user_id: user.id,
            token_hash: refreshTokenHash,
            expires_at: expiresAt
        });

        console.log('✅ OAuth flow completed successfully for user:', user.email);

        const redirectUrl = `http://127.0.0.1:3000/auth/callback?access_token=${accessToken}&refresh_token=${refreshToken}`;
        return res.redirect(redirectUrl);
    } catch (err) {
        console.error('OAuth callback error:', err);
        return res.status(500).json({
            message: 'OAuth error',
            error: err
        });
    }
}

export function verifyAuth(req: Request, res: Response) {
    if (req.user) {
        return res.status(200).json({
            authenticated: true,
            userId: req.user.userId,
            email: req.user.email
        });
    } else {
        return res.status(401).json({ authenticated: false });
    }
}

export async function refreshToken(req: Request, res: Response) {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(401).json({ message: 'Refresh token required' });
        }

        const decoded = JwtService.verifyRefreshToken(token);

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const storedToken = await RefreshToken.findByTokenHash(tokenHash);

        if (!storedToken) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        const { accessToken, refreshToken: newRefreshToken } = JwtService.generateTokenPair({
            userId: decoded.userId,
            email: decoded.email
        });

        await RefreshToken.revokeByTokenHash(tokenHash);

        const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await RefreshToken.create({
            user_id: BigInt(decoded.userId),
            token_hash: newTokenHash,
            expires_at: expiresAt
        });

        return res.json({
            accessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(403).json({ message: 'Invalid refresh token' });
    }
}

export async function logout(req: Request, res: Response) {
    try {
        const { refreshToken: token } = req.body;

        if (token) {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            await RefreshToken.revokeByTokenHash(tokenHash);
        }

        return res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Logout failed' });
    }
}

export async function logoutAll(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        await RefreshToken.revokeAllForUser(BigInt(req.user.userId));

        return res.json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
        console.error('Logout all error:', error);
        return res.status(500).json({ message: 'Logout failed' });
    }
}