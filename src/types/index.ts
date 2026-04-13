export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  permissions: string[];
}
