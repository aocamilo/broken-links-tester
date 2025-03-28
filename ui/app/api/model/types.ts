// API Request types
export interface CheckRequest {
  url: string;
  depth?: number;
}

// API Response types
export interface LinkStatus {
  url?: string;
  parent_url?: string;
  status_code?: number;
  is_working?: boolean;
  error?: string;
  depth?: number;
  response_time?: string;
  last_checked?: string;
}
