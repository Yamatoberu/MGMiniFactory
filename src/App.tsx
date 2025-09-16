import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import QuotesPage from './pages/QuotesPage'
import OrdersPage from './pages/OrdersPage'

function Navigation() {
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
            <Link to="/quotes" className={`hover:text-[var(--brand)] ${isActive('/quotes') ? 'text-[var(--brand)]' : ''}`}>
              Quotes
            </Link>
            <Link to="/orders" className={`hover:text-[var(--brand)] ${isActive('/orders') ? 'text-[var(--brand)]' : ''}`}>
              Orders
            </Link>
          </nav>
          <div className="flex-1"></div>
          <Link to="/quotes" className="inline-flex items-center rounded-full bg-[var(--brand)] px-6 py-3 text-white font-semibold shadow-sm hover:brightness-110 transition">
            Create Quote
          </Link>
        </div>
      </div>
    </header>
  )
}

function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
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
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-800">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quotes" element={<QuotesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
