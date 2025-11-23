import { useEffect, useMemo, useState } from 'react'
import { fetchOrders } from '../data/orders'
import type { OrderWithQuote } from '../types'

const COMPLETED_STATUS_IDS = new Set([4])

type DateRangeKey = 'mtd' | 'last-month' | 'ytd' | 'last-year' | 'all'

const FILTER_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mtd', label: 'This Month to Date' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'last-year', label: 'Last Calendar Year' },
]

const parseNumeric = (value?: number | string | null) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const getMarginCardAppearance = (marginPercent: number) => {
  if (marginPercent >= 30) {
    return {
      container: 'bg-emerald-100 ring-emerald-200',
      label: 'text-emerald-800',
      value: 'text-emerald-900',
      subtext: 'text-emerald-700',
    }
  }

  if (marginPercent >= 25) {
    return {
      container: 'bg-amber-100 ring-amber-200',
      label: 'text-amber-800',
      value: 'text-amber-900',
      subtext: 'text-amber-700',
    }
  }

  return {
    container: 'bg-rose-100 ring-rose-200',
    label: 'text-rose-800',
    value: 'text-rose-900',
    subtext: 'text-rose-700',
  }
}

type MetricCard = {
  label: string
  value?: string
  subtext?: string
  appearance?: ReturnType<typeof getMarginCardAppearance>
  breakdown?: { label: string; value: string }[]
  totalLabel?: string
  totalValue?: string
  secondaryLabel?: string
  secondaryValue?: string
}

function DashboardPage() {
  const [orders, setOrders] = useState<OrderWithQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState<DateRangeKey>('all')

  const getDateRange = (key: DateRangeKey) => {
    const now = new Date()
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

    if (key === 'all') {
      return { start: null, end: null, isAllRange: true }
    }

    if (key === 'mtd') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: startOfDay(start), end: endOfDay(now), isAllRange: false }
    }

    if (key === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: startOfDay(start), end: endOfDay(end), isAllRange: false }
    }

    if (key === 'ytd') {
      const start = new Date(now.getFullYear(), 0, 1)
      return { start: startOfDay(start), end: endOfDay(now), isAllRange: false }
    }

    const start = new Date(now.getFullYear() - 1, 0, 1)
    const end = new Date(now.getFullYear() - 1, 11, 31)
    return { start: startOfDay(start), end: endOfDay(end), isAllRange: false }
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await fetchOrders()
        if (fetchError) {
          setError(fetchError)
          setOrders([])
          return
        }
        setOrders(data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load finances')
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const { start: rangeStart, end: rangeEnd, isAllRange } = useMemo(
    () => getDateRange(selectedRange),
    [selectedRange],
  )

  const filteredOrders = useMemo(() => {
    if (isAllRange || !rangeStart || !rangeEnd) {
      return orders
    }

    return orders.filter((order) => {
      const dateSource = order.quote?.order_date ?? order.created_on
      if (!dateSource) return false
      const timestamp = Date.parse(dateSource)
      if (Number.isNaN(timestamp)) return false
      const orderDate = new Date(timestamp)
      return orderDate >= rangeStart && orderDate <= rangeEnd
    })
  }, [orders, rangeStart, rangeEnd, isAllRange])

  const { displayStart, displayEnd } = useMemo(() => {
    if (!isAllRange || !orders.length) {
      return {
        displayStart: rangeStart,
        displayEnd: rangeEnd,
      }
    }

    const timestamps = orders
      .map((order) => {
        const dateSource = order.quote?.order_date ?? order.created_on
        if (!dateSource) return null
        const timestamp = Date.parse(dateSource)
        return Number.isNaN(timestamp) ? null : timestamp
      })
      .filter((value): value is number => value !== null)

    if (timestamps.length === 0) {
      return {
        displayStart: null,
        displayEnd: null,
      }
    }

    return {
      displayStart: new Date(Math.min(...timestamps)),
      displayEnd: new Date(Math.max(...timestamps)),
    }
  }, [isAllRange, orders, rangeStart, rangeEnd])

  const stats = useMemo(() => {
    const totals = filteredOrders.reduce(
      (acc, order) => {
        const quote = order.quote
        const actualPrice = parseNumeric(quote?.actual_price)
        const materialCost = parseNumeric(quote?.material_cost)
        const printCost = parseNumeric(quote?.print_cost)
        const laborCost = parseNumeric(quote?.labor_cost)

        if (actualPrice !== null) acc.revenue += actualPrice
        if (materialCost !== null) acc.material += materialCost
        if (printCost !== null) acc.print += printCost
        if (laborCost !== null) acc.labor += laborCost

        const profitContribution =
          (actualPrice ?? 0) - (materialCost ?? 0) - (printCost ?? 0) - (laborCost ?? 0)
        acc.profit += profitContribution

        if (COMPLETED_STATUS_IDS.has(order.status ?? 0)) {
          acc.completed += 1
        }

        return acc
      },
      {
        revenue: 0,
        material: 0,
        print: 0,
        labor: 0,
        profit: 0,
        completed: 0,
      },
    )

    const ordersReceived = filteredOrders.length
    const profitMarginPercent =
      totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0

    return {
      ordersReceived,
      ordersCompleted: totals.completed,
      revenue: totals.revenue,
      materialCost: totals.material,
      printCost: totals.print,
      laborCost: totals.labor,
      profit: totals.profit,
      profitMarginPercent,
    }
  }, [filteredOrders])

  const metricCards: MetricCard[] = [
    {
      label: 'Orders',
      value: `${stats.ordersCompleted.toLocaleString()} / ${stats.ordersReceived.toLocaleString()}`,
      subtext: 'Completed over received',
    },
    {
      label: 'Revenue',
      value: formatCurrency(stats.revenue),
      subtext: 'Sum of quote actual prices',
    },
    {
      label: 'Expenses',
      breakdown: [
        { label: 'Material', value: formatCurrency(stats.materialCost) },
        { label: 'Print', value: formatCurrency(stats.printCost) },
        { label: 'Labor', value: formatCurrency(stats.laborCost) },
      ],
      totalLabel: 'Total',
      totalValue: formatCurrency(stats.materialCost + stats.printCost + stats.laborCost),
    },
    {
      label: 'Profit',
      value: formatCurrency(stats.profit),
      secondaryLabel: 'Margin',
      secondaryValue: `${stats.profitMarginPercent.toFixed(2)}%`,
      appearance: getMarginCardAppearance(stats.profitMarginPercent),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-wide font-semibold text-[var(--brand)]">
          Operational Overview
        </p>
        <div>
          <h1 className="text-4xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-600 text-lg">
            Monitor high-level production spend and revenue trends as new orders flow through the
            pipeline.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-lg text-stone-600">Loading finances…</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-4 ring-1 ring-stone-200 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500 font-semibold">
                Date Range
              </p>
              <p className="text-stone-900 font-semibold">
                {FILTER_OPTIONS.find((option) => option.value === selectedRange)?.label}
              </p>
              <p className="text-sm text-stone-500">
                {displayStart ? displayStart.toLocaleDateString() : '—'} –{' '}
                {displayEnd ? displayEnd.toLocaleDateString() : '—'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-stone-600" htmlFor="finances-range">
                Filter
              </label>
              <select
                id="finances-range"
                value={selectedRange}
                onChange={(event) => setSelectedRange(event.target.value as DateRangeKey)}
                className="rounded-2xl border border-stone-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
              >
                {FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((metric) => {
              const containerClass =
                metric.appearance?.container ?? 'bg-white ring-stone-200'
              const labelClass =
                metric.appearance?.label ?? 'text-stone-500'
              const valueClass =
                metric.appearance?.value ?? 'text-stone-900'
              const subtextClass =
                metric.appearance?.subtext ?? 'text-stone-500'
              const hasBreakdown = Array.isArray(metric.breakdown)

              return (
                <div
                  key={metric.label}
                  className={`rounded-3xl p-6 shadow-sm space-y-3 ring-1 ${containerClass}`}
                >
                  <p className={`text-sm font-medium ${labelClass}`}>{metric.label}</p>
                  {hasBreakdown ? (
                    <>
                      <div className="space-y-2">
                        {metric.breakdown?.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between text-sm text-stone-600"
                          >
                            <span>{item.label}</span>
                            <span className="font-medium text-stone-900">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 border-t border-stone-200 pt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-stone-700">
                          {metric.totalLabel ?? 'Total'}
                        </span>
                        <span className="text-xl font-semibold text-stone-900">
                          {metric.totalValue ?? ''}
                        </span>
                      </div>
                      {metric.subtext && (
                        <p className={`text-sm ${subtextClass}`}>{metric.subtext}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className={`text-3xl font-semibold ${valueClass}`}>{metric.value}</p>
                      {metric.secondaryValue && (
                        <p className="text-sm font-semibold text-stone-700">
                          {metric.secondaryLabel ? `${metric.secondaryLabel}: ` : ''}
                          <span className="text-stone-900">{metric.secondaryValue}</span>
                        </p>
                      )}
                      <p className={`text-sm ${subtextClass}`}>{metric.subtext}</p>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
