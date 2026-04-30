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
// SECURITY: Worker API Key (shared secret between server & worker)
// ============================================================
const WORKER_SECRET = process.env.WORKER_SECRET || 'localviz-worker-secret-2026';

function requireWorkerAuth(req, res, next) {
  const token = req.headers['x-worker-key'];
  if (token !== WORKER_SECRET) {
    return res.status(403).json({ error: 'Unauthorized: invalid worker key' });
  }
  next();
}

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
// SECURITY: Per-user scan cooldown & daily limit
// ============================================================
const userScanHistory = new Map(); // userId -> { lastScan: timestamp, dailyCount: number, dayStart: timestamp }
const SCAN_COOLDOWN = 30 * 1000; // 30 seconds between scans
const MAX_DAILY_SCANS = 50; // max 50 scans per day

// ============================================================
// JOB QUEUE - Website creates jobs, local PC executes them
// ============================================================
let jobQueue = [];
let jobIdCounter = 1;

// Website calls this to start a scan → creates a job for the local worker
app.post('/api/scrape', requireAuth, async (req, res) => {
  const { city, category, limit } = req.body;
  const userId = req.authenticatedUser.id; // SECURITY: Use verified user ID, not what the client sends
  
  // SECURITY: Validate required fields
  if (!city || !category) {
    return res.status(400).json({ error: 'City and category are required' });
  }

  // SECURITY: Sanitize inputs
  const cleanCity = sanitize(city, 100);
  const cleanCategory = sanitize(category, 100);
  
  // SECURITY: Cap the limit to prevent abuse (max 200 profiles per scan)
  const MAX_SCAN_LIMIT = 200;
  const cleanLimit = Math.min(Math.max(parseInt(limit) || 15, 1), MAX_SCAN_LIMIT);
  
  // SECURITY: Per-user scan cooldown & daily limit
  const now = Date.now();
  const history = userScanHistory.get(userId) || { lastScan: 0, dailyCount: 0, dayStart: now };
  
  // Reset daily count if new day
  if (now - history.dayStart > 24 * 60 * 60 * 1000) {
    history.dailyCount = 0;
    history.dayStart = now;
  }
  
  // Check cooldown
  if (now - history.lastScan < SCAN_COOLDOWN) {
    const wait = Math.ceil((SCAN_COOLDOWN - (now - history.lastScan)) / 1000);
    return res.status(429).json({ error: `Please wait ${wait} seconds before launching another scan.` });
  }
  
  // Check daily limit
  if (history.dailyCount >= MAX_DAILY_SCANS) {
    return res.status(429).json({ error: `Daily scan limit reached (${MAX_DAILY_SCANS}). Try again tomorrow.` });
  }
  
  // Update history
  history.lastScan = now;
  history.dailyCount++;
  userScanHistory.set(userId, history);
  
  // Find existing leads for this user to avoid duplicates by querying Supabase
  let existingNames = [];
  if (userId) {
    const { data } = await supabase.from('leads').select('name').eq('user_id', userId);
    if (data) existingNames = data.map(d => d.name);
  }

  const job = {
    id: jobIdCounter++,
    city: cleanCity,
    category: cleanCategory,
    limit: cleanLimit,
    userId: userId,
    existingLeads: existingNames,
    status: 'pending',    // pending → running → done
    count: 0,
    createdAt: new Date()
  };
  jobQueue.push(job);
  console.log(`📋 Job #${job.id} created: ${cleanCategory} in ${cleanCity} (limit: ${cleanLimit}, user: ${userId})`);
  res.json({ message: 'Scan queued', jobId: job.id, status: 'pending' });
});

// Local worker polls this to get pending jobs (PROTECTED)
app.get('/api/jobs/pending', requireWorkerAuth, (req, res) => {
  const pending = jobQueue.find(j => j.status === 'pending');
  if (pending) {
    pending.status = 'running';
    console.log(`🔄 Job #${pending.id} picked up by local worker`);
    res.json(pending);
  } else {
    res.json(null);
  }
});

// Local worker calls this when a job is done
app.post('/api/jobs/:id/complete', requireWorkerAuth, async (req, res) => {
  const jobId = parseInt(req.params.id);
  const { count, leads } = req.body;
  const job = jobQueue.find(j => j.id === jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  job.status = 'done';
  job.count = count || 0;
  console.log(`✅ Job #${job.id} completed: ${job.count} leads found`);

  // Add leads to store, attaching the userId
  if (leads && Array.isArray(leads) && leads.length > 0) {
    const leadsToInsert = leads.map(l => ({
      user_id: job.userId,
      name: l.name,
      city: l.city,
      category: l.category || job.category,
      phone: l.phone || null,
      rating: l.rating || null,
      url: l.url || null
    }));

    const { error } = await supabase.from('leads').insert(leadsToInsert);
    if (error) {
      console.error("❌ Failed to save leads to Supabase:", error.message);
    } else {
      console.log(`💾 ${leadsToInsert.length} new leads saved for user ${job.userId} in Supabase`);
    }
  }

  res.json({ message: 'Job completed', count: job.count });
});

// Frontend polls this to check scan progress
app.get('/api/jobs/:id/status', (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = jobQueue.find(j => j.id === jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ status: job.status, count: job.count });
});

// API route to get all leads (PROTECTED: user can only see their own)
app.get('/api/leads', requireAuth, async (req, res) => {
  const userId = req.authenticatedUser.id; // SECURITY: Use verified ID
  const { data, error } = await supabase.from('leads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Health check (no sensitive info exposed)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), pendingJobs: jobQueue.filter(j => j.status === 'pending').length });
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
  console.log(`Scraper service running on port ${PORT}`);
  console.log(`Waiting for local worker to connect...`);
});
