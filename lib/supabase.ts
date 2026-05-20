import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  // Not throwing - audit still works without Supabase, just no share URLs
  console.warn('Supabase env vars not set - share links will be disabled');
}

export const supabase = url && key ? createClient(url, key) : null;
export const supabaseEnabled = !!(url && key);
