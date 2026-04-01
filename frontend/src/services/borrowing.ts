import api from './api';

export interface BorrowRecord {
  id: number;
  asset: { id: number; name: string; guid: string };
  customer: { id: number; first_name: string; last_name: string; email: string };
  user: { username: string };
  borrowed_from: string;
  borrowed_until: string | null;
  returned_at: string | null;
  status: 'ACTIVE' | 'RETURNED';
  notes: string;
  created_at: string;
}

export interface BorrowCreateData {
  asset_id: number;
  customer_id: number;
  borrowed_from?: string;
  borrowed_until?: string;
  notes?: string;
}

export const borrowingService = {
  list: (params?: Record<string, string>) =>
    api.get<{ results: BorrowRecord[]; count: number }>('/borrowing/', { params }),

  create: (data: BorrowCreateData) =>
    api.post<BorrowRecord>('/borrowing/create/', data),

  return: (id: number, data?: { returned_at?: string; notes?: string }) =>
    api.post<BorrowRecord>(`/borrowing/${id}/return/`, data || {}),

  getDetail: (id: number) =>
    api.get<BorrowRecord>(`/borrowing/${id}/`),

  getAssetHistory: (assetId: number) =>
    api.get<{ results: BorrowRecord[] }>(`/borrowing/asset/${assetId}/history/`),
};
