import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
});

// Helper to check if error is a network error or 5xx
const isRetryableError = (error: any) => {
  return !error.response || (error.response.status >= 500 && error.response.status <= 599);
};

// Add a response interceptor for detailed error logging and user notification
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Retry logic for network errors or 5xx server errors
    if (isRetryableError(error) && !config._retryCount) {
      config._retryCount = (config._retryCount || 0) + 1;
      if (config._retryCount <= 3) {
        console.warn(`Retrying request to ${config.url} (${config._retryCount}/3)...`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, config._retryCount * 1000));
        return api(config);
      }
    }

    if (error.response) {
      // Don't log or throw standard 401/404 errors as they are handled by components
      if (
        error.response.status === 401 ||
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
      // Only log network error if we've exhausted retries or it's not a retryable case
      if (!config._retryCount || config._retryCount >= 3) {
        console.error('Network Error: Backend server is not responding at', API_URL);
      }
    } else {
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  } else {
    // If no session and trying to call protected API, we might want to cancel
    // For now, we'll just log a warning if it's not the login page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      console.warn('Attempted API call without active session:', config.url);
    }
  }
  return config;
});

export const mealsApi = {
  getAll: (params?: any) => api.get('/meals', { params }),
  getById: (id: string) => api.get(`/meals/${id}`),
  create: (data: any) => api.post('/meals', data),
  update: (id: string, data: any) => api.put(`/meals/${id}`, data),
  delete: (id: string) => api.delete(`/meals/${id}`),
};

export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const shoppingListsApi = {
  getCurrent: () => api.get('/shopping-lists/current'),
  generate: (data: any) => api.post('/shopping-lists/generate', data),
  updateItem: (listId: string, itemId: string, data: any) => 
    api.patch(`/shopping-lists/${listId}/items/${itemId}`, data),
  addItem: (listId: string, data: any) => 
    api.post(`/shopping-lists/${listId}/items`, data),
  deleteItem: (listId: string, itemId: string) => 
    api.delete(`/shopping-lists/${listId}/items/${itemId}`),
  complete: (listId: string) => api.post(`/shopping-lists/${listId}/complete`),
};

export const mealPlansApi = {
  getCurrent: (params?: any) => api.get('/meal-plans/current', { params }),
  save: (data: any) => api.post('/meal-plans', data),
  update: (planId: string, data: any) => api.put(`/meal-plans/${planId}`, data),
};

export default api;
