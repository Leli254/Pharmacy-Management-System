import axios from "axios";

const api = axios.create({
    baseURL: "/api",                    // All calls prefixed with /api
    timeout: 15000,                     // Prevent hanging on slow networks
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor: Attach JWT token if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Global error handling
api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response) {
            const status = error.response.status;

            // Handle 401 (unauthorized) - clear token & optionally redirect
            if (status === 401) {
                localStorage.removeItem("access_token");
                console.warn("Unauthorized - token removed");
            }

            return Promise.reject({
                ...error,
                message: error.response?.data?.detail || "Request failed",
                status,
            });
        }

        if (error.request) {
            return Promise.reject({
                message: "Network error - please check your connection",
                isNetworkError: true,
            });
        }

        return Promise.reject(error);
    }
);

/**
 * Generic API request wrapper
 * @param {string} method - HTTP method (get, post, put, delete, patch...)
 * @param {string} url - endpoint path (without /api prefix)
 * @param {object} [data] - request body
 * @param {object} [params] - query parameters
 * @param {object} [config] - extra axios config (like responseType: 'blob')
 * @returns {Promise<any>} response data
 */
export async function apiRequest(method, url, data = null, params = null, config = {}) {
    try {
        const response = await api({
            method,
            url,
            data,
            params,
            ...config, // This allows passing { responseType: 'blob' }
        });

        // Log the response type for debugging
        if (config.responseType === 'blob') {
            console.log(`[API] Blob received from ${url}, size: ${response.data.size} bytes`);
        }

        return response.data;
    } catch (error) {
        // Log errors for easier tracing
        console.error(`[API Error] ${method.toUpperCase()} ${url}:`, error.message);
        throw error;
    }
}

// Convenience helpers updated to accept config
export const apiGet = (url, params = null, config = {}) =>
    apiRequest("get", url, null, params, config);

export const apiPost = (url, data = null, config = {}) =>
    apiRequest("post", url, data, null, config);

export const apiPut = (url, data = null, config = {}) =>
    apiRequest("put", url, data, null, config);

export const apiDelete = (url, data = null, config = {}) =>
    apiRequest("delete", url, data, null, config);

export const apiPatch = (url, data = null, config = {}) =>
    apiRequest("patch", url, data, null, config);