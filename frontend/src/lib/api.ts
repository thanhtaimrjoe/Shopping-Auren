import axios, { type InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/** Sync access token from AuthContext to avoid getSession() on every API call. */
export function setApiAccessToken(token: string | null, expiresAt?: number) {
  cachedAccessToken = token;
  tokenExpiresAt = expiresAt ?? 0;
}

function isTokenStale(): boolean {
  if (!cachedAccessToken) return true;
  if (!tokenExpiresAt) return false;
  // Refresh one minute before expiry
  return Date.now() / 1000 >= tokenExpiresAt - 60;
}

async function resolveAccessToken(): Promise<string | null> {
  if (!isTokenStale()) {
    return cachedAccessToken;
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('API Request Auth Error:', error.message);
    cachedAccessToken = null;
    tokenExpiresAt = 0;
    return null;
  }

  if (session?.access_token) {
    cachedAccessToken = session.access_token;
    tokenExpiresAt = session.expires_at ?? 0;
    return session.access_token;
  }

  cachedAccessToken = null;
  tokenExpiresAt = 0;
  return null;
}

type RetryableConfig = InternalAxiosRequestConfig & { _retryCount?: number };

const isRetryableError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  return !error.response || (error.response.status >= 500 && error.response.status <= 599);
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableConfig | undefined;
    if (!config) {
      return Promise.reject(error);
    }

    const retryCount = config._retryCount ?? 0;
    if (isRetryableError(error) && retryCount < 3) {
      const nextRetry = retryCount + 1;
      config._retryCount = nextRetry;
      console.warn(`Retrying request to ${config.url} (${nextRetry}/3)...`);
      await new Promise((resolve) => setTimeout(resolve, nextRetry * 1000));
      return api(config);
    }

    if (error.response) {
      if (error.response.status === 401) {
        cachedAccessToken = null;
        tokenExpiresAt = 0;
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/reset-password')
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      if (
        (error.response.status === 404 && error.config?.url === '/meal-plans/current') ||
        (error.response.status === 404 && error.config?.url === '/shopping-lists/current')
      ) {
        return Promise.reject(error);
      }

      console.error('API Error Response:', {
        status: error.response.status,
        url: error.config?.url,
        data: error.response.data,
      });
    } else if (error.request) {
      if (retryCount >= 3) {
        console.error('Network Error: Backend server is not responding at', API_URL);
      }
    } else {
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(async (config) => {
  try {
    const token = await resolveAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      console.warn('Attempted API call without active session:', config.url);
    }
  } catch (e) {
    console.error('Unexpected error in API request interceptor:', e);
  }
  return config;
});

export const mealsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/meals', { params }),
  getSuggestions: (params?: Record<string, unknown>) =>
    api.get('/meals/suggestions', { params }),
  getById: (id: string) => api.get(`/meals/${id}`),
  create: (data: unknown) => api.post('/meals', data),
  update: (id: string, data: unknown) => api.put(`/meals/${id}`, data),
  delete: (id: string) => api.delete(`/meals/${id}`),
};

export const productsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: unknown) => api.post('/products', data),
  update: (id: string, data: unknown) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const shoppingListsApi = {
  getCurrent: () => api.get('/shopping-lists/current'),
  getHistory: (params?: Record<string, unknown>) =>
    api.get('/shopping-lists/history', { params }),
  getById: (listId: string) => api.get(`/shopping-lists/${listId}`),
  generate: (data: unknown) => api.post('/shopping-lists/generate', data),
  updateItem: (listId: string, itemId: string, data: unknown) =>
    api.patch(`/shopping-lists/${listId}/items/${itemId}`, data),
  addItem: (listId: string, data: unknown) =>
    api.post(`/shopping-lists/${listId}/items`, data),
  deleteItem: (listId: string, itemId: string) =>
    api.delete(`/shopping-lists/${listId}/items/${itemId}`),
  complete: (listId: string) => api.post(`/shopping-lists/${listId}/complete`),
};

export const mealPlansApi = {
  getCurrent: (params?: Record<string, unknown>) => api.get('/meal-plans/current', { params }),
  save: (data: unknown) => api.post('/meal-plans', data),
  update: (planId: string, data: unknown) => api.put(`/meal-plans/${planId}`, data),
  delete: (planId: string) => api.delete(`/meal-plans/${planId}`),
};

export default api;
