import { useState, useEffect, useMemo } from 'react'
import { QuoteRow, QuoteStatus, PrintType } from '../types'
import { fetchQuotes, fetchQuoteStatuses, fetchPrintTypes } from '../data/quotes'
import QuoteModal from '../components/QuoteModal'

const statusColorMap: Record<number, string> = {
  1: 'bg-[var(--brand)]/10 text-[var(--brand)]', // New
  2: 'bg-blue-100 text-blue-800', // Submitted
  3: 'bg-green-100 text-green-800', // Converted
  4: 'bg-red-100 text-red-700', // Abandoned
}

const printTypeColorMap: Record<string, string> = {
  resin: 'bg-purple-100 text-purple-800',
  fdm: 'bg-amber-100 text-amber-800',
}

type DateRangeKey = 'all' | 'mtd' | 'last-month' | 'ytd' | 'last-year'

const DATE_RANGE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mtd', label: 'This Month to Date' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'last-year', label: 'Last Calendar Year' },
]

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [quoteStatuses, setQuoteStatuses] = useState<QuoteStatus[]>([])
  const [printTypes, setPrintTypes] = useState<PrintType[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<QuoteRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState<DateRangeKey>('all')
  const loadQuotes = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [quotesResult, statusesResult, printTypesResult] = await Promise.all([
        fetchQuotes(),
        fetchQuoteStatuses(),
        fetchPrintTypes()
      ])

      if (quotesResult.error) {
        setError(quotesResult.error)
      } else {
        const sortedQuotes = (quotesResult.data || []).slice().sort((a, b) => {
          const getTimestamp = (quote: QuoteRow) => {
            const source = quote.order_date || quote.created_on
            const time = Date.parse(source || '')
            return Number.isNaN(time) ? 0 : time
          }

          return getTimestamp(b) - getTimestamp(a)
        })
        setQuotes(sortedQuotes)
      }

      if (statusesResult.error) {
        console.error('Failed to load quote statuses:', statusesResult.error)
      } else {
        setQuoteStatuses(statusesResult.data || [])
      }

      if (printTypesResult.error) {
        console.error('Failed to load print types:', printTypesResult.error)
      } else {
        setPrintTypes(printTypesResult.data || [])
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

  const { rangeStart, rangeEnd, isAllRange } = useMemo(() => {
    const now = new Date()

    if (selectedRange === 'all') {
      return { rangeStart: null, rangeEnd: null, isAllRange: true }
    }

    if (selectedRange === 'mtd') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { rangeStart: startOfDay(start), rangeEnd: endOfDay(now), isAllRange: false }
    }

    if (selectedRange === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { rangeStart: startOfDay(start), rangeEnd: endOfDay(end), isAllRange: false }
    }

    if (selectedRange === 'ytd') {
      const start = new Date(now.getFullYear(), 0, 1)
      return { rangeStart: startOfDay(start), rangeEnd: endOfDay(now), isAllRange: false }
    }

    const start = new Date(now.getFullYear() - 1, 0, 1)
    const end = new Date(now.getFullYear() - 1, 11, 31)
    return { rangeStart: startOfDay(start), rangeEnd: endOfDay(end), isAllRange: false }
  }, [selectedRange])

  const filteredQuotes = useMemo(() => {
    if (isAllRange || !rangeStart || !rangeEnd) {
      return quotes
    }

    return quotes.filter((quote) => {
      const source = quote.order_date || quote.created_on
      if (!source) return false
      const timestamp = Date.parse(source)
      if (Number.isNaN(timestamp)) return false
      const date = new Date(timestamp)
      return date >= rangeStart && date <= rangeEnd
    })
  }, [quotes, rangeStart, rangeEnd, isAllRange])

  const { displayStart, displayEnd } = useMemo(() => {
    if (!isAllRange || !quotes.length) {
      return { displayStart: rangeStart, displayEnd: rangeEnd }
    }

    const timestamps = quotes
      .map((quote) => {
        const source = quote.order_date || quote.created_on
        if (!source) return null
        const timestamp = Date.parse(source)
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
  }, [isAllRange, quotes, rangeStart, rangeEnd])

  const handleCreateQuote = () => {
    setEditingQuote(null)
    setIsModalOpen(true)
  }

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

  const getPrintTypeName = (quoteType: number) => {
    const printType = printTypes.find(s => s.print_type_id === quoteType)
    return printType?.name || 'Unknown'
  }

  const getPrintTypeColor = (printTypeName: string) => {
    const normalized = printTypeName.toLowerCase()
    return printTypeColorMap[normalized] || 'bg-stone-100 text-stone-700'
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '—'
    if (typeof value !== 'number' || Number.isNaN(value)) return '—'
    return `$${value.toFixed(2)}`
  }

  const formatOrderDate = (value?: string | null) => {
    if (!value) return '—'
    const datePart = value.split('T')[0]
    const [yearStr, monthStr, dayStr] = datePart.split('-')
    const year = Number(yearStr)
    const month = Number(monthStr)
    const day = Number(dayStr)
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return '—'
    }
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

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
          <label htmlFor="quotes-range-filter" className="text-sm font-medium text-stone-600">
            Filter
          </label>
          <select
            id="quotes-range-filter"
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
                <th className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Status
                </th>
                <th
                  className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap"
                >
                  Customer
                </th>
                <th
                  className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap"
                >
                  Order Date
                </th>
                <th
                  className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap"
                >
                  Summary
                </th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Print Type
                </th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Total Cost
                </th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Suggested Price
                </th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Quoted Price
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 px-4 text-center text-gray-500">
                    No quotes found for this range
                  </td>
                </tr>
              ) : (
                filteredQuotes.map(quote => {
                  const printTypeName = getPrintTypeName(quote.print_type)

                  return (
                    <tr
                      key={quote.id}
                      onClick={() => handleRowClick(quote)}
                      className="hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                          {getStatusName(quote.status)}
                        </span>
                      </td>
                      <td
                        className="py-4 px-6 whitespace-nowrap text-sm text-stone-900"
                      >
                        {quote.customer_name}
                      </td>
                      <td
                        className="py-4 px-6 whitespace-nowrap text-sm text-stone-900"
                      >
                        {formatOrderDate(quote.order_date)}
                      </td>
                      <td
                        className="py-4 px-6 text-sm text-stone-900 truncate"
                      >
                        {quote.project_summary}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrintTypeColor(printTypeName)}`}>
                          {printTypeName}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-stone-900">
                        {formatCurrency(quote.total_cost)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-stone-900">
                        {formatCurrency(quote.suggested_price)}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-stone-900">
                        {formatCurrency(quote.actual_price)}
                      </td>
                    </tr>
                  )
                })
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
        printTypes={printTypes}
        quoteStatuses={quoteStatuses}
      />
    </div>
  )
}
