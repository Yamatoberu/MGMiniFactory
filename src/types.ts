// Database row types
export interface QuoteRow {
  id: number
  customer_name: string
  project_summary: string
  material_cost: number
  print_time: number
  labor_time: number
  quote_status_id: number
  created_on: string
  updated_on: string
}

export interface OrderRow {
  id: number
  quote_id: number
  order_status_id: number
  created_on: string
  updated_on: string
}

// Reference table types
export interface QuoteStatus {
  id: number
  status_name: string
  description?: string
}

export interface OrderStatus {
  id: number
  status_name: string
  description?: string
}

export interface PrintType {
  id: number
  type_name: string
  description?: string
}

// Form types
export interface QuoteFormData {
  customer_name: string
  project_summary: string
  material_cost: number
  print_time: number
  labor_time: number
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}
