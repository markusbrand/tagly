import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import api from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  /** True for Django superusers; Tagly admin UI treats this like ADMIN role. */
  is_superuser: boolean;
  language: string;
  theme_preference: string;
  notification_enabled: boolean;
  appearance_font_color: string;
  appearance_bg_color: string;
  appearance_bg_image: string;
  /** 0 = image opaque, 100 = image fully transparent (background color shows). */
  appearance_bg_image_transparency: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<User>('/users/login/', credentials),

  logout: async () => {
    try {
      await api.post('/users/logout/');
    } finally {
      delete api.defaults.headers.common['X-CSRFToken'];
    }
  },

  getMe: () => api.get<User>('/users/me/'),

  updatePreferences: (
    prefs: Partial<
      Pick<
        User,
        | 'language'
        | 'theme_preference'
        | 'notification_enabled'
        | 'appearance_font_color'
        | 'appearance_bg_color'
        | 'appearance_bg_image_transparency'
      >
    >,
  ) => api.patch<User>('/users/me/preferences/', prefs),

  /**
   * Do not use axios for this POST: axios 1.x dispatchRequest sets
   * Content-Type to application/x-www-form-urlencoded for POST while the body
   * stays FormData, so Django never parses FILES → 400. fetch() omits
   * Content-Type so the browser sets multipart + boundary.
   */
  uploadBackgroundImage: async (file: File) => {
    const form = new FormData();
    form.append('image', file);
    const base = (api.defaults.baseURL ?? '/api/v1').replace(/\/$/, '');
    const url = `${base}/users/me/background-image/`;
    const csrf = api.defaults.headers.common['X-CSRFToken'];
    const headers: Record<string, string> = {};
    if (csrf) headers['X-CSRFToken'] = String(csrf);
    const res = await fetch(url, { method: 'POST', credentials: 'include', headers, body: form });
    let data: unknown = {};
    try {
      data = await res.json();
    } catch {
      /* non-JSON body */
    }
    if (!res.ok) {
      const response: AxiosResponse = {
        data,
        status: res.status,
        statusText: res.statusText,
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };
      throw new AxiosError(
        `Request failed with status code ${res.status}`,
        undefined,
        undefined,
        undefined,
        response,
      );
    }
    return { data: data as User };
  },

  deleteBackgroundImage: () => api.delete('/users/me/background-image/'),

  getCsrfToken: async () => {
    const res = await api.get<{ detail: string; csrfToken: string }>('/users/csrf/');
    const token = res.data.csrfToken;
    if (token) {
      api.defaults.headers.common['X-CSRFToken'] = token;
    }
    return res;
  },
};
