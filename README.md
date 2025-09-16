# MG Mini Factory - Admin Dashboard

A modern admin dashboard for MG Mini Factory built with React, TypeScript, TailwindCSS, and Supabase.

## Features

### ✅ Implemented
- **Quotes Management**: Create, edit, and view quotes with customer details, project summary, costs, and time estimates
- **Quote to Order Conversion**: Convert quotes to orders with a single click
- **Responsive Design**: Modern UI with TailwindCSS and brand color (#B85C21)
- **Real-time Data**: Supabase integration for data persistence
- **Modal Forms**: Clean modal interface for creating and editing quotes

### 🚧 Planned
- Orders management page
- Print queue tracking
- Dashboard with key metrics
- Admin authentication

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase project with the required schema

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd MGMiniFactory
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

5. Start the development server
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Database Schema

The application expects the following Supabase tables:

### Quotes Table
- `id` (serial, primary key)
- `customer_name` (text)
- `project_summary` (text)
- `material_cost` (numeric)
- `print_time` (numeric)
- `labor_time` (numeric)
- `quote_status_id` (integer, foreign key)
- `created_on` (timestamp)
- `updated_on` (timestamp)

### Orders Table
- `id` (serial, primary key)
- `quote_id` (integer, foreign key)
- `order_status_id` (integer, foreign key)
- `created_on` (timestamp)
- `updated_on` (timestamp)

### Reference Tables
- `quote_status_ref` (id, status_name, description)
- `order_status_ref` (id, status_name, description)
- `print_type_ref` (id, type_name, description)

## Usage

### Managing Quotes
1. Navigate to the Quotes page
2. Click "Create Quote" to add a new quote
3. Fill in customer details, project summary, and cost/time estimates
4. Save the quote (defaults to "Draft" status)
5. Edit quotes by clicking the "Edit" button
6. Convert quotes to orders using "Convert → Order" button

### Quote Statuses
- **Draft**: New quotes start in draft status
- **Converted**: Quotes that have been converted to orders

### Order Statuses
- **Queue**: New orders start in queue
- **Printing**: Orders currently being printed
- **Ready for Pickup**: Completed orders ready for customer pickup
- **Complete**: Orders that have been picked up

## Project Structure

```
src/
├── components/
│   └── QuoteModal.tsx          # Modal for creating/editing quotes
├── data/
│   ├── quotes.ts               # Quote data access functions
│   └── orders.ts               # Order data access functions
├── pages/
│   ├── QuotesPage.tsx          # Main quotes management page
│   └── OrdersPage.tsx          # Orders page (placeholder)
├── types.ts                    # TypeScript type definitions
├── App.tsx                     # Main app component with routing
└── main.tsx                    # App entry point

lib/
└── supabase.ts                 # Supabase client configuration
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses ESLint and Prettier for code formatting. Make sure to run `npm run lint` before committing changes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is proprietary to MG Mini Factory.
