import TokenManager from './tokenManager';
import ApiClient from './apiClient';

export interface User {
    userId: string;
    email: string;
    authenticated: boolean;
}

export function isAuthenticated(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return TokenManager.hasTokens();
}

export async function verifyAuth(): Promise<User | null> {
    if (!TokenManager.hasTokens()) {
        return null;
    }

    try {
        const response = await ApiClient.get<User>('/auth/verify');

        if (response.data && response.data.authenticated) {
            return response.data;
        } else {
            TokenManager.clearTokens();
            return null;
        }
    } catch (error) {
        console.error('Auth verification error:', error);
        TokenManager.clearTokens();
        return null;
    }
}

export async function logout(): Promise<void> {
    const refreshToken = TokenManager.getRefreshToken();

    if (refreshToken) {
        try {
            await ApiClient.post('/auth/logout', { refreshToken });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    TokenManager.clearTokens();
}

export async function logoutAll(): Promise<void> {
    try {
        await ApiClient.post('/auth/logout-all');
    } catch (error) {
        console.error('Logout all error:', error);
    }

    TokenManager.clearTokens();
}

export function handleOAuthCallback(): void {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (accessToken && refreshToken) {
        TokenManager.setTokens({ accessToken, refreshToken });

        window.history.replaceState({}, document.title, window.location.pathname);

        window.location.href = '/home';
    }
}