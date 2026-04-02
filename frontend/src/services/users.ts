import api from './api';
import type { User } from './auth';

export type UserLanguage = 'en' | 'de';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
  language: UserLanguage;
}

export interface UpdateUserData {
  role?: 'USER' | 'ADMIN';
  language?: UserLanguage;
  is_active?: boolean;
}

export const usersService = {
  list: () =>
    api.get<{ results: User[]; count: number }>('/users/'),

  create: (data: CreateUserData) =>
    api.post<User>('/users/', data),

  update: (id: number, data: UpdateUserData) =>
    api.patch<User>(`/users/${id}/`, data),
};
