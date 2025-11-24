import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { FormEvent, useEffect, useState } from 'react'
import QuotesPage from './pages/QuotesPage'
import OrdersPage from './pages/OrdersPage'
import DashboardPage from './pages/DashboardPage'
import { loginUser, fetchAuthenticatedUser, logoutSession } from './data/auth'
import { fetchPrintTypes, fetchQuoteStatuses, upsertQuote, fetchQuotes } from './data/quotes'
import type { UserRecord, QuoteStatus, PrintType } from './types'

type AuthUser = UserRecord

type NavigationProps = {
  isAuthenticated: boolean
  user: AuthUser | null
  onLogout: () => void | Promise<void>
  onLoginClick: () => void
}

type LoginResult = {
  success: boolean
  message?: string
  user?: AuthUser
}

type HomePageProps = {
  isAuthenticated: boolean
  user: AuthUser | null
}

type PrintPreference = 'resin' | 'fdm'

type LoginFormProps = {
  onLogin: (email: string, password: string) => Promise<LoginResult>
}

function Navigation({ isAuthenticated, user, onLogout, onLoginClick }: NavigationProps) {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <header className="border-b border-stone-200 bg-white/95 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-28 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="MG Mini Factory" className="h-16 w-auto" />
          </div>
          <nav className="flex items-center gap-10 text-stone-700 font-medium text-2xl">
            <Link to="/" className={`hover:text-[var(--brand)] ${isActive('/') ? 'text-[var(--brand)]' : ''}`}>
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`hover:text-[var(--brand)] ${isActive('/dashboard') ? 'text-[var(--brand)]' : ''}`}
                >
                  Dashboard
                </Link>
                <Link to="/quotes" className={`hover:text-[var(--brand)] ${isActive('/quotes') ? 'text-[var(--brand)]' : ''}`}>
                  Quotes
                </Link>
                <Link to="/orders" className={`hover:text-[var(--brand)] ${isActive('/orders') ? 'text-[var(--brand)]' : ''}`}>
                  Orders
                </Link>
              </>
            )}
          </nav>
          <div className="flex-1 flex justify-end">
            {isAuthenticated ? (
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-sm text-stone-500">Signed in as</p>
                  <p className="text-stone-800 font-semibold">{user?.username ?? user?.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand)]/80"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="rounded-full border border-[var(--brand)] px-6 py-2 text-lg font-semibold text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await onLogin(email.trim(), password)
      if (!result.success) {
        setError(result.message ?? 'Unable to log in')
        return
      }

      setEmail('')
      setPassword('')
      setError(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3 text-base shadow-sm focus:border-[var(--brand)] focus:ring-[var(--brand)]"
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-stone-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-3 text-base shadow-sm focus:border-[var(--brand)] focus:ring-[var(--brand)]"
          placeholder="••••••••"
          required
        />
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[var(--brand)] px-6 py-3 text-lg font-semibold text-white shadow-sm hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}

function HomePage({ isAuthenticated, user }: HomePageProps) {
  const [isSubmitQuoteOpen, setIsSubmitQuoteOpen] = useState(false)
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    email: '',
    summary: '',
    url: '',
    printType: 'resin' as PrintPreference,
  })
  const [quoteMeta, setQuoteMeta] = useState<{ statuses: QuoteStatus[]; printTypes: PrintType[] }>({
    statuses: [],
    printTypes: [],
  })
  const [quoteMetaLoading, setQuoteMetaLoading] = useState(false)
  const [quoteMetaError, setQuoteMetaError] = useState<string | null>(null)
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)
  const [quoteSubmitError, setQuoteSubmitError] = useState<string | null>(null)
  const [quoteSubmissionMessage, setQuoteSubmissionMessage] = useState<string | null>(null)
  const [pendingQuotesCount, setPendingQuotesCount] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadQuoteMeta = async () => {
      setQuoteMetaLoading(true)
      try {
        const [statusResult, printTypeResult] = await Promise.all([fetchQuoteStatuses(), fetchPrintTypes()])
        if (!isMounted) return

        setQuoteMeta({
          statuses: statusResult.data ?? [],
          printTypes: printTypeResult.data ?? [],
        })
        setQuoteMetaError(statusResult.error ?? printTypeResult.error ?? null)
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load quote metadata', error)
          setQuoteMetaError('Unable to load quote defaults. Submissions will use fallback values.')
        }
      } finally {
        if (isMounted) {
          setQuoteMetaLoading(false)
        }
      }
    }

    loadQuoteMeta()

    return () => {
      isMounted = false
    }
  }, [])

  const resetQuoteForm = () => {
    setQuoteForm({
      name: '',
      email: '',
      summary: '',
      url: '',
      printType: 'resin',
    })
  }

  const closeSubmitQuoteModal = () => {
    setIsSubmitQuoteOpen(false)
    setQuoteSubmitError(null)
    setIsSubmittingQuote(false)
    resetQuoteForm()
  }

  const openSubmitQuoteModal = () => {
    setQuoteSubmitError(null)
    setIsSubmitQuoteOpen(true)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingQuotesCount(null)
      return
    }

    let isMounted = true
    const loadPendingQuotes = async () => {
      try {
        const result = await fetchQuotes()
        if (!isMounted) return
        if (result.data) {
          const newStatusId =
            quoteMeta.statuses.find(status => status.name?.toLowerCase() === 'new')?.quote_status_ref_id ??
            quoteMeta.statuses[0]?.quote_status_ref_id ??
            1
          const count = result.data.filter(quote => {
            const statusId = quote.status ?? quote.quote_status_id
            return statusId === newStatusId
          }).length
          setPendingQuotesCount(count)
        } else {
          setPendingQuotesCount(null)
        }
      } catch (error) {
        console.error('Failed to load pending quotes', error)
        if (isMounted) {
          setPendingQuotesCount(null)
        }
      }
    }

    loadPendingQuotes()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, quoteMeta.statuses])

  const getPrintTypeId = (preference: PrintPreference) => {
    const normalizedPref = preference.toLowerCase()
    const exactMatch = quoteMeta.printTypes.find(type => type.name?.toLowerCase() === normalizedPref)
    if (exactMatch) return exactMatch.print_type_id

    const containsMatch = quoteMeta.printTypes.find(type => type.name?.toLowerCase().includes(normalizedPref))
    if (containsMatch) return containsMatch.print_type_id

    return quoteMeta.printTypes[0]?.print_type_id ?? 1
  }

  const getDefaultStatusId = () => {
    const preferred = quoteMeta.statuses.find(status => status.name?.toLowerCase() === 'new')
    if (preferred) return preferred.quote_status_ref_id
    return quoteMeta.statuses[0]?.quote_status_ref_id ?? 1
  }

  const handleSubmitQuote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmittingQuote) return

    const trimmedName = quoteForm.name.trim()
    const trimmedEmail = quoteForm.email.trim()
    const trimmedSummary = quoteForm.summary.trim()
    const trimmedSource = quoteForm.url.trim()
    const submissionSource = trimmedSource || 'Home CTA'

    if (!trimmedName || !trimmedSummary || !trimmedEmail) {
      setQuoteSubmitError('Please complete the required fields.')
      return
    }

    setQuoteSubmitError(null)
    setIsSubmittingQuote(true)

    try {
      const result = await upsertQuote({
        customer_name: trimmedName,
        email_address: trimmedEmail,
        order_date: new Date().toISOString().split('T')[0],
        project_summary: trimmedSummary,
        source: submissionSource,
        print_type: getPrintTypeId(quoteForm.printType),
        status: getDefaultStatusId(),
        material_cost: 0,
        print_time: 0,
        labor_time: 0,
        actual_price: 0,
      })

      if (result.error || !result.data) {
        throw new Error(result.error ?? 'Unable to submit quote right now.')
      }

      closeSubmitQuoteModal()
      setQuoteSubmissionMessage('Your request has been submitted. We will reach out shortly!')
    } catch (error) {
      console.error('Failed to submit quote request', error)
      setQuoteSubmitError(error instanceof Error ? error.message : 'Unable to submit quote right now.')
    } finally {
      setIsSubmittingQuote(false)
    }
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        {quoteSubmissionMessage && (
          <div className="rounded-3xl border border-green-200 bg-green-50 px-6 py-4 text-green-800 flex items-start justify-between gap-4">
            <p>{quoteSubmissionMessage}</p>
            <button
              type="button"
              onClick={() => setQuoteSubmissionMessage(null)}
              className="text-xl leading-none text-green-600 hover:text-green-800"
              aria-label="Dismiss success message"
            >
              &times;
            </button>
          </div>
        )}
        {isAuthenticated && (
          <section className="rounded-3xl bg-white px-8 py-10 ring-1 ring-stone-200 shadow-sm">
            <p className="text-sm uppercase tracking-wide text-green-600 font-semibold">You're signed in</p>
            <h2 className="mt-3 text-3xl font-bold text-stone-900">Welcome back, {user?.name ?? user?.username ?? user?.email}</h2>
            <p className="mt-3 text-stone-600">
              Explore your Quotes and Orders using the navigation above. Sign out at any time from the header.
            </p>
            {pendingQuotesCount !== null && pendingQuotesCount > 0 && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-amber-900 font-semibold">
                  {pendingQuotesCount}
                </span>
                <p className="text-sm font-medium">
                  {pendingQuotesCount === 1
                    ? 'There is 1 new quote waiting for review.'
                    : `There are ${pendingQuotesCount} new quotes waiting for review.`}
                </p>
              </div>
            )}
          </section>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200 shadow-sm hover:ring-[var(--brand)] transition">
            <h3 className="font-semibold text-[var(--brand)]">Fast Quotes</h3>
            <p className="text-stone-600 mt-2">Upload files, choose materials, and get an instant estimate.</p>
          </div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200 shadow-sm hover:ring-[var(--brand)] transition">
            <h3 className="font-semibold text-[var(--brand)]">Quality Prints</h3>
            <p className="text-stone-600 mt-2">High-resolution resin and FDM tuned for miniature detail.</p>
          </div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-stone-200 shadow-sm hover:ring-[var(--brand)] transition">
            <h3 className="font-semibold text-[var(--brand)]">On-Time Delivery</h3>
            <p className="text-stone-600 mt-2">Reliable timelines for game night and shop inventory.</p>
          </div>
        </div>

        <section className="rounded-3xl bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 px-8 py-10 text-white shadow-xl ring-1 ring-black/10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide font-semibold text-[var(--brand)]">Custom projects</p>
              <h2 className="mt-2 text-3xl font-bold">Need a quote for your next idea?</h2>
              <p className="mt-3 text-stone-100 max-w-2xl">
                Tell us what you&apos;re envisioning and we&apos;ll help you plan materials, timelines, and pricing tailored to your game nights or store shelves.
              </p>
            </div>
            <button
              type="button"
              onClick={openSubmitQuoteModal}
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-[rgba(184,92,33,0.35)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
            >
              Submit Quote
            </button>
          </div>
        </section>

        <footer className="bg-white ring-1 ring-stone-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-stone-900">About Us</h2>
          <p className="mt-3 text-stone-600 leading-relaxed">At MG Mini Factory, imagination goes 3D. We bring ideas to life—one layer at a time—with custom minis, epic prints, and a dash of geeky magic. Whether you’re building a collection or crafting your next campaign, we’re here to make your world a little more miniature and a lot more awesome.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-stone-900">What We Do</h3>
              <p className="mt-2 text-sm text-stone-600">We create high-quality 3D-printed minis and custom designs that bring your imagination to life.</p>
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Get In Touch</h3>
              <p className="mt-2 text-sm text-stone-600">mgminifactory208@gmail.com</p>
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Follow Us</h3>
              <div className="mt-4 flex items-center gap-4">
                <a
                  href="https://www.instagram.com/mg_mini_factory/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-stone-500 hover:text-[var(--brand)] transition"
                  aria-label="Instagram"
                >
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM17.8 5.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z" />
                    <path d="M21.5 6.7a5.6 5.6 0 0 0-1.5-3.9 5.6 5.6 0 0 0-3.9-1.5c-1.5-.1-6.1-.1-7.6 0a5.6 5.6 0 0 0-3.9 1.5A5.6 5.6 0 0 0 3 6.7c-.1 1.5-.1 6.1 0 7.6a5.6 5.6 0 0 0 1.5 3.9 5.6 5.6 0 0 0 3.9 1.5c1.5.1 6.1.1 7.6 0a5.6 5.6 0 0 0 3.9-1.5 5.6 5.6 0 0 0 1.5-3.9c.1-1.5.1-6 0-7.6Zm-2 9.2a3.1 3.1 0 0 1-1.7 1.7c-1.2.5-4 .4-5.8.4s-4.6.1-5.8-.4a3.1 3.1 0 0 1-1.7-1.7c-.5-1.2-.4-4-.4-5.8 0-1.8-.1-4.6.4-5.8a3.1 3.1 0 0 1 1.7-1.7c1.2-.5 4-.4 5.8-.4s4.6-.1 5.8.4a3.1 3.1 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.8 0 1.8.1 4.6-.4 5.8Z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61576848183106"
                  target="_blank"
                  rel="noreferrer"
                  className="text-stone-500 hover:text-[var(--brand)] transition"
                  aria-label="Facebook"
                >
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M13.2 21.8v-7.7h2.6l.4-3h-3V9.2c0-.9.3-1.5 1.5-1.5h1.6V5c-.3 0-1.2-.1-2.2-.1-2.1 0-3.6 1.3-3.6 3.7v2.2H8v3h2.5v7.7h2.7Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {isSubmitQuoteOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 px-4 pt-28 pb-10 overflow-y-auto">
          <form
            onSubmit={handleSubmitQuote}
            className="w-full max-w-lg mx-auto mt-6 rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-stone-200 space-y-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-quote-title"
            aria-describedby="submit-quote-description"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-[var(--brand)] font-semibold">Submit Quote</p>
                <h3 id="submit-quote-title" className="mt-2 text-3xl font-bold text-stone-900">
                  Tell us about your project
                </h3>
                <p id="submit-quote-description" className="mt-3 text-stone-600">
                  Share a few details so we can follow up with an accurate estimate.
                </p>
              </div>
              <button
                type="button"
                onClick={closeSubmitQuoteModal}
                className="text-3xl leading-none text-stone-400 hover:text-stone-600"
                aria-label="Close dialog"
              >
                &times;
              </button>
            </div>
            {quoteMetaError && (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {quoteMetaError}
              </p>
            )}

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-stone-700">Your Name *</span>
                <input
                  type="text"
                  required
                  value={quoteForm.name}
                  onChange={event => setQuoteForm(prev => ({ ...prev, name: event.target.value }))}
                  disabled={isSubmittingQuote}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-base shadow-sm focus:border-[var(--brand)] focus:ring-[var(--brand)] disabled:opacity-60"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-stone-700">Email Address *</span>
                <input
                  type="email"
                  required
                  value={quoteForm.email}
                  onChange={event => setQuoteForm(prev => ({ ...prev, email: event.target.value }))}
                  disabled={isSubmittingQuote}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-base shadow-sm focus:border-[var(--brand)] focus:ring-[var(--brand)] disabled:opacity-60"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-stone-700">Project Summary *</span>
                <textarea
                  required
                  rows={4}
                  value={quoteForm.summary}
                  onChange={event => setQuoteForm(prev => ({ ...prev, summary: event.target.value }))}
                  disabled={isSubmittingQuote}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-base shadow-sm focus:border-[var(--brand)] focus:ring-[var(--brand)] disabled:opacity-60"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-stone-700">Reference link or source (optional)</span>
                <input
                  type="text"
                  placeholder="Share a link, file name, or note"
                  value={quoteForm.url}
                  onChange={event => setQuoteForm(prev => ({ ...prev, url: event.target.value }))}
                  disabled={isSubmittingQuote}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-base shadow-sm focus:border-[var(--brand)] focus:ring-[var(--brand)] disabled:opacity-60"
                />
              </label>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-stone-700">Preferred Print Type</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${quoteForm.printType === 'resin' ? 'border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]' : 'border-stone-200 text-stone-700'}`}>
                    <input
                      type="radio"
                      name="printType"
                      value="resin"
                      checked={quoteForm.printType === 'resin'}
                      onChange={() => setQuoteForm(prev => ({ ...prev, printType: 'resin' }))}
                      disabled={isSubmittingQuote}
                      className="h-4 w-4 border-stone-300 text-[var(--brand)] focus:ring-[var(--brand)] disabled:opacity-60"
                    />
                    Resin (higher detail)
                  </label>
                  <label className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${quoteForm.printType === 'fdm' ? 'border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]' : 'border-stone-200 text-stone-700'}`}>
                    <input
                      type="radio"
                      name="printType"
                      value="fdm"
                      checked={quoteForm.printType === 'fdm'}
                      onChange={() => setQuoteForm(prev => ({ ...prev, printType: 'fdm' }))}
                      disabled={isSubmittingQuote}
                      className="h-4 w-4 border-stone-300 text-[var(--brand)] focus:ring-[var(--brand)] disabled:opacity-60"
                    />
                    FDM (higher durability)
                  </label>
                </div>
              </fieldset>
            </div>

            {quoteSubmitError && (
              <p className="text-center text-sm text-red-600" role="alert">
                {quoteSubmitError}
              </p>
            )}

            <div className="pt-4 flex justify-center gap-4">
              <button
                type="submit"
                disabled={isSubmittingQuote || quoteMetaLoading}
                className="rounded-full bg-[var(--brand)] px-6 py-3 text-base font-semibold text-white shadow-sm hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmittingQuote ? 'Submitting…' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={closeSubmitQuoteModal}
                disabled={isSubmittingQuote}
                className="rounded-full px-6 py-3 text-base font-semibold text-stone-600 ring-1 ring-stone-300 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('mgmf-auth-user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch (error) {
    console.error('Failed to read stored auth user', error)
    return null
  }
}

function persistUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return
  if (user) {
    window.localStorage.setItem('mgmf-auth-user', JSON.stringify(user))
  } else {
    window.localStorage.removeItem('mgmf-auth-user')
  }
}

function LoginModal({
  isOpen,
  onClose,
  onLogin,
}: {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<LoginResult>
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-stone-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-[var(--brand)] font-semibold">Secure Access</p>
            <h2 className="text-3xl font-bold text-stone-900">Sign in</h2>
          </div>
          <button onClick={onClose} aria-label="Close login" className="text-stone-500 hover:text-stone-700 text-2xl leading-none">
            &times;
          </button>
        </div>
        <LoginForm
          onLogin={async (username, password) => {
            const result = await onLogin(username, password)
            if (result.success) {
              onClose()
            }
            return result
          }}
        />
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    const restore = async () => {
      const { data, error } = await fetchAuthenticatedUser()
      if (!isMounted) return

      if (error) {
        console.error('Failed to refresh stored session', error)
        setUser(null)
        persistUser(null)
        return
      }

      if (data) {
        setUser(data)
        persistUser(data)
      } else {
        setUser(null)
        persistUser(null)
      }
    }

    restore()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogin = async (email: string, password: string): Promise<LoginResult> => {
    if (!email || !password) {
      return { success: false, message: 'Please provide both email and password.' }
    }

    const { data, error } = await loginUser(email, password)

    if (error || !data) {
      return { success: false, message: error ?? 'Invalid username or password.' }
    }

    setUser(data)
    persistUser(data)
    return { success: true, user: data }
  }

  const handleLogout = async () => {
    const error = await logoutSession()
    if (error) {
      console.error('Failed to log out of Supabase session', error)
    }
    setUser(null)
    persistUser(null)
    setIsLoginModalOpen(false)
  }

  const isAuthenticated = Boolean(user)

  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-800">
        <Navigation
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
          onLoginClick={() => setIsLoginModalOpen(true)}
        />
        <main>
          <Routes>
            <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} user={user} />} />
            <Route
              path="/quotes"
              element={isAuthenticated ? <QuotesPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/orders"
              element={isAuthenticated ? <OrdersPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/dashboard"
              element={isAuthenticated ? <DashboardPage /> : <Navigate to="/" replace />}
            />
          </Routes>
        </main>
        <LoginModal
          isOpen={isLoginModalOpen && !isAuthenticated}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLogin}
        />
      </div>
    </Router>
  )
}

export default App
