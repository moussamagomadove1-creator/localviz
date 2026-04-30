require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { runScraperQueue } = require('./src/scraper');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Schedule the scraper to run every 24 hours at 3:00 AM
cron.schedule('0 3 * * *', () => {
  console.log('Running daily scheduled scraper...');
  
  // List of default targets to scan daily
  const targets = [
    { city: 'Paris', category: 'Plumber' },
    { city: 'Lyon', category: 'Bakery' },
    { city: 'Marseille', category: 'Garage' },
    // Add more as needed
  ];
  
  runScraperQueue(targets).catch(console.error);
});

app.listen(PORT, () => {
  console.log(`Scraper service running on port ${PORT}`);
});
