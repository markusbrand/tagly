import api from './api';

export interface StickerTemplate {
  id: number;
  name: string;
  label_width_mm: number;
  label_height_mm: number;
  h_pitch_mm: number;
  v_pitch_mm: number;
  left_margin_mm: number;
  top_margin_mm: number;
  rows: number;
  columns: number;
  offset_x_mm: number;
  offset_y_mm: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type StickerTemplateFormData = Omit<StickerTemplate, 'id' | 'created_at' | 'updated_at'>;

export const stickerTemplatesService = {
  list: () =>
    api.get<{ results: StickerTemplate[]; count: number }>('/qr/templates/'),

  create: (data: StickerTemplateFormData) =>
    api.post<StickerTemplate>('/qr/templates/', data),

  update: (id: number, data: Partial<StickerTemplate>) =>
    api.patch<StickerTemplate>(`/qr/templates/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/qr/templates/${id}/`),
};
