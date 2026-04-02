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
    prefs: Partial<Pick<User, 'language' | 'theme_preference' | 'notification_enabled'>>,
  ) => api.patch<User>('/users/me/preferences/', prefs),

  getCsrfToken: async () => {
    const res = await api.get<{ detail: string; csrfToken: string }>('/users/csrf/');
    const token = res.data.csrfToken;
    if (token) {
      api.defaults.headers.common['X-CSRFToken'] = token;
    }
    return res;
  },
};
