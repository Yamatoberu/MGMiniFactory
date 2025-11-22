import React, { useEffect, useState } from 'react'
import { OrderStatus, OrderWithQuote } from '../types'
import { updateOrderStatus } from '../data/orders'

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

interface OrderModalProps {
  isOpen: boolean
  order: OrderWithQuote | null
  statuses: OrderStatus[]
  onClose: () => void
  onOrderUpdated: (orderId: number, newStatusId: number, isPaid: boolean, notes: string) => void
}

export default function OrderModal({
  isOpen,
  order,
  statuses,
  onClose,
  onOrderUpdated,
}: OrderModalProps) {
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (order) {
      setSelectedStatusId(order.status)
      setIsPaid(Boolean(order.is_paid))
      setNotes(order.notes ?? '')
    } else {
      setSelectedStatusId(null)
      setIsPaid(false)
      setNotes('')
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
      const response = await updateOrderStatus(order.id, selectedStatusId, isPaid, notes)
      if (response.error) {
        setError(response.error)
        return
      }

      const normalizedNotes =
        response.data?.notes ?? (notes.trim().length > 0 ? notes.trim() : '')
      setNotes(normalizedNotes)
      onOrderUpdated(order.id, selectedStatusId, isPaid, normalizedNotes)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const quote = order.quote
  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '—'
    const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value
    if (Number.isNaN(numericValue)) return '—'
    return `$${numericValue.toFixed(2)}`
  }

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
                <span className="font-semibold text-stone-700">Actual Price:</span>{' '}
                {formatCurrency(quote?.actual_price)}
              </p>
              <p>
                <span className="font-semibold text-stone-700">Total Cost:</span>{' '}
                {formatCurrency(quote?.total_cost)}
              </p>
              <p>
                <span className="font-semibold text-stone-700">Profit Margin:</span>{' '}
                {(() => {
                  const margin = calculateMarginPercentage(quote)
                  if (margin === null) return '—'
                  return (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMarginColor(margin)}`}>
                      {`${Math.round(margin)}%`}
                    </span>
                  )
                })()}
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-stone-700">
                    Paid
                  </label>
                  <p className="text-xs text-stone-500">Mark once payment is collected.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(event) => setIsPaid(event.target.checked)}
                  className="h-5 w-5 rounded border-stone-300 text-[var(--brand)] focus:ring-[var(--brand)]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Status
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

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value.slice(0, 500))}
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition resize-none"
                  placeholder="Add any extra context for this order..."
                />
                <p className="text-xs text-stone-500 text-right mt-1">
                  {notes.length}/500
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-center space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-[var(--brand)] text-white rounded-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 disabled:opacity-60 transition"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-stone-700 bg-stone-200 rounded-lg hover:bg-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
