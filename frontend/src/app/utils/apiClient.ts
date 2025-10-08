import TokenManager from './tokenManager';

interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    status: number;
}

class ApiClient {
    private static readonly BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    private static async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.BASE_URL}${endpoint}`;
        const accessToken = TokenManager.getAccessToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
        }

        try {
            let response = await fetch(url, {
                ...options,
                headers,
            });

            if (response.status === 403 && accessToken) {
                const refreshed = await TokenManager.refreshAccessToken();
                if (refreshed) {
                    const newAccessToken = TokenManager.getAccessToken();
                    if (newAccessToken) {
                        headers.Authorization = `Bearer ${newAccessToken}`;
                        response = await fetch(url, {
                            ...options,
                            headers,
                        });
                    }
                }
            }

            const data = response.headers.get('content-type')?.includes('application/json')
                ? await response.json()
                : await response.text();

            return {
                data: response.ok ? data : undefined,
                error: response.ok ? undefined : data.message || data,
                status: response.status,
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Network error',
                status: 0,
            };
        }
    }

    static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, { method: 'GET' });
    }

    static async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    static async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(endpoint, { method: 'DELETE' });
    }
}

export default ApiClient;