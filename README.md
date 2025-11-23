# MG Mini Factory – Admin Dashboard

React + Supabase dashboard that lets the MG Mini Factory team manage quotes, convert them into tracked orders, and monitor production finances in real time.

## Highlights
- **Secure workspace** – Supabase email/password auth wraps every operational screen, with sessions restored from Supabase on load.
- **Quotes workspace** – Filter by rolling date ranges, open quotes in a modal, auto-calculate material/print/labor costs, see suggested pricing, and convert or abandon quotes with one click.
- **Order tracking** – Orders pull in quote data, expose payment + status badges, show instant margin calculations, and allow inline updates via the Order modal.
- **Dashboard insights** – Finance dashboard aggregates revenue, costs, and margins for any date range with card-level breakdowns and trend-friendly formatting.
- **Responsive UI** – TailwindCSS handling keeps the admin usable on widescreen desktops down to tablets without additional tweaking.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **UI**: TailwindCSS
- **State/Data**: Hooks, Supabase client SDK, React Router v6
- **Auth & Data**: Supabase Auth, tables, and row-level APIs

## Getting Started

### Prerequisites
- Node.js 18+
- npm (ships with Node)
- Supabase project seeded with the tables below

### Setup
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Copy environment template**
   ```bash
   cp env.example .env.local
   ```
3. **Add Supabase credentials**  
   `lib/supabase.ts` expects the standard Vite env names:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:5173](http://localhost:5173) and sign in with a Supabase user that exists in the `users` table.

### Production Builds
```bash
npm run build   # type-check + Vite build
npm run preview # serve the build locally
```

## Supabase Schema

| Table | Purpose | Notable Columns |
| --- | --- | --- |
| `quotes` | Source of truth for every quote and its costing breakdown. | `quote_id` (PK), `customer_name`, `order_date`, `project_summary`, `print_type`, `material_cost`, `print_time`, `labor_time`, `print_cost`, `labor_cost`, `total_cost`, `suggested_price`, `actual_price`, `status`, `quote_status_id`, `created_on`, `updated_on` |
| `orders` | Tracks converted quotes moving through fulfillment. | `order_id` (PK), `quote_id` (FK to `quotes`), `status` (FK to `order_status_ref`), `is_paid`, `notes`, `created_on` |
| `quote_status_ref` | Allowed quote states rendered inside QuoteModal. | `quote_status_ref_id`, `name`, `description` |
| `order_status_ref` | Allowed order pipeline statuses. | `order_status_ref_id`, `status_name`, `description` |
| `print_type_ref` | Defines per-type power + maintenance cost that feed price calculations. | `print_type_id`, `name`, `power_cost`, `maintenance_cost` |
| `users` | Profile metadata tied to Supabase Auth users displayed in the header. | `id`, `auth_user_id`, `name`, `username`, `admin` |

> 🔐 Row-Level Security should allow the service role used by the Vite app to read/write the rows listed above. The data layer normalizes API responses so column aliases like `quote_status_ref_id`/`id` work seamlessly.

## Application Tour
- **Navigation & Auth** – Global nav is aware of the current route and toggles quote/order/dashboard links only after Supabase says the user is logged in. Sessions persist in `localStorage`.
- **Quotes page (`/quotes`)** – Date-range filter, status + print-type pills, currency formatting, and the Quote modal with auto-calculated costs, suggested price, abandon, and convert actions. Converting a quote both marks it as Converted and creates an Order in the Queue status.
- **Orders page (`/orders`)** – Mirrors the date filter, shows paid/unpaid chips, profit margin indicators, and opens the Order modal where status, payment flag, and notes update Supabase instantly.
- **Dashboard (`/dashboard`)** – Re-uses order data to sum revenue, expenses, and margin plus counts of received/completed orders. Color-coded margin card makes profitability obvious.

## Project Structure
```
src/
├── App.tsx
├── components/
│   ├── OrderModal.tsx
│   └── QuoteModal.tsx
├── data/
│   ├── auth.ts        # Supabase auth helpers
│   ├── orders.ts      # Order queries + mutations
│   └── quotes.ts      # Quote queries + upserts
├── pages/
│   ├── DashboardPage.tsx
│   ├── OrdersPage.tsx
│   └── QuotesPage.tsx
├── types.ts           # Shared app + DB types
└── main.tsx

lib/
└── supabase.ts        # Supabase client bootstrap
```

## Development Scripts
- `npm run dev` – start Vite in dev mode
- `npm run build` – type-check and produce a production bundle
- `npm run preview` – serve the latest build
- `npm run lint` – run ESLint across the repo

Run `npm run lint` before committing to keep formatting and hooks consistent.

## License

This project is proprietary to MG Mini Factory.
