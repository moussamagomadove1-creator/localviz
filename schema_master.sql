-- ============================================================
-- MASTER LEADS: Pre-scraped database of all French businesses
-- without websites. Populated by batch_scraper.js
-- ============================================================

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

-- Index for fast lookups by city + category
CREATE INDEX IF NOT EXISTS idx_master_leads_city_category 
ON public.master_leads (lower(city), lower(category));

-- Index for text search
CREATE INDEX IF NOT EXISTS idx_master_leads_category_text
ON public.master_leads USING gin (category gin_trgm_ops);

-- RLS: Only service role can read/write master_leads (backend only)
ALTER TABLE public.master_leads ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by backend)
CREATE POLICY "Service role full access on master_leads"
ON public.master_leads FOR ALL
USING (true)
WITH CHECK (true);
