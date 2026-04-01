import api from './api';

export interface CustomFieldDefinition {
  id: number;
  entity_type: 'ASSET' | 'CUSTOMER';
  name: string;
  field_type: 'DATE' | 'STRING' | 'NUMBER' | 'DECIMAL' | 'SINGLE_SELECT' | 'MULTI_SELECT';
  is_mandatory: boolean;
  options: { choices?: string[] };
  validation_rules: Record<string, unknown>;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type CustomFieldFormData = Omit<CustomFieldDefinition, 'id' | 'created_at' | 'updated_at'>;

export const customFieldsService = {
  listDefinitions: (entityType?: string) =>
    api.get<{ results: CustomFieldDefinition[]; count: number }>(
      '/custom-fields/definitions/',
      { params: entityType ? { entity_type: entityType } : {} },
    ),

  createDefinition: (data: CustomFieldFormData) =>
    api.post<CustomFieldDefinition>('/custom-fields/definitions/', data),

  updateDefinition: (id: number, data: Partial<CustomFieldDefinition>) =>
    api.patch<CustomFieldDefinition>(`/custom-fields/definitions/${id}/`, data),

  deleteDefinition: (id: number) =>
    api.delete(`/custom-fields/definitions/${id}/`),

  getValues: (entityType: string, entityId: number) =>
    api.get<Record<string, unknown>>(`/custom-fields/values/${entityType}/${entityId}/`),

  setValues: (entityType: string, entityId: number, values: Record<string, unknown>) =>
    api.put(`/custom-fields/values/${entityType}/${entityId}/`, { values }),
};
