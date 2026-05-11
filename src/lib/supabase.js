import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValid = url && key && url.startsWith('https://')

export const supabase = isValid
  ? createClient(url, key)
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key')

export const isSupabaseConfigured = isValid
