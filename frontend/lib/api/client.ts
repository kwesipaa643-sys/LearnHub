// lib/api/client.ts
// ============================================================
// Axios API Client — handles auth tokens, errors, base URL
// ============================================================

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/lib/stores/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

// ============================================================
// REQUEST INTERCEPTOR — Attach auth token
// ============================================================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // For multipart/form-data, let browser set Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR — Handle errors globally
// ============================================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const status = error.response?.status;

    // 401 — Token expired or invalid
    if (status === 401) {
      Cookies.remove('auth_token');
      useAuthStore.getState().logout();

      if (typeof window !== 'undefined') {
        window.location.href = '/login?session=expired';
      }
    }

    // 403 — Forbidden
    if (status === 403) {
      if (typeof window !== 'undefined') {
        window.location.href = '/403';
      }
    }

    // 429 — Rate limited
    if (status === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      console.warn(`Rate limited. Retry after ${retryAfter}s`);
    }

    return Promise.reject(error);
  }
);

// ============================================================
// TYPED API HELPERS
// ============================================================

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

export async function del<T>(url: string): Promise<T> {
  const response = await apiClient.delete<T>(url);
  return response.data;
}

export async function postFormData<T>(url: string, formData: FormData): Promise<T> {
  const response = await apiClient.post<T>(url, formData);
  return response.data;
}

export default apiClient;
