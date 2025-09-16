import { supabase } from '../../lib/supabase'
import { QuoteRow, QuoteStatus, QuoteFormData, ApiResponse } from '../types'

export async function fetchQuotes(): Promise<ApiResponse<QuoteRow[]>> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        quote_status_ref!inner(status_name)
      `)
      .order('created_on', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as QuoteRow[], error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function fetchQuoteStatuses(): Promise<ApiResponse<QuoteStatus[]>> {
  try {
    const { data, error } = await supabase
      .from('quote_status_ref')
      .select('*')
      .order('id')

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as QuoteStatus[], error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function upsertQuote(payload: QuoteFormData & { id?: number }): Promise<ApiResponse<QuoteRow>> {
  try {
    const quoteData = {
      customer_name: payload.customer_name,
      project_summary: payload.project_summary,
      material_cost: payload.material_cost,
      print_time: payload.print_time,
      labor_time: payload.labor_time,
      quote_status_id: 1, // Default to Draft status
      updated_on: new Date().toISOString()
    }

    let data, error

    if (payload.id) {
      // Update existing quote
      const result = await supabase
        .from('quotes')
        .update(quoteData)
        .eq('id', payload.id)
        .select()
        .single()
      
      data = result.data
      error = result.error
    } else {
      // Insert new quote
      const result = await supabase
        .from('quotes')
        .insert({
          ...quoteData,
          created_on: new Date().toISOString()
        })
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as QuoteRow, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
