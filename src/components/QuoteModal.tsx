import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { QuoteFormData, QuoteRow, PrintType, QuoteStatus } from '../types'
import { upsertQuote } from '../data/quotes'

const getTodayDateString = () => new Date().toISOString().split('T')[0]
const normalizeDateForInput = (value?: string | null) => {
  if (!value) return ''
  return value.split('T')[0]
}

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  quote?: QuoteRow | null
  printTypes: PrintType[]
  quoteStatuses: QuoteStatus[]
}

export default function QuoteModal({ isOpen, onClose, onSave, quote, printTypes, quoteStatuses }: QuoteModalProps) {
  const [formData, setFormData] = useState<QuoteFormData>({
    customer_name: '',
    order_date: getTodayDateString(),
    project_summary: '',
    print_type: 0,
    status: 0,
    material_cost: 0,
    print_time: 0,
    labor_time: 0,
    actual_price: 0
  })
  const [actualPriceInput, setActualPriceInput] = useState('0.00')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizeActualPrice = useCallback((rawValue: string) => {
    const parsed = parseFloat(rawValue)

    if (!Number.isFinite(parsed)) {
      return { formatted: '0.00', numeric: 0 }
    }

    const normalized = Math.round(parsed * 100) / 100
    const formatted = normalized.toFixed(2)

    return { formatted, numeric: normalized }
  }, [])

  const selectedPrintType = printTypes.find(type => type.print_type_id === formData.print_type) || null
  const printRate = selectedPrintType ? selectedPrintType.power_cost + selectedPrintType.maintenance_cost : 0
  const calculatedPrintCost = Number.isFinite(formData.print_time) ? formData.print_time * printRate : 0
  const calculatedLaborCost = Number.isFinite(formData.labor_time) ? formData.labor_time * 15 : 0
  const calculatedTotalCost = formData.material_cost + calculatedPrintCost + calculatedLaborCost
  const calculatedSuggestedPrice = calculatedTotalCost / 0.7

const convertedStatus = quoteStatuses.find(status => status.name?.toLowerCase() === 'converted') || null
const convertedStatusId = convertedStatus?.quote_status_ref_id

const selectableQuoteStatuses = useMemo(
  () => quoteStatuses.filter(status => status.quote_status_ref_id !== convertedStatusId),
  [quoteStatuses, convertedStatusId]
)

const defaultStatusId = useMemo(() => {
  const preferred = selectableQuoteStatuses.find(status => status.name?.toLowerCase() === 'new')
  if (preferred) return preferred.quote_status_ref_id
  if (selectableQuoteStatuses.length > 0) {
    return selectableQuoteStatuses[0].quote_status_ref_id
  }
  return convertedStatusId ?? 0
}, [selectableQuoteStatuses, convertedStatusId])

  const isConverted = Boolean(convertedStatusId && quote?.status === convertedStatusId)
  const isReadOnly = isConverted

const hasMatchingStatus = selectableQuoteStatuses.some(status => status.quote_status_ref_id === formData.status)
const rawStatusValue = isConverted && convertedStatusId !== undefined
  ? convertedStatusId
  : hasMatchingStatus
    ? formData.status
    : ''
const statusSelectValue = rawStatusValue === '' ? '' : String(rawStatusValue)

const statusColorMap: Record<number, string> = {
  1: 'bg-amber-100 text-amber-800', // New
  2: 'bg-blue-100 text-blue-800', // Submitted
  3: 'bg-green-100 text-green-800', // Converted
  4: 'bg-red-100 text-red-700', // Abandoned
}

const getStatusColor = (statusId: number | string) => {
  const numericId = typeof statusId === 'string' ? parseInt(statusId, 10) : statusId
  if (!Number.isFinite(numericId)) {
    return 'bg-stone-100 text-stone-700'
  }
  return statusColorMap[numericId] || 'bg-stone-100 text-stone-700'
}

const printTypeColorMap: Record<string, string> = {
  resin: 'bg-purple-100 text-purple-800',
  fdm: 'bg-amber-100 text-amber-800',
}

const selectedPrintTypeName = printTypes.find(type => type.print_type_id === formData.print_type)?.name || ''
const normalizedPrintTypeName = selectedPrintTypeName.toLowerCase()
const printTypeColorClass = printTypeColorMap[normalizedPrintTypeName] || 'bg-stone-100 text-stone-700'

const statusColorClass = isConverted && convertedStatus
  ? getStatusColor(convertedStatus.quote_status_ref_id)
  : getStatusColor(statusSelectValue)

  const handleActualPriceBlur = () => {
    const { formatted, numeric } = normalizeActualPrice(actualPriceInput)

    setActualPriceInput(formatted)
    setFormData(prev => ({
      ...prev,
      actual_price: numeric
    }))
  }

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) return '—'
    return `$${value.toFixed(2)}`
  }

  useEffect(() => {
    const defaultPrintType = quote?.print_type ?? (printTypes[0]?.print_type_id ?? 0)
    const defaultStatus = quote?.status ?? defaultStatusId

    if (quote) {
      const initialActualPrice = typeof quote.actual_price === 'number' ? quote.actual_price : 0
      const { formatted, numeric } = normalizeActualPrice(initialActualPrice.toString())
      const normalizedOrderDate = normalizeDateForInput(quote.order_date) || getTodayDateString()

      setFormData({
        customer_name: quote.customer_name,
        order_date: normalizedOrderDate,
        project_summary: quote.project_summary,
        print_type: defaultPrintType,
        status: defaultStatus,
        material_cost: quote.material_cost,
        print_time: quote.print_time,
        labor_time: quote.labor_time,
        actual_price: numeric
      })
      setActualPriceInput(formatted)
    } else {
      const { formatted, numeric } = normalizeActualPrice('0')
      const today = getTodayDateString()

      setFormData({
        customer_name: '',
        order_date: today,
        project_summary: '',
        print_type: defaultPrintType,
        status: defaultStatus,
        material_cost: 0,
        print_time: 0,
        labor_time: 0,
        actual_price: numeric
      })
      setActualPriceInput(formatted)
    }
    setError(null)
  }, [quote, isOpen, printTypes, selectableQuoteStatuses, convertedStatusId, defaultStatusId, normalizeActualPrice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly) {
      return
    }

    if (formData.status === 0 && defaultStatusId) {
      setFormData(prev => ({ ...prev, status: defaultStatusId }))
      setError('Quote status is still loading. Please try again.')
      return
    }

    const { formatted, numeric } = normalizeActualPrice(actualPriceInput)

    if (formatted !== actualPriceInput) {
      setActualPriceInput(formatted)
    }

    if (numeric !== formData.actual_price) {
      setFormData(prev => ({
        ...prev,
        actual_price: numeric
      }))
    }

    setIsLoading(true)
    setError(null)

    try {
      const basePayload = quote ? { ...formData, id: quote.quote_id } : formData
      const payload = { ...basePayload, actual_price: numeric }
      const result = await upsertQuote(payload)

      if (result.error) {
        setError(result.error)
      } else {
        onSave()
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'actual_price') {
      setActualPriceInput(value)
      setFormData(prev => ({
        ...prev,
        actual_price: value === '' ? 0 : parseFloat(value) || 0
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'print_type' || name === 'status'
        ? parseInt(value, 10) || 0
        : (name.includes('cost') || name.includes('time') || name.includes('price'))
          ? parseFloat(value) || 0
          : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-md mx-4 ring-1 ring-stone-200 shadow-sm max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-stone-900">
            {quote ? 'Edit Quote' : 'Create New Quote'}
          </h2>
          <div
            className={`inline-flex items-center rounded-full px-4 py-1 text-2xl font-semibold capitalize ${statusColorClass}`.trim()}
          >
            {isConverted && convertedStatus
              ? convertedStatus.name
              : selectableQuoteStatuses.find(status => status.quote_status_ref_id === formData.status)?.name || 'Unknown'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1 min-h-0">
          <div className="flex-1 space-y-6 overflow-y-auto pr-1 min-h-0">
            {isReadOnly && (
              <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                Converted quotes are read-only.
              </div>
            )}

            <div className="sm:flex sm:space-x-4">
              <div className="sm:w-1/2">
                <label htmlFor="customer_name" className="block text-sm font-semibold text-stone-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
                />
              </div>

              <div className="mt-6 sm:mt-0 sm:w-1/2">
                <label htmlFor="order_date" className="block text-sm font-semibold text-stone-700 mb-2">
                  Order Date
                </label>
                <input
                  type="date"
                  id="order_date"
                  name="order_date"
                  value={formData.order_date}
                  onChange={handleChange}
                  required
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="project_summary" className="block text-sm font-semibold text-stone-700 mb-2">
                Project Summary
              </label>
              <textarea
                id="project_summary"
                name="project_summary"
                value={formData.project_summary}
                onChange={handleChange}
                required
                rows={3}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
              />
            </div>


            <div className="sm:flex sm:items-center sm:space-x-4">
              <div className="mt-6 sm:mt-0 sm:w-1/2">
                <label htmlFor="print_type" className="block text-sm font-semibold text-stone-700 mb-2">
                  Print Type
                </label>
                <select
                  id="print_type"
                  name="print_type"
                  value={printTypes.length === 0 ? '' : formData.print_type}
                  onChange={handleChange}
                  required
                  disabled={isReadOnly || printTypes.length === 0}
                  className={`w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors disabled:bg-stone-100 disabled:text-stone-500 ${printTypeColorClass}`.trim()}
                >
                  {printTypes.length === 0 ? (
                    <option value="">No print types available</option>
                  ) : (
                    printTypes.map(type => (
                      <option key={type.print_type_id} value={type.print_type_id}>
                        {type.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="mt-6 sm:mt-0 sm:w-1/2">
                <label htmlFor="material_cost" className="block text-sm font-semibold text-stone-700 mb-2">
                  Material Cost ($)
                </label>
                <input
                  type="number"
                  id="material_cost"
                  name="material_cost"
                  value={formData.material_cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div className="sm:flex sm:items-end sm:space-x-4">
              <div className="sm:w-1/2">
                <label htmlFor="print_time" className="block text-sm font-semibold text-stone-700 mb-2">
                  Print Time (hours)
                </label>
                <input
                  type="number"
                  id="print_time"
                  name="print_time"
                  value={formData.print_time}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  required
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
                />
              </div>

              <div className="sm:w-1/2">
                <div className="w-full px-4 py-3 border border-stone-300 rounded-lg bg-stone-50 text-stone-900">
                  {printTypes.length === 0 ? 'Unavailable' : formatCurrency(calculatedPrintCost)}
                </div>
              </div>
            </div>

            <div className="sm:flex sm:items-end sm:space-x-4">
              <div className="sm:w-1/2">
                <label htmlFor="labor_time" className="block text-sm font-semibold text-stone-700 mb-2">
                  Labor Time (hours)
                </label>
                <input
                  type="number"
                  id="labor_time"
                  name="labor_time"
                  value={formData.labor_time}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  required
                  disabled={isReadOnly}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
                />
              </div>

              <div className="sm:w-1/2">
                <div className="w-full px-4 py-3 border border-stone-300 rounded-lg bg-stone-50 text-stone-900">
                  {formatCurrency(calculatedLaborCost)}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <table className="min-w-full text-sm text-stone-900">
                <tbody>
                  <tr className="border-b border-stone-200">
                    <th className="bg-stone-50 px-4 py-3 text-left font-semibold text-stone-700">Total Cost</th>
                    <td className="px-4 py-3 text-right text-lg font-semibold">
                      {formatCurrency(calculatedTotalCost)}
                    </td>
                  </tr>
                  <tr className="border-b border-stone-200">
                    <th className="bg-stone-50 px-4 py-3 text-left font-semibold text-stone-700">Suggested Price</th>
                    <td className="px-4 py-3 text-right text-lg font-semibold">
                      {formatCurrency(calculatedSuggestedPrice)}
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-stone-50 px-4 py-3 text-left font-semibold text-stone-700 align-middle">Quoted Price</th>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-flex w-32 justify-end">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-stone-500">
                          $
                        </span>
                        <input
                          type="number"
                          id="actual_price"
                          name="actual_price"
                          value={actualPriceInput}
                          onChange={handleChange}
                          onBlur={handleActualPriceBlur}
                          min="0"
                          step="0.5"
                          disabled={isReadOnly}
                          className="w-full text-right pr-3 pl-6 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-stone-700 bg-stone-200 rounded-lg hover:bg-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-colors"
            >
              Cancel
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={isLoading || formData.status === 0 || selectableQuoteStatuses.length === 0}
                className="px-6 py-3 bg-[var(--brand)] text-white rounded-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Saving...' : (quote ? 'Update' : 'Create')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
