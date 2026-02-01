import type { ResponseData, ApiResponse } from 'fossyl';

/**
 * Wraps handler response data in the standard API response format.
 */
export function wrapResponse<T extends ResponseData>(data: T): ApiResponse<T> {
  return {
    success: 'true',
    type: data.typeName,
    data,
  };
}
