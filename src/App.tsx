import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { FormEvent, useEffect, useState } from 'react'
import QuotesPage from './pages/QuotesPage'
import OrdersPage from './pages/OrdersPage'
import { loginUser, fetchAuthenticatedUser, logoutSession } from './data/auth'
import type { UserRecord } from './types'

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
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
      {isAuthenticated && (
        <section className="rounded-3xl bg-white px-8 py-10 ring-1 ring-stone-200 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-green-600 font-semibold">You're signed in</p>
          <h2 className="mt-3 text-3xl font-bold text-stone-900">Welcome back, {user?.name ?? user?.username ?? user?.email}</h2>
          <p className="mt-3 text-stone-600">
            Explore your Quotes and Orders using the navigation above. Sign out at any time from the header.
          </p>
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
