import { supabase } from '../../lib/supabase'
import { OrderRow, OrderStatus, QuoteRow, ApiResponse, OrderWithQuote } from '../types'

export async function fetchOrderStatuses(): Promise<ApiResponse<OrderStatus[]>> {
  try {
    const { data, error } = await supabase
      .from('order_status_ref')
      .select('*')
      .order('order_status_ref_id')

    if (error) {
      return { data: null, error: error.message }
    }

    const normalized = (data as Record<string, unknown>[])
      .map((status) => {
        const idSource = status.id ?? status.order_status_ref_id
        const id = typeof idSource === 'number' ? idSource : Number(idSource)

        const nameSource = status.name ?? status.status_name
        const name = typeof nameSource === 'string' && nameSource.trim().length > 0
          ? nameSource
          : 'Unknown'

        const description = typeof status.description === 'string' ? status.description : undefined

        return {
          id: Number.isFinite(id) ? id : 0,
          name,
          description,
        }
      })
      .filter((status) => status.id !== 0)

    return { data: normalized, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

type RawOrderRow = {
  id?: number
  order_id?: number
  quote_id: number
  status?: number | null
  order_status_id?: number | null
  created_on: string
  notes?: string | null
  is_paid?: boolean | string | number | null
  order_paid?: boolean | string | number | null
  paid?: boolean | string | number | null
  quote?: QuoteRow | null
}

export async function fetchOrders(): Promise<ApiResponse<OrderWithQuote[]>> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, quote:quotes(*)')
      .order('created_on', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    const rows = data as RawOrderRow[]

    const ordersWithQuotes = rows
      .map((order) => {
        const id = order.id ?? order.order_id ?? 0
        const statusId = order.status ?? order.order_status_id ?? 0
        const paidValue = typeof order.is_paid !== 'undefined'
          ? order.is_paid
          : typeof order.order_paid !== 'undefined'
            ? order.order_paid
            : order.paid
        const isPaid = typeof paidValue === 'boolean'
          ? paidValue
          : typeof paidValue === 'number'
            ? paidValue !== 0
            : typeof paidValue === 'string'
              ? ['true', '1', 't', 'yes'].includes(paidValue.toLowerCase())
              : false
=======
>>>>>>> refs/remotes/origin/development

        return {
          id,
          order_id: order.order_id ?? order.id ?? id,
          quote_id: order.quote_id,
          status: statusId,
          is_paid: isPaid,
          notes: typeof order.notes === 'string' ? order.notes : null,
          created_on: order.created_on,
          quote: order.quote ?? null,
        }
      })
      .filter((order) => order.id !== 0)

    return { data: ordersWithQuotes, error: null }
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
        quote_id: quote.id ?? quote.quote_id,
        status: initialOrderStatusId,
        created_on: new Date().toISOString()
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

export async function updateOrderStatus(
  orderId: number,
  orderStatusId: number,
  isPaid?: boolean,
  notes?: string,
): Promise<ApiResponse<OrderRow>> {
  try {
    const payload: Partial<OrderRow> = {
      status: orderStatusId,
    }

    if (typeof isPaid === 'boolean') {
      payload.is_paid = isPaid
    }

    if (typeof notes !== 'undefined') {
      const trimmed = notes.trim()
      payload.notes = trimmed.length > 0 ? trimmed : null
    }

    const { data, error } = await supabase
      .from('orders')
      .update(payload)
      .eq('order_id', orderId)
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
