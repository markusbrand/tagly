import { describe, expect, it } from 'vitest';
import type { CustomFieldDefinition } from '../services/customFields';
import {
  initialValueForField,
  validateAssetCustomFieldValues,
  validateAssetCustomFieldValuesForCreate,
} from './assetCustomFieldValidation';

function def(overrides: Partial<CustomFieldDefinition> & Pick<CustomFieldDefinition, 'id' | 'name' | 'field_type'>): CustomFieldDefinition {
  return {
    entity_type: 'ASSET',
    is_mandatory: false,
    options: {},
    validation_rules: {},
    display_order: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('validateAssetCustomFieldValues', () => {
  it('flags mandatory empty string', () => {
    const d = def({ id: 1, name: 'Serial', field_type: 'STRING', is_mandatory: true });
    expect(validateAssetCustomFieldValues([d], { '1': '' })).toEqual({
      '1': '"Serial" is required.',
    });
  });

  it('allows optional omitted', () => {
    const d = def({ id: 2, name: 'Note', field_type: 'STRING', is_mandatory: false });
    expect(validateAssetCustomFieldValues([d], {})).toEqual({});
  });

  it('enforces string length and pattern', () => {
    const d = def({
      id: 3,
      name: 'Code',
      field_type: 'STRING',
      validation_rules: { min_length: 2, max_length: 4, pattern: '^[0-9]+$' },
    });
    expect(validateAssetCustomFieldValues([d], { '3': '1' })['3']).toMatch(/At least/);
    expect(validateAssetCustomFieldValues([d], { '3': '12345' })['3']).toMatch(/At most/);
    expect(validateAssetCustomFieldValues([d], { '3': 'ab' })['3']).toMatch(/pattern/);
    expect(validateAssetCustomFieldValues([d], { '3': '123' })).toEqual({});
  });

  it('validates number and decimal', () => {
    const n = def({
      id: 4,
      name: 'Qty',
      field_type: 'NUMBER',
      validation_rules: { min: 1, max: 10 },
    });
    expect(validateAssetCustomFieldValues([n], { '4': '0' })['4']).toMatch(/≥/);
    expect(validateAssetCustomFieldValues([n], { '4': '11' })['4']).toMatch(/≤/);
    expect(validateAssetCustomFieldValues([n], { '4': '5' })).toEqual({});

    const dec = def({
      id: 5,
      name: 'Price',
      field_type: 'DECIMAL',
      validation_rules: { min: 1, max: 3 },
    });
    expect(validateAssetCustomFieldValues([dec], { '5': '0,5' })['5']).toMatch(/≥/);
    expect(validateAssetCustomFieldValues([dec], { '5': '2,5' })).toEqual({});
  });

  it('validates selects', () => {
    const single = def({
      id: 6,
      name: 'Pick',
      field_type: 'SINGLE_SELECT',
      options: { choices: ['a', 'b'] },
    });
    expect(validateAssetCustomFieldValues([single], { '6': 'c' })['6']).toMatch(/valid option/);

    const multi = def({
      id: 7,
      name: 'Tags',
      field_type: 'MULTI_SELECT',
      options: { choices: ['x', 'y'] },
    });
    expect(validateAssetCustomFieldValues([multi], { '7': ['x', 'z'] })['7']).toMatch(/not allowed/);
    expect(validateAssetCustomFieldValues([multi], { '7': ['x'] })).toEqual({});
  });
});

describe('validateAssetCustomFieldValuesForCreate', () => {
  it('requires every definition key to be present', () => {
    const a = def({ id: 10, name: 'A', field_type: 'STRING' });
    const b = def({ id: 11, name: 'B', field_type: 'STRING', display_order: 1 });
    const err = validateAssetCustomFieldValuesForCreate([a, b], { '10': '' });
    expect(err['11']).toBe('"B" must be included in the form.');
  });
});

describe('initialValueForField', () => {
  it('returns sensible defaults', () => {
    expect(initialValueForField('MULTI_SELECT')).toEqual([]);
    expect(initialValueForField('NUMBER')).toBe('');
    expect(initialValueForField('STRING')).toBe('');
  });
});
