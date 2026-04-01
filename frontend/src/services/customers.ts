import api from './api';

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}

export interface Country {
  code: string;
  name: string;
}

export const customerService = {
  list: (params?: Record<string, string>) =>
    api.get<{ results: Customer[]; count: number }>('/customers/', { params }),

  create: (data: Omit<Customer, 'id'>) =>
    api.post<Customer>('/customers/', data),

  update: (id: number, data: Partial<Customer>) =>
    api.patch<Customer>(`/customers/${id}/`, data),

  getCountries: () =>
    api.get<Country[]>('/customers/countries/'),
};
