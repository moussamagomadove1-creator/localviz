require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createTable() {
  // Test connection by trying to query the table
  const { data, error } = await supabase.from('master_leads').select('id').limit(1);
  
  if (error && error.message.includes('does not exist')) {
    console.log('❌ Table master_leads does not exist yet.');
    console.log('');
    console.log('Please create it manually in Supabase SQL Editor:');
    console.log('Go to: https://supabase.com/dashboard/project/tcbkaiyryvdhvrzppomz/sql');
    console.log('');
    console.log('Paste this SQL:');
    console.log('---');
    console.log(`
CREATE TABLE IF NOT EXISTS public.master_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    category TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    rating TEXT,
    url TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, city)
);

CREATE INDEX IF NOT EXISTS idx_master_leads_city ON public.master_leads (lower(city));
CREATE INDEX IF NOT EXISTS idx_master_leads_category ON public.master_leads (lower(category));
    `);
    console.log('---');
    return false;
  } else if (error) {
    console.log('Error:', error.message);
    return false;
  } else {
    console.log('✅ Table master_leads exists! Ready to populate.');
    return true;
  }
}

createTable();
