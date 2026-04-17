/**
 * Secure auth utilities for the React frontend.
 *
 * - Parses JWT expiry and auto-logs out when the access token expires
 * - Provides a single place to read/write/clear auth tokens
 * - Sanitises user input to prevent XSS before rendering
 */

// ── Token storage ─────────────────────────────────────────────────

export const setTokens = (accessToken, refreshToken, role) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userRole', role);
};

export const clearTokens = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('rememberedEmail');
};

export const getToken = () => localStorage.getItem('token');
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const getUserRole = () => localStorage.getItem('userRole');

// ── JWT expiry check ──────────────────────────────────────────────

/**
 * Decodes the JWT payload (no signature verification — that's the server's job).
 * Returns null if the token is missing or malformed.
 */
export const decodeJwtPayload = (token) => {
    try {
        if (!token) return null;
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
};

/**
 * Returns true if the stored access token is expired or missing.
 */
export const isTokenExpired = () => {
    const token = getToken();
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return true;
    // exp is in seconds; add 10s buffer for clock skew
    return Date.now() / 1000 > payload.exp - 10;
};

/**
 * Returns seconds until the token expires, or 0 if already expired.
 */
export const tokenSecondsRemaining = () => {
    const token = getToken();
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return 0;
    return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
};

// ── Auto-logout scheduler ─────────────────────────────────────────

let logoutTimer = null;

/**
 * Schedules an automatic logout when the access token expires.
 * Call this after every successful login or token refresh.
 *
 * @param {Function} onLogout - callback to run on expiry (e.g. navigate to login)
 */
export const scheduleAutoLogout = (onLogout) => {
    if (logoutTimer) clearTimeout(logoutTimer);
    const seconds = tokenSecondsRemaining();
    if (seconds <= 0) {
        onLogout();
        return;
    }
    logoutTimer = setTimeout(() => {
        clearTokens();
        onLogout();
    }, seconds * 1000);
};

export const cancelAutoLogout = () => {
    if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
    }
};

// ── Input sanitisation ────────────────────────────────────────────

/**
 * Strips HTML tags from a string to prevent XSS when rendering user-supplied content.
 */
export const sanitise = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

// ── Refresh token flow ────────────────────────────────────────────

const API = process.env.REACT_APP_API_URL || 'http://localhost:8080';

/**
 * Attempts to refresh the access token using the stored refresh token.
 * Returns true on success, false on failure (caller should redirect to login).
 */
export const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
        const res = await fetch(`${API}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
            localStorage.setItem('token', data.token);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
            return true;
        }
        return false;
    } catch {
        return false;
    }
};
