import { BaseResponse } from '../responses/base.response.js';

export function enrichResponseDataItems(items) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => BaseResponse.enrichEntity(item));
}

/**
 * Data Response Format
 * Standard format for API responses with count and data
 */
export class DataResponseFormat {
  constructor(data = [], count = 0) {
    this.count = count;
    this.data = Array.isArray(data) ? data : [data];
  }

  /**
   * Create a response format from data
   * @param {Array|Object} data - Data to wrap
   * @param {number} count - Total count (optional, defaults to data length)
   * @returns {DataResponseFormat}
   */
  static from(data, count = null) {
    const dataArray = Array.isArray(data) ? data : [data];
    const totalCount = count !== null ? count : dataArray.length;
    return new DataResponseFormat(dataArray, totalCount);
  }

  /**
   * Create an empty response
   * @returns {DataResponseFormat}
   */
  static empty() {
    return new DataResponseFormat([], 0);
  }
}


/**
 * Format response for API
 * Ensures consistent response format across all endpoints
 * @param {DataResponseFormat|Object|Array} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted response object
 */
export function formatResponse(data, statusCode = 200) {
  // If already a DataResponseFormat, return as is
  if (data instanceof DataResponseFormat) {
    const enriched = new DataResponseFormat(
      enrichResponseDataItems(data.data),
      data.count,
    );
    return {
      success: statusCode >= 200 && statusCode < 300,
      statusCode,
      ...enriched,
    };
  }

  // If array, wrap in DataResponseFormat
  if (Array.isArray(data)) {
    const formatted = DataResponseFormat.from(enrichResponseDataItems(data));
    return {
      success: statusCode >= 200 && statusCode < 300,
      statusCode,
      ...formatted,
    };
  }

  // If single object, wrap in DataResponseFormat
  if (data && typeof data === 'object') {
    const formatted = DataResponseFormat.from(BaseResponse.enrichEntity(data));
    return {
      success: statusCode >= 200 && statusCode < 300,
      statusCode,
      ...formatted,
    };
  }

  // Fallback for primitive values
  return {
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    data: [data],
    count: 1
  };
}