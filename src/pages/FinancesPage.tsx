import { useEffect, useMemo, useState } from 'react'
import { fetchOrders } from '../data/orders'
import type { OrderWithQuote } from '../types'

const COMPLETED_STATUS_IDS = new Set([4])

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

function FinancesPage() {
  const [orders, setOrders] = useState<OrderWithQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const stats = useMemo(() => {
    const totals = orders.reduce(
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

    const ordersReceived = orders.length
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
  }, [orders])

  const metricCards = [
    {
      label: '# of Orders Received',
      value: stats.ordersReceived.toLocaleString(),
      subtext: 'Total orders created',
    },
    {
      label: '# of Orders Completed',
      value: stats.ordersCompleted.toLocaleString(),
      subtext: 'Marked complete',
    },
    {
      label: 'Revenue',
      value: formatCurrency(stats.revenue),
      subtext: 'Sum of quote actual prices',
    },
    {
      label: 'Material Cost',
      value: formatCurrency(stats.materialCost),
      subtext: 'Aggregate material spend',
    },
    {
      label: 'Print Cost',
      value: formatCurrency(stats.printCost),
      subtext: 'Machine time & upkeep',
    },
    {
      label: 'Labor Cost',
      value: formatCurrency(stats.laborCost),
      subtext: 'Hands-on effort',
    },
    {
      label: 'Profit',
      value: formatCurrency(stats.profit),
      subtext: 'Revenue minus hard costs',
    },
    {
      label: 'Profit Margin',
      value: `${stats.profitMarginPercent.toFixed(2)}%`,
      subtext: 'Profit as a percentage of revenue',
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
          <h1 className="text-4xl font-bold text-stone-900">Finances</h1>
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

            return (
              <div
                key={metric.label}
                className={`rounded-3xl p-6 shadow-sm space-y-2 ring-1 ${containerClass}`}
              >
                <p className={`text-sm font-medium ${labelClass}`}>{metric.label}</p>
                <p className={`text-3xl font-semibold ${valueClass}`}>{metric.value}</p>
                <p className={`text-sm ${subtextClass}`}>{metric.subtext}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FinancesPage
