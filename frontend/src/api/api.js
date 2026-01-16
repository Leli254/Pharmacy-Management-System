// src/api/api.js
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
                // Optional: window.location.href = "/login";
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
 * @returns {Promise<any>} response data
 */
export async function apiRequest(method, url, data = null, params = null) {
    // eslint-disable-next-line no-useless-catch
    try {
        const response = await api({
            method,
            url,
            data,
            params,
        });
        return response.data;
    } catch (error) {
        throw error; // Let components handle errors
    }
}

// Convenience helpers
export const apiGet = (url, params = null) => apiRequest("get", url, null, params);
export const apiPost = (url, data = null) => apiRequest("post", url, data);
export const apiPut = (url, data = null) => apiRequest("put", url, data);
export const apiDelete = (url, data = null) => apiRequest("delete", url, data);
export const apiPatch = (url, data = null) => apiRequest("patch", url, data);