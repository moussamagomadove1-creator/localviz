import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_0PvCneR94xUnSFED677k8g_pOfjOmeh';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
