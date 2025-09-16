import { supabase } from '../../lib/supabase'
import { OrderRow, OrderStatus, QuoteRow, ApiResponse } from '../types'

export async function fetchOrderStatuses(): Promise<ApiResponse<OrderStatus[]>> {
  try {
    const { data, error } = await supabase
      .from('order_status_ref')
      .select('*')
      .order('id')

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as OrderStatus[], error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function createOrderFromQuote(
  quote: QuoteRow, 
  initialOrderStatusId: number = 1 // Default to Queue status
): Promise<ApiResponse<OrderRow>> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        quote_id: quote.id,
        order_status_id: initialOrderStatusId,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as OrderRow, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function markQuoteConverted(quoteId: number, convertedStatusId: number = 2): Promise<ApiResponse<QuoteRow>> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .update({
        quote_status_id: convertedStatusId,
        updated_on: new Date().toISOString()
      })
      .eq('id', quoteId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as QuoteRow, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
