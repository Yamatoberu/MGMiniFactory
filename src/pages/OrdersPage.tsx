import React, { useEffect, useState } from 'react'
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithQuote[]>([])
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithQuote | null>(null)

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
        setOrders(ordersResult.data || [])
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

  const getStatusName = (statusId: number) => {
    const status = orderStatuses.find((s) => s.id === statusId)
    return status?.name || 'Unknown'
  }

  const getStatusColor = (statusId: number) => {
    return statusColorMap[statusId] || 'bg-stone-100 text-stone-800'
  }

  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '—'
    const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value
    if (Number.isNaN(numericValue)) return '—'
    return `$${numericValue.toFixed(2)}`
  }

  const handleEditOrder = (order: OrderWithQuote) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const handleOrderUpdated = (orderId: number, newStatusId: number) => {
    setOrders((prev) =>
      prev.map((existing) =>
        existing.id === orderId
          ? { ...existing, order_status_id: newStatusId }
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
        <button
          onClick={loadOrders}
          className="inline-flex items-center rounded-full bg-stone-900 px-6 py-3 text-white font-semibold shadow-sm hover:brightness-110 transition"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm overflow-hidden sm:rounded-2xl ring-1 ring-stone-200">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                Order #
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                Summary
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                Material Cost
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                Print Time
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                Labor Time
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  No orders have been created yet
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const quote = order.quote
                return (
                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      {quote?.customer_name ?? 'Unknown customer'}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-900 max-w-xs truncate">
                      {quote?.project_summary ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      {formatCurrency(quote?.material_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      {quote?.print_time != null ? `${quote.print_time}h` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                      {quote?.labor_time != null ? `${quote.labor_time}h` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status_id)}`}>
                        {getStatusName(order.order_status_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="text-[var(--brand)] hover:text-[var(--brand)]/80 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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
