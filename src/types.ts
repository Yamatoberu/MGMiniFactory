// Database row types
export interface QuoteRow {
  id: number
  quote_id?: number
  customer_name: string
  order_date?: string | null
  project_summary: string
  print_type: number
  material_cost: number
  print_time: number
  labor_time: number
  labor_cost?: number | null
  print_cost?: number | null
  total_cost?: number | null
  suggested_price?: number | null
  actual_price?: number | null
  status: number
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

export interface OrderWithQuote extends OrderRow {
  quote: QuoteRow | null
}

// Reference table types
export interface QuoteStatus {
  quote_status_ref_id: number
  name: string
}

export interface OrderStatus {
  id: number
  name: string
  description?: string
}

export interface PrintType {
  print_type_id: number
  name: string
  power_cost: number
  maintenance_cost: number
}

// Form types
export interface QuoteFormData {
  customer_name: string
  order_date: string
  project_summary: string
  print_type: number
  status: number
  material_cost: number
  print_time: number
  labor_time: number
  actual_price: number
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface UserRecord {
  id: number
  created_at?: string
  name?: string | null
  username?: string | null
  email: string
  admin: boolean
}
