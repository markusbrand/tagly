import api from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
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

  logout: () => api.post('/users/logout/'),

  getMe: () => api.get<User>('/users/me/'),

  updatePreferences: (
    prefs: Partial<Pick<User, 'language' | 'theme_preference' | 'notification_enabled'>>,
  ) => api.patch<User>('/users/me/preferences/', prefs),

  getCsrfToken: () => api.get('/users/csrf/'),
};
