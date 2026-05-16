import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

// Add a response interceptor for detailed error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      
      // Silence expected errors handled by callers
      if (
        error.response.status === 401 ||
        (error.response.status === 404 && error.config?.url === '/meal-plans/current')
      ) {
        return Promise.reject(error);
      }

      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.warn('Backend server is not responding. Please ensure the backend is running.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
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
  updateItem: (listId: string, itemId: string, data: any) => 
    api.patch(`/shopping-lists/${listId}/items/${itemId}`, data),
  addItem: (listId: string, data: any) => 
    api.post(`/shopping-lists/${listId}/items`, data),
};

export const mealPlansApi = {
  getCurrent: (params?: any) => api.get('/meal-plans/current', { params }),
  save: (data: any) => api.post('/meal-plans', data),
};

export default api;
