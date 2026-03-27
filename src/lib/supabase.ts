import { createBrowserClient } from '@supabase/ssr'

// Browser client — safe to import in any Client Component ('use client')
// Falls back to placeholder strings at build time so static pages compile cleanly.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL      ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )
}
