require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================================
// JOB QUEUE - Website creates jobs, local PC executes them
// ============================================================
let jobQueue = [];
let jobIdCounter = 1;

// Website calls this to start a scan → creates a job for the local worker
app.post('/api/scrape', async (req, res) => {
  const { city, category, limit, userId } = req.body;
  if (!city || !category) {
    return res.status(400).json({ error: 'City and category are required' });
  }
  
  // Find existing leads for this user to avoid duplicates by querying Supabase
  let existingNames = [];
  if (userId) {
    const { data } = await supabase.from('leads').select('name').eq('user_id', userId);
    if (data) existingNames = data.map(d => d.name);
  }

  const job = {
    id: jobIdCounter++,
    city,
    category,
    limit: limit || 15,
    userId: userId || 'anonymous',
    existingLeads: existingNames,
    status: 'pending',    // pending → running → done
    count: 0,
    createdAt: new Date()
  };
  jobQueue.push(job);
  console.log(`📋 Job #${job.id} created: ${category} in ${city} (limit: ${job.limit}, user: ${job.userId})`);
  res.json({ message: 'Scan queued', jobId: job.id, status: 'pending' });
});

// Local worker polls this to get pending jobs
app.get('/api/jobs/pending', (req, res) => {
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
app.post('/api/jobs/:id/complete', async (req, res) => {
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

// API route to get all leads
app.get('/api/leads', async (req, res) => {
  const userId = req.query.userId;
  if (userId) {
    const { data, error } = await supabase.from('leads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } else {
    res.json([]);
  }
});

// API route to receive leads pushed from local scraper
app.post('/api/leads/push', (req, res) => {
  const { leads } = req.body;
  if (!leads || !Array.isArray(leads)) {
    return res.status(400).json({ error: 'leads array is required' });
  }
  let added = 0;
  for (const lead of leads) {
    if (!leadsStore.some(e => e.name === lead.name && e.city === lead.city)) {
      leadsStore.unshift(lead);
      added++;
    }
  }
  try {
    fs.writeFileSync(path.join(__dirname, 'leads_data.json'), JSON.stringify(leadsStore, null, 2));
  } catch(e) {}
  res.json({ message: `${added} new leads added`, total: leadsStore.length });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), leadsCount: leadsStore.length, pendingJobs: jobQueue.filter(j => j.status === 'pending').length });
});

app.listen(PORT, () => {
  console.log(`Scraper service running on port ${PORT}`);
  console.log(`Waiting for local worker to connect...`);
});
