import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cache the client instance so we don't recreate it on every render
let supabase: any = null;

export function createClient(): any {
  if (!supabase) {
    supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'relation-tree-auth',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        }
      }
    )
  }
  return supabase
}
