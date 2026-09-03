import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// When env vars are not set (e.g. local preview without a Supabase project yet),
// `supabase` is null and src/lib/db.js automatically falls back to the local
// demo adapter (mockAdapter.js) so the whole app still works out of the box.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

// Separate, non-persisted client used ONLY when Super Admin creates a new
// user account (supabase.auth.signUp switches the CALLING client's active
// session to the newly created user -- undesirable when it's an admin
// creating an account on someone else's behalf). Using an isolated client
// here means signUp() never touches the main `supabase` client's session,
// so the admin stays logged in as themselves throughout.
export const supabaseAuthAux = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;