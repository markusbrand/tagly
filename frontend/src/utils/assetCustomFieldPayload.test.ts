import { describe, expect, it } from 'vitest';
import type { CustomFieldDefinition } from '../services/customFields';
import { buildCustomFieldsPayload } from './assetCustomFieldPayload';

function def(
  overrides: Partial<CustomFieldDefinition> & Pick<CustomFieldDefinition, 'id' | 'name' | 'field_type'>,
): CustomFieldDefinition {
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

describe('buildCustomFieldsPayload', () => {
  it('maps each definition id and normalizes types', () => {
    const definitions = [
      def({ id: 1, name: 'Note', field_type: 'STRING' }),
      def({ id: 2, name: 'Qty', field_type: 'NUMBER' }),
      def({ id: 3, name: 'Price', field_type: 'DECIMAL' }),
      def({ id: 4, name: 'Tags', field_type: 'MULTI_SELECT', options: { choices: ['a'] } }),
    ];
    const values: Record<string, unknown> = {
      '1': '  hi  ',
      '2': '7',
      '3': '1,5',
      '4': ['a'],
    };
    expect(buildCustomFieldsPayload(definitions, values)).toEqual({
      '1': '  hi  ',
      '2': 7,
      '3': 1.5,
      '4': ['a'],
    });
  });

  it('uses empty multi-select and null for empty number', () => {
    const definitions = [
      def({ id: 10, name: 'Tags', field_type: 'MULTI_SELECT' }),
      def({ id: 11, name: 'N', field_type: 'NUMBER' }),
    ];
    expect(
      buildCustomFieldsPayload(definitions, {
        '10': 'not-array',
        '11': '',
      }),
    ).toEqual({
      '10': [],
      '11': null,
    });
  });
});
