/**
 * LOCAL SCRAPER - Run this on your PC for heavy scraping
 * Results are automatically pushed to the online API
 * 
 * Usage: node local_scan.js "Nice" "Boulangerie" 50
 */

const { runScraperQueue } = require('./src/scraper');

const ONLINE_API = 'https://localviz-scraper.onrender.com';

const city = process.argv[2] || 'Paris';
const category = process.argv[3] || 'Plumber';
const limit = parseInt(process.argv[4]) || 15;

console.log(`\n🖥️  LOCAL SCRAPER MODE`);
console.log(`   City: ${city}`);
console.log(`   Category: ${category}`);
console.log(`   Limit: ${limit}`);
console.log(`   Results will be pushed to: ${ONLINE_API}\n`);

async function pushLeadsOnline(leads) {
  try {
    const res = await fetch(`${ONLINE_API}/api/leads/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads })
    });
    const data = await res.json();
    console.log(`\n☁️  PUSHED TO ONLINE: ${data.message} (Total online: ${data.total})`);
  } catch(e) {
    console.error('Failed to push online:', e.message);
  }
}

async function main() {
  await runScraperQueue([{ city, category, limit }]);
  
  // Read the leads that were saved locally
  const fs = require('fs');
  const path = require('path');
  const demoPath = path.join(__dirname, '../frontend/public/demo_leads.json');
  
  if (fs.existsSync(demoPath)) {
    const leads = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
    console.log(`\n📦 Found ${leads.length} total local leads`);
    await pushLeadsOnline(leads);
  }
  
  console.log(`\n✅ Done! Check your dashboard: https://localviz.vercel.app/dashboard`);
}

main().catch(console.error);
