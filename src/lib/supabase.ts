import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xmjqfzwgontqjtylcmnd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtanFmendnb250cWp0eWxjbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NDY5NTEsImV4cCI6MjA5NTIyMjk1MX0.rWKSpFz33DskesGlgQjnlckeDaTtGZ_DWvgazvRWY50";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
