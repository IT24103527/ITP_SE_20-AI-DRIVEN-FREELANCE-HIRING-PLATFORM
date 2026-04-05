const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    // If accessing via IP or other hostname, use that for the API too
    // Default to localhost:8080 if on localhost, otherwise use current hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:8080';
    }
    return `http://${hostname}:8080`;
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
