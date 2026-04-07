/**
 * Central API base URL — reads from .env so it works in dev and production
 * without changing any component code.
 */
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default API_BASE;
