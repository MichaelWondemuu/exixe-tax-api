import { DataResponseFormat } from '../../../../shared/utils/response-formatter.js';

export function mapExciseDataResponse(result, toResponseFn) {
  if (result instanceof DataResponseFormat) {
    return new DataResponseFormat(
      result.data.map((row) => toResponseFn(row)),
      result.count,
    );
  }
  return toResponseFn(result);
}
