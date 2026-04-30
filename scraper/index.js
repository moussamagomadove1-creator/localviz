require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================================
// SECURITY: CORS - Only allow requests from our frontend
// ============================================================
const ALLOWED_ORIGINS = [
  'https://localviz.vercel.app',
  'http://localhost:3000'
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, worker)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));

// ============================================================
// SECURITY: Rate Limiting (per IP)
// ============================================================
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // max 20 requests per minute per IP

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const timestamps = rateLimitMap.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  next();
}
app.use(rateLimit);

// Cleanup rate limit map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (valid.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, valid);
  }
}, 5 * 60 * 1000);

// ============================================================
// SECURITY: Input sanitization helper
// ============================================================
function sanitize(str, maxLen = 200) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>"'`;]/g, '').trim().slice(0, maxLen);
}

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================================
// SECURITY: Verify user JWT token from frontend
// ============================================================
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  req.authenticatedUser = user;
  next();
}

// ============================================================
// API: Scan (queries pre-built master_leads database)
// ============================================================
app.post('/api/scrape', requireAuth, async (req, res) => {
  const { city, category, limit } = req.body;
  const userId = req.authenticatedUser.id;
  
  // Validate
  if (!city || !category) {
    return res.status(400).json({ error: 'City and category are required' });
  }

  const cleanCity = sanitize(city, 100);
  const cleanCategory = sanitize(category, 100);
  const isPro = req.authenticatedUser.email === 'admin@localviz.com';
  const MAX_SCAN_LIMIT = isPro ? 999999 : 50;
  const cleanLimit = Math.min(Math.max(parseInt(limit) || 15, 1), MAX_SCAN_LIMIT);

  // Artificial delay for UX (3-6 seconds to simulate scanning)
  const fakeDelay = 3000 + Math.random() * 3000;
  await new Promise(r => setTimeout(r, fakeDelay));

  // Query the master_leads database
  // Use ILIKE for case-insensitive partial matching
  let query = supabase
    .from('master_leads')
    .select('*')
    .ilike('city', `%${cleanCity}%`)
    .ilike('category', `%${cleanCategory}%`)
    .not('phone', 'is', null)
    .limit(cleanLimit);

  const { data: masterResults, error: masterError } = await query;

  if (masterError) {
    console.error('Master query error:', masterError.message);
    return res.status(500).json({ error: 'Database query failed' });
  }

  if (!masterResults || masterResults.length === 0) {
    return res.json({ count: 0, leads: [] });
  }

  // Get existing leads for this user to avoid duplicates
  const { data: existingLeads } = await supabase
    .from('leads')
    .select('name, city')
    .eq('user_id', userId);
  
  const existingSet = new Set((existingLeads || []).map(l => `${l.name}|${l.city}`));

  // Filter out duplicates and copy to user's leads table
  const newLeads = masterResults.filter(ml => !existingSet.has(`${ml.name}|${ml.city}`));
  
  if (newLeads.length > 0) {
    const leadsToInsert = newLeads.map(ml => ({
      user_id: userId,
      name: ml.name,
      city: ml.city,
      category: ml.category,
      phone: ml.phone,
      rating: ml.rating,
      url: ml.url
    }));

    const { error: insertError } = await supabase.from('leads').insert(leadsToInsert);
    if (insertError) {
      console.error('Insert error:', insertError.message);
    }
  }

  console.log(`🔍 Scan for "${cleanCategory}" in "${cleanCity}": ${newLeads.length} new leads served to user ${userId}`);
  res.json({ count: newLeads.length, leads: newLeads });
});

// ============================================================
// API: Get all leads for the authenticated user
// ============================================================
app.get('/api/leads', requireAuth, async (req, res) => {
  const userId = req.authenticatedUser.id; // SECURITY: Use verified ID
  const { data, error } = await supabase.from('leads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Health check (no sensitive info exposed)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// SECURITY: Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// SECURITY: Global error handler (never leak stack traces)
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`LocalViz API running on port ${PORT}`);
  console.log(`Scraping is now handled by the Chrome Extension.`);
});
