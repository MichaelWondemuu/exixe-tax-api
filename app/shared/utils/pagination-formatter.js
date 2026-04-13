import {
  DataResponseFormat,
  enrichResponseDataItems,
} from './response-formatter.js';

/**
 * Transform DataResponseFormat to frontend-expected paginated format
 * @param {DataResponseFormat|Object} response - Response from repository
 * @param {Object} queryParams - Query parameters (page, limit, etc.)
 * @returns {Object} Formatted paginated response
 */
export function formatPaginatedResponse(response, queryParams = {}) {
  // If not a DataResponseFormat, return as is
  if (!(response instanceof DataResponseFormat)) {
    return response;
  }

  const total = response.count || 0;
  const page = queryParams.page || 1;
  const page_size = queryParams.limit || queryParams.take || response.data.length || 10;
  const total_pages = page_size > 0 ? Math.ceil(total / page_size) : 0;

  return {
    data: enrichResponseDataItems(response.data),
    total,
    page,
    page_size,
    total_pages,
  };
}

