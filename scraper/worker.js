/**
 * LOCAL WORKER - Run this on your PC to process scan jobs from the website
 * 
 * How it works:
 *   1. You click "Start Extraction" on https://localviz.vercel.app/dashboard
 *   2. This worker picks up the job automatically
 *   3. Your PC runs the scraping (unlimited RAM!)
 *   4. Results appear on the website
 * 
 * Usage: node worker.js
 * Keep this running in the background while you use the website!
 */

const { runScraperQueue } = require('./src/scraper');
const fs = require('fs');
const path = require('path');

const ONLINE_API = 'https://localviz-scraper.onrender.com';
const POLL_INTERVAL = 5000; // Check every 5 seconds

console.log(`\n${'='.repeat(50)}`);
console.log(`🖥️  LOCAL WORKER STARTED`);
console.log(`   Connected to: ${ONLINE_API}`);
console.log(`   Polling every ${POLL_INTERVAL/1000}s for new jobs`);
console.log(`${'='.repeat(50)}`);
console.log(`\n💡 Now go to https://localviz.vercel.app/dashboard`);
console.log(`   Click "Scraping Engine" and launch a scan!`);
console.log(`   This worker will execute it automatically.\n`);

async function checkForJobs() {
  try {
    const res = await fetch(`${ONLINE_API}/api/jobs/pending`);
    const job = await res.json();
    
    if (!job) return; // No pending jobs
    
    console.log(`\n🚀 JOB RECEIVED #${job.id}: ${job.category} in ${job.city} (limit: ${job.limit})`);
    console.log(`   Executing with full local power...\n`);
    
    // Run the scraper locally
    const count = await runScraperQueue([{ 
      city: job.city, 
      category: job.category, 
      limit: job.limit,
      existingLeads: job.existingLeads || []
    }]);
    
    // Read the leads that were saved
    let leads = [];
    const demoPath = path.join(__dirname, '../frontend/public/demo_leads.json');
    if (fs.existsSync(demoPath)) {
      const allLeads = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
      // Only send leads matching this job's city, and exclude ones that were already existing
      leads = allLeads.filter(l => l.city.toLowerCase() === job.city.toLowerCase() && !(job.existingLeads || []).includes(l.name));
    }
    
    // Report completion + send leads back
    console.log(`\n☁️  Pushing ${leads.length} leads to online server...`);
    const completeRes = await fetch(`${ONLINE_API}/api/jobs/${job.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count, leads })
    });
    const result = await completeRes.json();
    console.log(`✅ Job #${job.id} completed! ${result.message}`);
    console.log(`\n⏳ Waiting for next job...\n`);
    
  } catch(e) {
    // Server might be sleeping (cold start), silently retry
    if (!e.message.includes('fetch failed')) {
      console.error('Worker error:', e.message);
    }
  }
}

// Poll continuously
setInterval(checkForJobs, POLL_INTERVAL);
checkForJobs(); // Check immediately on start
