import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xmjqfzwgontqjtylcmnd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_230BnuLxZ5eLN72WVNy3rg_LnWpo49C";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
