import { createClient } from '@supabase/supabase-js';

// Anon key is safe to use on the client — RLS enforces data access rules
const SUPABASE_URL = 'https://sqbwsrayjhxigcalpmhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYndzcmF5amh4aWdjYWxwbWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTY2MjcsImV4cCI6MjA5NTc3MjYyN30.7jzSMZ7jeptItB8hNoN1lZ0S9-keWJ1z5A8j99dzAjc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }, // we manage our own session via AuthContext
  realtime: { params: { eventsPerSecond: 10 } },
});

export function setRealtimeSession(token: string | null) {
  supabase.realtime.setAuth(token);
}
