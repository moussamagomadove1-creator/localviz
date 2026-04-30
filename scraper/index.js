require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// In-memory leads storage (loaded from file on start if available)
let leadsStore = [];
try {
  const demoPath = path.join(__dirname, 'leads_data.json');
  if (fs.existsSync(demoPath)) {
    leadsStore = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
  }
} catch(e) {
  console.log('No existing leads file, starting fresh.');
}

// ============================================================
// JOB QUEUE - Website creates jobs, local PC executes them
// ============================================================
let jobQueue = [];
let jobIdCounter = 1;

// Website calls this to start a scan → creates a job for the local worker
app.post('/api/scrape', (req, res) => {
  const { city, category, limit, userId } = req.body;
  if (!city || !category) {
    return res.status(400).json({ error: 'City and category are required' });
  }
  
  // Find existing leads for this user to avoid duplicates
  const userLeads = userId ? leadsStore.filter(l => l.userId === userId) : [];
  const existingNames = userLeads.map(l => l.name);

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
app.post('/api/jobs/:id/complete', (req, res) => {
  const jobId = parseInt(req.params.id);
  const { count, leads } = req.body;
  const job = jobQueue.find(j => j.id === jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  
  job.status = 'done';
  job.count = count || 0;
  console.log(`✅ Job #${job.id} completed: ${job.count} leads found`);

  // Add leads to store, attaching the userId
  if (leads && Array.isArray(leads)) {
    let added = 0;
    for (const lead of leads) {
      if (!leadsStore.some(e => e.name === lead.name && e.city === lead.city && e.userId === job.userId)) {
        lead.userId = job.userId;
        leadsStore.unshift(lead);
        added++;
      }
    }
    if (added > 0) {
      try {
        fs.writeFileSync(path.join(__dirname, 'leads_data.json'), JSON.stringify(leadsStore, null, 2));
      } catch(e) {}
    }
    console.log(`💾 ${added} new leads saved for user ${job.userId} (total: ${leadsStore.length})`);
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
app.get('/api/leads', (req, res) => {
  const userId = req.query.userId;
  if (userId) {
    res.json(leadsStore.filter(l => l.userId === userId));
  } else {
    // Legacy support or admin
    res.json(leadsStore);
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
