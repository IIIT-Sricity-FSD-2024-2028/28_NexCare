/**
 * Query Parameters DTO - Simple data transfer object
 * Transfers query parameters for filtering and pagination
 */
export class QueryParamsDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  category?: string;
}
