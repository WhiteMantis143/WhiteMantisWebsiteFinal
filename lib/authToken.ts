let _token: string | null = null;
let _onTokenRefresh: ((token: string) => Promise<void>) | null = null;

export function setAuthToken(token: string | null): void {
    _token = token;
}

export function getAuthToken(): string | null {
    return _token;
}

// Called by CartContext once on mount so the Axios interceptor can trigger
// a NextAuth session update when it silently refreshes the Payload JWT.
export function registerTokenRefreshCallback(cb: (token: string) => Promise<void>): void {
    _onTokenRefresh = cb;
}

export async function notifyTokenRefreshed(token: string): Promise<void> {
    if (_onTokenRefresh) {
        await _onTokenRefresh(token);
    }
}
