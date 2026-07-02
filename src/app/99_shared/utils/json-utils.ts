/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Handle map type during JSON.stringify
 * @param _key
 * @param value
 * @returns
 */
export function mapHandlerReplacer(_key: any, value: any) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
}

/**
 * Handle map type during JSON.parse
 * @param key
 * @param value
 * @returns
 */
export function mapHandlerReviver(_key: any, value: any) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}
