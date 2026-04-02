import type { CustomFieldDefinition } from '../services/customFields';

/**
 * Build API payload: one key per asset field definition (required for strict create validation).
 */
export function buildCustomFieldsPayload(
  definitions: CustomFieldDefinition[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const d of definitions) {
    const key = String(d.id);
    const raw = values[key];
    if (d.field_type === 'MULTI_SELECT') {
      out[key] = Array.isArray(raw) ? raw : [];
      continue;
    }
    if (d.field_type === 'NUMBER') {
      if (typeof raw === 'string' && raw.trim() !== '') {
        const n = Number(raw);
        out[key] = Number.isFinite(n) ? Math.trunc(n) : null;
      } else if (typeof raw === 'number') {
        out[key] = Math.trunc(raw);
      } else {
        out[key] = null;
      }
      continue;
    }
    if (d.field_type === 'DECIMAL') {
      if (typeof raw === 'string' && raw.trim() !== '') {
        const n = Number(raw.replace(',', '.'));
        out[key] = Number.isFinite(n) ? n : null;
      } else if (typeof raw === 'number') {
        out[key] = raw;
      } else {
        out[key] = null;
      }
      continue;
    }
    if (d.field_type === 'STRING' || d.field_type === 'DATE' || d.field_type === 'SINGLE_SELECT') {
      out[key] = typeof raw === 'string' ? raw : '';
      continue;
    }
  }
  return out;
}
