import api from './api';

export interface Asset {
  id: number;
  guid: string;
  name: string;
  status: 'AVAILABLE' | 'BORROWED' | 'DELETED';
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  created_by: { username: string };
}

export interface AssetDetail extends Asset {
  delete_reason: string | null;
  borrow_records: BorrowRecordSummary[];
  custom_field_values: Record<string, unknown>;
}

export interface BorrowRecordSummary {
  id: number;
  customer_name: string;
  borrowed_from: string;
  borrowed_until: string | null;
  returned_at: string | null;
  status: string;
}

export const assetService = {
  list: (params?: Record<string, string>) =>
    api.get<{ results: Asset[]; count: number }>('/assets/', { params }),

  getById: (id: number) => api.get<AssetDetail>(`/assets/${id}/`),

  getByGuid: (guid: string) => api.get<AssetDetail>(`/assets/guid/${guid}/`),

  create: (data: {
    name: string;
    guid?: string;
    custom_fields?: Record<string, unknown>;
  }) => api.post<Asset>('/assets/', data),

  update: (id: number, data: Partial<Asset>) =>
    api.patch<Asset>(`/assets/${id}/`, data),

  softDelete: (id: number, reason: string) =>
    api.post(`/assets/${id}/delete/`, { delete_reason: reason }),
};
