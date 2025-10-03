import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react'
import { QuoteRow, QuoteStatus } from '../types'
import { fetchQuotes, fetchQuoteStatuses } from '../data/quotes'
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
  const [stickyOffsets, setStickyOffsets] = useState({ customer: 0, summary: 0 })

  const idHeaderRef = useRef<HTMLTableCellElement | null>(null)
  const customerHeaderRef = useRef<HTMLTableCellElement | null>(null)
  const summaryHeaderRef = useRef<HTMLTableCellElement | null>(null)

  const idCellRef = useRef<HTMLTableCellElement | null>(null)
  const customerCellRef = useRef<HTMLTableCellElement | null>(null)
  const summaryCellRef = useRef<HTMLTableCellElement | null>(null)

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

  const setIdCellRef = useCallback((el: HTMLTableCellElement | null) => {
    idCellRef.current = el
  }, [])

  const setCustomerCellRef = useCallback((el: HTMLTableCellElement | null) => {
    customerCellRef.current = el
  }, [])

  const setSummaryCellRef = useCallback((el: HTMLTableCellElement | null) => {
    summaryCellRef.current = el
  }, [])

  const handleRowClick = (quote: QuoteRow) => {
    setEditingQuote(quote)
    setIsModalOpen(true)
  }

  const getStatusName = (statusId: number) => {
    const status = quoteStatuses.find(s => s.quote_status_ref_id === statusId)
    return status?.name || 'Unknown'
  }

  const getStatusColor = (statusId: number) => {
    return statusColorMap[statusId] || 'bg-stone-100 text-stone-800'
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—'
    if (typeof value !== 'number' || Number.isNaN(value)) return '—'
    return `$${value.toFixed(2)}`
  }

  const measureWidth = (header?: HTMLTableCellElement | null, cell?: HTMLTableCellElement | null) => {
    const headerWidth = header?.getBoundingClientRect().width ?? 0
    const cellWidth = cell?.getBoundingClientRect().width ?? 0
    return Math.max(headerWidth, cellWidth)
  }

  const updateStickyOffsets = useCallback(() => {
    const idWidth = measureWidth(idHeaderRef.current, idCellRef.current)
    const customerWidth = measureWidth(customerHeaderRef.current, customerCellRef.current)
    const borderBuffer = 1 // overlap borders to avoid translucent seams

    const customerOffset = idWidth
    const summaryOffset = idWidth + customerWidth - borderBuffer

    setStickyOffsets(prev => {
      if (prev.customer === customerOffset && prev.summary === summaryOffset) {
        return prev
      }
      return { customer: customerOffset, summary: summaryOffset }
    })
  }, [])

  useLayoutEffect(() => {
    updateStickyOffsets()
  }, [quotes, updateStickyOffsets])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('resize', updateStickyOffsets)
    return () => {
      window.removeEventListener('resize', updateStickyOffsets)
    }
  }, [updateStickyOffsets])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading quotes...</div>
      </div>
    )
  }

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

      <div className="bg-white shadow-sm sm:rounded-2xl ring-1 ring-stone-200">
        <div className="overflow-x-auto">
          <table className="table-auto divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th
                  ref={idHeaderRef}
                  className="py-4 px-8 text-left text-sm font-semibold text-stone-700 sticky left-0 z-30 bg-stone-50 border-r border-stone-200 whitespace-nowrap"
                >
                  ID
                </th>
                {/* Stick the customer column immediately after the ID column using the measured offset so no gap peeks through while scrolling. */}
                <th
                  ref={customerHeaderRef}
                  className="py-4 px-8 text-left text-sm font-semibold text-stone-700 sticky left-0 z-30 bg-stone-50 border-r border-stone-200 whitespace-nowrap"
                  style={{ left: stickyOffsets.customer }}
                >
                  Customer
                </th>
                <th
                  ref={summaryHeaderRef}
                  className="py-4 px-8 text-left text-sm font-semibold text-stone-700 sticky left-0 z-30 bg-stone-50 border-r border-stone-200 whitespace-nowrap"
                  style={{ left: stickyOffsets.summary }}
                >
                  Summary
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Material Cost
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Print Time
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Print Cost
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Labor Time
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Labor Cost
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Total Cost
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Suggested Price
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Quoted Price
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-4 px-4 text-center text-gray-500">
                    No active quotes found
                  </td>
                </tr>
              ) : (
                quotes.map((quote, index) => (
                  <tr
                    key={quote.id}
                    onClick={() => handleRowClick(quote)}
                    className="hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <td
                      ref={index === 0 ? setIdCellRef : undefined}
                      className="py-4 px-8 whitespace-nowrap text-sm font-medium text-stone-900 sticky left-0 z-20 bg-white border-r border-stone-200"
                    >
                      {quote.quote_id}
                    </td>
                    <td
                      ref={index === 0 ? setCustomerCellRef : undefined}
                      className="py-4 px-8 whitespace-nowrap text-sm text-stone-900 sticky left-0 z-20 bg-white border-r border-stone-200"
                      style={{ left: stickyOffsets.customer }}
                    >
                      {quote.customer_name}
                    </td>
                    <td
                      ref={index === 0 ? setSummaryCellRef : undefined}
                      className="py-4 px-8 text-sm text-stone-900 sticky left-0 z-20 bg-white border-r border-stone-200 truncate max-w-[220px]"
                      style={{ left: stickyOffsets.summary }}
                    >
                      {quote.project_summary}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-stone-900">
                      ${quote.material_cost.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-stone-900">
                      {quote.print_time}h
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-stone-900">
                      {formatCurrency(quote.print_cost)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-stone-900">
                      {quote.labor_time}h
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-stone-900">
                      {formatCurrency(quote.labor_cost)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-stone-900">
                      {formatCurrency(quote.total_cost)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-stone-900">
                      {formatCurrency(quote.suggested_price)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-stone-900">
                      {formatCurrency(quote.actual_price)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                        {getStatusName(quote.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
