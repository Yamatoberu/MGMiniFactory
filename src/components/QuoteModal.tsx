import React, { useState, useEffect } from 'react'
import { QuoteFormData, QuoteRow } from '../types'
import { upsertQuote } from '../data/quotes'

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  quote?: QuoteRow | null
}

export default function QuoteModal({ isOpen, onClose, onSave, quote }: QuoteModalProps) {
  const [formData, setFormData] = useState<QuoteFormData>({
    customer_name: '',
    project_summary: '',
    material_cost: 0,
    print_time: 0,
    labor_time: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (quote) {
      setFormData({
        customer_name: quote.customer_name,
        project_summary: quote.project_summary,
        material_cost: quote.material_cost,
        print_time: quote.print_time,
        labor_time: quote.labor_time
      })
    } else {
      setFormData({
        customer_name: '',
        project_summary: '',
        material_cost: 0,
        print_time: 0,
        labor_time: 0
      })
    }
    setError(null)
  }, [quote, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const payload = quote ? { ...formData, id: quote.id } : formData
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('cost') || name.includes('time') ? parseFloat(value) || 0 : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 ring-1 ring-stone-200 shadow-sm">
        <h2 className="text-2xl font-bold text-stone-900 mb-6">
          {quote ? 'Edit Quote' : 'Create New Quote'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
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
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
            />
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
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
            />
          </div>

          <div>
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
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
            />
          </div>

          <div>
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
              step="0.1"
              required
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
            />
          </div>

          <div>
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
              step="0.1"
              required
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent transition-colors"
            />
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
              className="px-6 py-3 text-stone-700 bg-stone-200 rounded-lg hover:bg-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-[var(--brand)] text-white rounded-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Saving...' : (quote ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
