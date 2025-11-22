import { supabase } from '../../lib/supabase'
import { QuoteRow, QuoteStatus, QuoteFormData, ApiResponse, PrintType } from '../types'

export async function fetchQuotes(): Promise<ApiResponse<QuoteRow[]>> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
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
      .order('quote_status_ref_id')

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as QuoteStatus[], error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function fetchPrintTypes(): Promise<ApiResponse<PrintType[]>> {
  try {
    const { data, error } = await supabase
      .from('print_type_ref')
      .select('*')
      .order('print_type_id')

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data as PrintType[], error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function upsertQuote(payload: QuoteFormData & { id?: number }): Promise<ApiResponse<QuoteRow>> {
  try {
    var calc_print_cost = payload.print_time * .14
    var calc_labor_cost = payload.labor_time * 15
    var calc_total_cost = payload.material_cost + calc_print_cost + calc_labor_cost
    var calc_suggested_price = calc_total_cost / .7

    const quoteData = {
      customer_name: payload.customer_name,
      order_date: payload.order_date,
      project_summary: payload.project_summary,
      print_type: payload.print_type,
      status: payload.status,
      material_cost: payload.material_cost,
      print_time: payload.print_time,
      print_cost: calc_print_cost,
      labor_time: payload.labor_time,
      labor_cost: calc_labor_cost,
      total_cost: calc_total_cost,
      suggested_price: calc_suggested_price,
      actual_price: payload.actual_price
    }

    let data, error

    if (payload.id) {
      // Update existing quote
      const result = await supabase
        .from('quotes')
        .update(quoteData)
        .eq('quote_id', payload.id)
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
