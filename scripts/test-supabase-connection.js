import { loadEnv } from 'vite'

async function main() {
  const env = loadEnv('development', process.cwd(), 'VITE_')
  const url = env.VITE_SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment')
    process.exit(1)
  }

  const endpoint = `${url.replace(/\/$/, '')}/auth/v1/settings`

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      console.error(`Supabase responded with ${response.status} ${response.statusText}`)
      if (body) {
        console.error(body)
      }
      process.exit(1)
    }

    const settings = await response.json()
    console.log('Successfully reached Supabase auth settings endpoint.')
    console.log('Email confirmations enabled:', settings?.email_otp ?? 'unknown')
  } catch (error) {
    console.error('Failed to reach Supabase:', error)
    process.exit(1)
  }
}

main()
