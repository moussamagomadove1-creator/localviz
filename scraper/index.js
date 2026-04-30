require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { runScraperQueue } = require('./src/scraper');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

// Export so scraper.js can push leads here too
module.exports.leadsStore = leadsStore;
module.exports.addLead = function(lead) {
  if (!leadsStore.some(e => e.name === lead.name && e.city === lead.city)) {
    leadsStore.unshift(lead);
    // Persist to file
    try {
      fs.writeFileSync(path.join(__dirname, 'leads_data.json'), JSON.stringify(leadsStore, null, 2));
    } catch(e) {}
  }
};

// API route to manually trigger a scrape
app.post('/api/scrape', async (req, res) => {
  const { city, category, limit } = req.body;
  if (!city || !category) {
    return res.status(400).json({ error: 'City and category are required' });
  }

  try {
    const totalFound = await runScraperQueue([{ city, category, limit: limit || 15 }]);
    res.json({ message: `Scan completed`, count: totalFound });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

// API route to get all leads
app.get('/api/leads', (req, res) => {
  res.json(leadsStore);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), leadsCount: leadsStore.length });
});

// Cron disabled on free tier (512MB RAM limit)
// Uncomment on a paid plan with more memory
// cron.schedule('0 3 * * *', () => {
//   console.log('Running daily scheduled scraper...');
//   const targets = [
//     { city: 'Paris', category: 'Plumber' },
//     { city: 'Lyon', category: 'Bakery' },
//   ];
//   runScraperQueue(targets).catch(console.error);
// });

app.listen(PORT, () => {
  console.log(`Scraper service running on port ${PORT}`);
});
