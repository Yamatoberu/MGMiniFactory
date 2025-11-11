import { useState, useEffect } from 'react'
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

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [quoteStatuses, setQuoteStatuses] = useState<QuoteStatus[]>([])
  const [printTypes, setPrintTypes] = useState<PrintType[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<QuoteRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        setQuotes(quotesResult.data || [])
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
          <table className="min-w-full w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th
                  className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap"
                >
                  ID
                </th>
                <th
                  className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap"
                >
                  Customer
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
                <th className="py-4 px-6 text-left text-sm font-semibold text-stone-700 whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 px-4 text-center text-gray-500">
                    No active quotes found
                  </td>
                </tr>
              ) : (
                quotes.map(quote => {
                  const printTypeName = getPrintTypeName(quote.print_type)

                  return (
                    <tr
                      key={quote.id}
                      onClick={() => handleRowClick(quote)}
                      className="hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <td
                        className="py-4 px-6 whitespace-nowrap text-sm font-medium text-stone-900"
                      >
                        {quote.quote_id}
                      </td>
                      <td
                        className="py-4 px-6 whitespace-nowrap text-sm text-stone-900"
                      >
                        {quote.customer_name}
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
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                          {getStatusName(quote.status)}
                        </span>
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
