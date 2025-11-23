import { useEffect, useMemo, useState } from 'react'
import { fetchOrders, fetchOrderStatuses } from '../data/orders'
import { OrderStatus, OrderWithQuote } from '../types'
import OrderModal from '../components/OrderModal'

const statusColorMap: Record<number, string> = {
  1: 'bg-amber-100 text-amber-800', // Queue
  2: 'bg-blue-100 text-blue-800', // Printing
  3: 'bg-emerald-100 text-emerald-800', // Ready for Pickup
  4: 'bg-stone-300 text-stone-900', // Complete
  5: 'bg-red-100 text-red-700', // Cancelled
}
const paidColorMap = {
  true: 'bg-emerald-100 text-emerald-800',
  false: 'bg-rose-100 text-rose-700',
}

type DateRangeKey = 'all' | 'mtd' | 'last-month' | 'ytd' | 'last-year'

const DATE_RANGE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mtd', label: 'This Month to Date' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'last-year', label: 'Last Calendar Year' },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithQuote[]>([])
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithQuote | null>(null)
  const [selectedRange, setSelectedRange] = useState<DateRangeKey>('all')

  const loadOrders = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [ordersResult, statusesResult] = await Promise.all([
        fetchOrders(),
        fetchOrderStatuses(),
      ])

      if (ordersResult.error) {
        setError(ordersResult.error)
      } else {
        const sortedOrders = (ordersResult.data || []).slice().sort((a, b) => {
          const getTimestamp = (order: OrderWithQuote) => {
            const source = order.quote?.order_date || order.created_on
            const time = source ? Date.parse(source) : Number.NaN
            return Number.isNaN(time) ? 0 : time
          }
          return getTimestamp(b) - getTimestamp(a)
        })
        setOrders(sortedOrders)
      }

      if (statusesResult.error) {
        console.error('Failed to load order statuses:', statusesResult.error)
      } else {
        setOrderStatuses(statusesResult.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const startOfDay = (date: Date) => {
    const copy = new Date(date)
    copy.setHours(0, 0, 0, 0)
    return copy
  }

  const endOfDay = (date: Date) => {
    const copy = new Date(date)
    copy.setHours(23, 59, 59, 999)
    return copy
  }

  const { start: rangeStart, end: rangeEnd, isAllRange } = useMemo(() => {
    const now = new Date()

    if (selectedRange === 'all') {
      return { start: null, end: null, isAllRange: true }
    }

    if (selectedRange === 'mtd') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: startOfDay(start), end: endOfDay(now), isAllRange: false }
    }

    if (selectedRange === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: startOfDay(start), end: endOfDay(end), isAllRange: false }
    }

    if (selectedRange === 'ytd') {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start: startOfDay(start), end: endOfDay(now), isAllRange: false }
    }

    const start = new Date(now.getFullYear() - 1, 0, 1)
    const end = new Date(now.getFullYear() - 1, 11, 31)
    return { start: startOfDay(start), end: endOfDay(end), isAllRange: false }
  }, [selectedRange])

  const filteredOrders = useMemo(() => {
    if (isAllRange || !rangeStart || !rangeEnd) {
      return orders
    }

    return orders.filter((order) => {
      const sourceDate = order.quote?.order_date ?? order.created_on
      if (!sourceDate) return false
      const timestamp = Date.parse(sourceDate)
      if (Number.isNaN(timestamp)) return false
      const orderDate = new Date(timestamp)
      return orderDate >= rangeStart && orderDate <= rangeEnd
    })
  }, [orders, rangeStart, rangeEnd, isAllRange])

  const { displayStart, displayEnd } = useMemo(() => {
    if (!isAllRange || !orders.length) {
      return { displayStart: rangeStart, displayEnd: rangeEnd }
    }

    const timestamps = orders
      .map((order) => {
        const sourceDate = order.quote?.order_date ?? order.created_on
        if (!sourceDate) return null
        const timestamp = Date.parse(sourceDate)
        return Number.isNaN(timestamp) ? null : timestamp
      })
      .filter((value): value is number => value !== null)

    if (timestamps.length === 0) {
      return { displayStart: null, displayEnd: null }
    }

    return {
      displayStart: new Date(Math.min(...timestamps)),
      displayEnd: new Date(Math.max(...timestamps)),
    }
  }, [isAllRange, orders, rangeStart, rangeEnd])

  const getStatusName = (statusId: number) => {
    const status = orderStatuses.find((s) => s.id === statusId)
    return status?.name || 'Unknown'
  }

  const getStatusColor = (statusId: number) => {
    return statusColorMap[statusId] || 'bg-stone-100 text-stone-800'
  }

const getPaidColor = (paid?: boolean) => {
  return paid ? paidColorMap.true : paidColorMap.false
}

const parseCurrencyValue = (value?: number | string | null) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

const calculateMarginPercentage = (quote: OrderWithQuote['quote']) => {
  if (!quote) return null
  const actual = parseCurrencyValue(quote.actual_price)
  const total = parseCurrencyValue(quote.total_cost)
  if (actual === null || total === null || actual === 0) {
    return null
  }
  return ((actual - total) / actual) * 100
}

const getMarginColor = (margin: number) => {
  if (margin >= 30) return 'bg-emerald-100 text-emerald-800'
  if (margin >= 25) return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-700'
}

const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return '—'
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value
  if (Number.isNaN(numericValue)) return '—'
  return `$${numericValue.toFixed(2)}`
}

const formatOrderDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

  const handleEditOrder = (order: OrderWithQuote) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleOrderUpdated = (
    orderId: number,
    newStatusId: number,
    isPaid: boolean,
    notes: string,
  ) => {
    setOrders((prev) =>
      prev.map((existing) =>
        existing.id === orderId
          ? { ...existing, status: newStatusId, is_paid: isPaid, notes }
          : existing,
      ),
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-stone-900">Orders</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-stone-200 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500 font-semibold">Date Range</p>
          <p className="text-stone-900 font-semibold">
            {DATE_RANGE_OPTIONS.find((option) => option.value === selectedRange)?.label}
          </p>
          <p className="text-sm text-stone-500">
            {displayStart ? displayStart.toLocaleDateString() : '—'} –{' '}
            {displayEnd ? displayEnd.toLocaleDateString() : '—'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="orders-range-filter" className="text-sm font-medium text-stone-600">
            Filter
          </label>
          <select
            id="orders-range-filter"
            value={selectedRange}
            onChange={(event) => setSelectedRange(event.target.value as DateRangeKey)}
            className="rounded-2xl border border-stone-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm sm:rounded-2xl ring-1 ring-stone-200">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                  Paid
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                  Summary
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                  Order Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                  Cost
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No orders found for this range
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const quote = order.quote
                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleEditOrder(order)}
                      className="hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusName(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaidColor(order.is_paid)}`}>
                          {order.is_paid ? 'True' : 'False'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {quote?.customer_name ?? 'Unknown customer'}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-900 max-w-xs truncate">
                        {quote?.project_summary ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {formatOrderDate(quote?.order_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {formatCurrency(quote?.actual_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {formatCurrency(quote?.total_cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                        {(() => {
                          const margin = calculateMarginPercentage(quote)
                          if (margin === null) return '—'
                          return (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMarginColor(margin)}`}>
                              {`${Math.round(margin)}%`}
                            </span>
                          )
                        })()}
                      </td>
                  </tr>
                )
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      <OrderModal
        isOpen={isModalOpen}
        order={selectedOrder}
        statuses={orderStatuses}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedOrder(null)
        }}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  )
}
