import React, { useEffect, useState } from 'react'
import { OrderStatus, OrderWithQuote } from '../types'
import { updateOrderStatus } from '../data/orders'

interface OrderModalProps {
  isOpen: boolean
  order: OrderWithQuote | null
  statuses: OrderStatus[]
  onClose: () => void
  onOrderUpdated: (orderId: number, newStatusId: number) => void
}

export default function OrderModal({
  isOpen,
  order,
  statuses,
  onClose,
  onOrderUpdated,
}: OrderModalProps) {
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (order) {
      setSelectedStatusId(order.order_status_id)
    } else {
      setSelectedStatusId(null)
    }
    setError(null)
  }, [order, isOpen])

  if (!isOpen || !order) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (selectedStatusId == null) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await updateOrderStatus(order.id, selectedStatusId)
      if (response.error) {
        setError(response.error)
        return
      }

      onOrderUpdated(order.id, selectedStatusId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const quote = order.quote

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 ring-1 ring-stone-200 shadow-sm">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">Edit Order</h2>
              <p className="text-sm text-stone-500 mt-1">
                Order #{order.id}{quote?.quote_id ? ` • Quote #${quote.quote_id}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Order Status
              </label>
              <select
                value={selectedStatusId ?? ''}
                onChange={(event) => setSelectedStatusId(Number(event.target.value))}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition"
                required
              >
                <option value="" disabled>
                  Select status
                </option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2 text-sm text-stone-600">
              <p>
                <span className="font-semibold text-stone-700">Customer:</span>{' '}
                {quote?.customer_name ?? 'Unknown customer'}
              </p>
              <p>
                <span className="font-semibold text-stone-700">Summary:</span>{' '}
                {quote?.project_summary ?? 'Not provided'}
              </p>
              <p>
                <span className="font-semibold text-stone-700">Created:</span>{' '}
                {new Date(order.created_on).toLocaleString()}
              </p>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-stone-700 bg-stone-200 rounded-lg hover:bg-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-[var(--brand)] text-white rounded-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 disabled:opacity-60 transition"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
