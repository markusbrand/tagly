import type { CustomFieldDefinition } from '../services/customFields';

function isEmpty(value: unknown, fieldType: CustomFieldDefinition['field_type']): boolean {
  if (value === null || value === undefined) return true;
  if (fieldType === 'MULTI_SELECT') {
    return !Array.isArray(value) || value.length === 0;
  }
  if (fieldType === 'NUMBER' || fieldType === 'DECIMAL') {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  return false;
}

function coerceRules(rules: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(rules || {})) {
    if (typeof v === 'number' && ['min', 'max', 'min_length', 'max_length'].includes(k)) {
      out[k] = k.endsWith('_length') ? Math.trunc(v) : v;
    } else if (typeof v === 'string' && ['min', 'max', 'min_length', 'max_length'].includes(k)) {
      const n = parseFloat(v);
      out[k] = Number.isFinite(n) ? (k.endsWith('_length') ? Math.trunc(n) : n) : v;
    } else if (typeof v === 'string') {
      out[k] = v;
    }
  }
  return out;
}

function validateSingle(def: CustomFieldDefinition, value: unknown): string | null {
  const ft = def.field_type;
  const rules = coerceRules(def.validation_rules || {});
  const choices = def.options?.choices ?? [];

  if (ft === 'STRING') {
    if (typeof value !== 'string') return 'Expected text.';
    const s = value.trim();
    const ml = rules.min_length as number | undefined;
    const xl = rules.max_length as number | undefined;
    if (ml !== undefined && s.length < ml) return `At least ${ml} characters.`;
    if (xl !== undefined && s.length > xl) return `At most ${xl} characters.`;
    const pat = rules.pattern;
    if (typeof pat === 'string' && pat.length > 0) {
      try {
        const re = new RegExp(pat);
        if (!re.test(s)) return 'Value does not match the required pattern.';
      } catch {
        /* ignore invalid admin regex */
      }
    }
    return null;
  }

  if (ft === 'DATE') {
    if (typeof value !== 'string' || !value.trim()) return 'Pick a date.';
    return null;
  }

  if (ft === 'NUMBER') {
    let n: number;
    if (typeof value === 'number' && Number.isInteger(value)) {
      n = value;
    } else if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return 'Enter a whole number.';
      n = parsed;
    } else {
      return 'Enter a whole number.';
    }
    const min = rules.min as number | undefined;
    const max = rules.max as number | undefined;
    if (min !== undefined && n < min) return `Must be ≥ ${min}.`;
    if (max !== undefined && n > max) return `Must be ≤ ${max}.`;
    return null;
  }

  if (ft === 'DECIMAL') {
    const raw = typeof value === 'number' ? String(value) : String(value ?? '');
    if (raw.trim() === '') return 'Enter a number.';
    const n = Number(raw.replace(',', '.'));
    if (!Number.isFinite(n)) return 'Enter a valid decimal.';
    const min = rules.min as number | undefined;
    const max = rules.max as number | undefined;
    if (min !== undefined && n < min) return `Must be ≥ ${min}.`;
    if (max !== undefined && n > max) return `Must be ≤ ${max}.`;
    return null;
  }

  if (ft === 'SINGLE_SELECT') {
    if (typeof value !== 'string' || !choices.includes(value)) return 'Select a valid option.';
    return null;
  }

  if (ft === 'MULTI_SELECT') {
    if (!Array.isArray(value)) return 'Invalid selection.';
    const bad = value.filter((x) => !choices.includes(String(x)));
    if (bad.length) return 'One or more values are not allowed.';
    return null;
  }

  return null;
}

/**
 * Returns field id -> error message (same shape as API `custom_fields` errors).
 */
export function validateAssetCustomFieldValues(
  definitions: CustomFieldDefinition[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const d of definitions) {
    const fid = String(d.id);
    const raw = values[fid];

    if (d.is_mandatory) {
      if (isEmpty(raw, d.field_type)) {
        errors[fid] = `"${d.name}" is required.`;
        continue;
      }
    }

    if (isEmpty(raw, d.field_type)) continue;

    const msg = validateSingle(d, raw);
    if (msg) errors[fid] = msg;
  }

  return errors;
}

/**
 * Same as {@link validateAssetCustomFieldValues} plus: every definition id must exist as a key
 * (matches backend `validate_asset_custom_fields_for_asset_create`).
 */
export function validateAssetCustomFieldValuesForCreate(
  definitions: CustomFieldDefinition[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors = validateAssetCustomFieldValues(definitions, values);
  for (const d of definitions) {
    const fid = String(d.id);
    if (!(fid in values)) {
      errors[fid] = `"${d.name}" must be included in the form.`;
    }
  }
  return errors;
}

export function initialValueForField(fieldType: CustomFieldDefinition['field_type']): unknown {
  if (fieldType === 'MULTI_SELECT') return [];
  if (fieldType === 'NUMBER' || fieldType === 'DECIMAL') return '';
  return '';
}
