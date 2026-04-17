/**
 * Secure API client with automatic token refresh.
 *
 * Usage:
 *   import apiClient from '../utils/apiClient';
 *   const data = await apiClient('/api/user/profile');
 *
 * - Attaches Bearer token to every request automatically
 * - On 401, attempts one silent token refresh then retries
 * - On second 401, clears tokens and redirects to login
 * - Throws a safe error object (never exposes raw server internals)
 */

import { getToken, getRefreshToken, clearTokens, refreshAccessToken } from './auth';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const getRoleLoginPath = () => {
    const role = localStorage.getItem('userRole');
    if (role === 'FREELANCER') return '/freelancer-login';
    if (role === 'ADMIN')      return '/admin-login';
    return '/login';
};

const apiClient = async (path, options = {}, retry = true) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

    // Silent token refresh on 401
    if (response.status === 401 && retry) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            return apiClient(path, options, false); // retry once with new token
        }
        // Refresh failed — force logout
        clearTokens();
        window.location.href = getRoleLoginPath();
        throw new Error('Session expired. Please log in again.');
    }

    if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
    }

    if (response.status === 403) {
        throw new Error('You do not have permission to perform this action.');
    }

    return response;
};

export default apiClient;
