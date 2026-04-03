/**
 * Normalize Django REST Framework error payloads for display.
 */

export function flattenDrfDetail(detail: unknown): string {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((x) => {
        if (typeof x === 'string') return x;
        if (
          typeof x === 'object' &&
          x !== null &&
          'string' in x &&
          typeof (x as { string: string }).string === 'string'
        ) {
          return (x as { string: string }).string;
        }
        return String(x);
      })
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

/**
 * First message from top-level validation keys (e.g. `guid`, `name`, `non_field_errors`).
 */
export function firstDrfFieldMessage(
  data: Record<string, unknown> | undefined,
  skipKeys: string[],
): string {
  if (!data || typeof data !== 'object') return '';
  const skip = new Set(skipKeys);
  for (const [k, v] of Object.entries(data)) {
    if (skip.has(k) || k === 'detail') continue;
    if (Array.isArray(v) && v.length > 0) {
      const first = v[0];
      if (typeof first === 'string') return first;
      if (
        typeof first === 'object' &&
        first !== null &&
        'string' in first &&
        typeof (first as { string: string }).string === 'string'
      ) {
        return (first as { string: string }).string;
      }
      return String(first);
    }
    if (typeof v === 'string' && v) return v;
  }
  return '';
}
