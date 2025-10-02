import React, { useState, useEffect } from 'react'
import { QuoteRow, QuoteStatus } from '../types'
import { fetchQuotes, fetchQuoteStatuses } from '../data/quotes'
import { createOrderFromQuote, markQuoteConverted } from '../data/orders'
import QuoteModal from '../components/QuoteModal'

const statusColorMap: Record<number, string> = {
  1: 'bg-[var(--brand)]/10 text-[var(--brand)]', // New
  2: 'bg-blue-100 text-blue-800', // Submitted
  3: 'bg-green-100 text-green-800', // Converted
  4: 'bg-red-100 text-red-700', // Abandoned
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [quoteStatuses, setQuoteStatuses] = useState<QuoteStatus[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<QuoteRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadQuotes = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [quotesResult, statusesResult] = await Promise.all([
        fetchQuotes(),
        fetchQuoteStatuses()
      ])

      if (quotesResult.error) {
        setError(quotesResult.error)
      } else {
        setQuotes(quotesResult.data || [])
      }

      if (statusesResult.error) {
        console.error('Failed to load quote statuses:', statusesResult.error)
      } else {
        setQuoteStatuses(statusesResult.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  const handleCreateQuote = () => {
    setEditingQuote(null)
    setIsModalOpen(true)
  }

  const handleEditQuote = (quote: QuoteRow) => {
    setEditingQuote(quote)
    setIsModalOpen(true)
  }

  const handleConvertToOrder = async (quote: QuoteRow) => {
    if (!confirm(`Convert quote #${quote.id} to an order?`)) return

    try {
      const [orderResult, quoteResult] = await Promise.all([
        createOrderFromQuote(quote),
        markQuoteConverted(quote.id)
      ])

      if (orderResult.error) {
        alert(`Failed to create order: ${orderResult.error}`)
        return
      }

      if (quoteResult.error) {
        alert(`Failed to update quote status: ${quoteResult.error}`)
        return
      }

      // Refresh the quotes list
      await loadQuotes()
      alert('Quote successfully converted to order!')
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const getStatusName = (statusId: number) => {
    const status = quoteStatuses.find(s => s.quote_status_ref_id === statusId)
    return status?.name || 'Unknown'
  }

  const getStatusColor = (statusId: number) => {
    return statusColorMap[statusId] || 'bg-stone-100 text-stone-800'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading quotes...</div>
      </div>
    )
  }

  const activeQuotes = quotes.filter((quote) => quote.quote_status_id === 1)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-stone-900">Quotes</h1>
        <button
          onClick={handleCreateQuote}
          className="inline-flex items-center rounded-full bg-[var(--brand)] px-6 py-3 text-white font-semibold shadow-sm hover:brightness-110 transition"
        >
          Create Quote
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
                ID
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
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No active quotes found
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900">
                    {quote.quote_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    {quote.customer_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-900 max-w-xs truncate">
                    {quote.project_summary}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    ${quote.material_cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    {quote.print_time}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                    {quote.labor_time}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                      {getStatusName(quote.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleEditQuote(quote)}
                      className="text-[var(--brand)] hover:text-[var(--brand)]/80 font-medium"
                    >
                      Edit
                    </button>
                    {quote.quote_status_id === 1 && (
                      <button
                        onClick={() => handleConvertToOrder(quote)}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        Convert → Order
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <QuoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={loadQuotes}
        quote={editingQuote}
      />
    </div>
  )
}
