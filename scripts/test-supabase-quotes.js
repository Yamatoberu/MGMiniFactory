import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const env = loadEnv('development', process.cwd(), 'VITE_')
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment')
    process.exit(1)
  }

  const supabase = createClient(url, anonKey)

  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_on', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching quotes:', error.message)
      process.exit(1)
    }

    console.log(data)

    if (!data || data.length === 0) {
      console.log('No quotes found in Supabase table.')
      return
    }

    console.log('Top 5 quotes:')
    for (const [index, quote] of data.entries()) {
      const summary = quote.project_summary || 'No summary'
      console.log(`${index + 1}. #${quote.id ?? 'unknown'} — ${quote.customer_name ?? 'Unknown customer'}: ${summary}`)
    }
  } catch (error) {
    console.error('Failed to query Supabase:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
