import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Token injector — call this from a component that has access to Clerk
let getTokenFn: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    const token = await getTokenFn();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.error || error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);