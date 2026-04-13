import axios, { type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  /** Relative `/api/v1` uses Vite dev proxy to Django (see vite.config.ts). Override with full URL if needed. */
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.data instanceof FormData) {
    const h = config.headers;
    // Axios 1.x uses AxiosHeaders; bracket-delete does not clear defaults → multipart breaks → 400.
    if (h && typeof h.delete === 'function') {
      h.delete('Content-Type');
      h.delete('content-type');
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status as number;
      const url = error.config?.url ?? '';
      const isAuthCheck = url.includes('/users/me') || url.includes('/users/login');
      const isUnauthenticatedMe =
        url.includes('/users/me') && (status === 401 || status === 403);
      if (status === 401 && !isAuthCheck) {
        window.location.href = '/login';
      }
      if (!isUnauthenticatedMe) {
        console.error(
          `[API] ${error.config?.method?.toUpperCase()} ${url} → ${status}`,
          error.response.data,
        );
      }
    } else if (error.request) {
      console.error('[API] No response received – possible network error', error.message);
    } else {
      console.error('[API] Request setup error', error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
