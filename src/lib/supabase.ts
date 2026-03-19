import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
 * When false the app falls back to localStorage (single-device mode).
 */
export const isSupabaseConfigured: boolean = !!(
  url && key && url.startsWith("http")
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, key!)
  : null;
