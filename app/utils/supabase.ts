import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key in environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
