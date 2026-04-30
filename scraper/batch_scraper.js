#!/usr/bin/env node
/**
 * ============================================================
 * BATCH SCRAPER - One-time massive scraping to populate master_leads
 * 
 * Usage:  node batch_scraper.js
 * 
 * This will scrape ALL cities x ALL categories and save results
 * directly into the Supabase `master_leads` table.
 * 
 * You can stop and restart at any time - it skips combos that
 * already have data in the database.
 * ============================================================
 */
require('dotenv').config();
const { scrapeGoogleMaps } = require('./src/scraper');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================================
// ALL TARGET CITIES (Top 50+ French cities by population)
// ============================================================
const CITIES = [
  // Tier 1: Mega cities
  'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice',
  'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille',
  // Tier 2: Large cities
  'Rennes', 'Reims', 'Saint-Étienne', 'Toulon', 'Le Havre',
  'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne',
  'Clermont-Ferrand', 'Le Mans', 'Aix-en-Provence', 'Brest', 'Tours',
  'Amiens', 'Limoges', 'Annecy', 'Perpignan', 'Boulogne-Billancourt',
  // Tier 3: Medium cities
  'Metz', 'Besançon', 'Orléans', 'Rouen', 'Mulhouse',
  'Caen', 'Nancy', 'Argenteuil', 'Saint-Denis', 'Montreuil',
  'Roubaix', 'Tourcoing', 'Avignon', 'Dunkerque', 'Poitiers',
  'Versailles', 'Pau', 'La Rochelle', 'Calais', 'Cannes',
  'Antibes', 'Béziers', 'Ajaccio', 'Bastia', 'Colmar',
  // Tier 4: Small cities (for broader coverage)
  'Troyes', 'Chambéry', 'Valence', 'Quimper', 'Lorient',
  'Vannes', 'Bayonne', 'Cholet', 'Charleville-Mézières', 'Laval',
  'Bourges', 'Épinal', 'Saint-Nazaire', 'Niort', 'Auxerre',
];

// ============================================================
// ALL TARGET CATEGORIES (Most common service businesses)
// ============================================================
const CATEGORIES = [
  // Construction & Home services
  'Plombier', 'Électricien', 'Serrurier', 'Couvreur',
  'Peintre en bâtiment', 'Maçon', 'Menuisier', 'Carreleur',
  'Chauffagiste', 'Climatisation',
  // Personal services
  'Coiffeur', 'Barbier', 'Salon de beauté', 'Tatoueur',
  'Coach sportif', 'Photographe',
  // Auto
  'Garage automobile', 'Carrossier', 'Contrôle technique',
  // Food
  'Boulangerie', 'Boucherie', 'Pizzeria', 'Kebab', 'Traiteur',
  // Health
  'Dentiste', 'Kinésithérapeute', 'Ostéopathe', 'Podologue',
  // Pro services
  'Avocat', 'Comptable', 'Architecte', 'Agent immobilier',
  // Other
  'Fleuriste', 'Jardinier', 'Pressing', 'Déménageur',
  'Dépanneur informatique', 'Vétérinaire',
];

// ============================================================
// PROGRESS TRACKING
// ============================================================
async function getExistingCombos() {
  // Get all city+category combos that already have data
  const { data, error } = await supabase
    .from('master_leads')
    .select('city, category')
    .limit(50000);
  
  if (error) {
    console.error('Error fetching existing combos:', error.message);
    return new Set();
  }
  
  const combos = new Set();
  if (data) {
    for (const row of data) {
      combos.add(`${row.city.toLowerCase()}|${row.category.toLowerCase()}`);
    }
  }
  return combos;
}

async function saveMasterLeads(leads, city, category) {
  if (!leads || leads.length === 0) return 0;
  
  const masterLeads = leads.map(l => ({
    name: l.name,
    city: city,
    category: category,
    phone: l.phone || null,
    address: l.address || null,
    rating: l.rating || null,
    url: l.url || null,
    scraped_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('master_leads')
    .upsert(masterLeads, { onConflict: 'name,city', ignoreDuplicates: true });

  if (error) {
    console.error(`   ❌ DB Error: ${error.message}`);
    return 0;
  }
  
  return masterLeads.length;
}

// ============================================================
// MAIN BATCH PROCESS
// ============================================================
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🏭 LOCALVIZ BATCH SCRAPER');
  console.log(`   ${CITIES.length} cities × ${CATEGORIES.length} categories = ${CITIES.length * CATEGORIES.length} combinations`);
  console.log('   This will take several hours. You can stop and restart safely.');
  console.log('='.repeat(70) + '\n');

  // Check what's already been scraped
  const existingCombos = await getExistingCombos();
  console.log(`📊 Already scraped combos in database: ${existingCombos.size}\n`);

  let totalLeads = 0;
  let totalCombos = 0;
  let skippedCombos = 0;
  const startTime = Date.now();

  for (let ci = 0; ci < CITIES.length; ci++) {
    const city = CITIES[ci];
    
    for (let ca = 0; ca < CATEGORIES.length; ca++) {
      const category = CATEGORIES[ca];
      const comboKey = `${city.toLowerCase()}|${category.toLowerCase()}`;
      totalCombos++;

      // Skip if already scraped
      if (existingCombos.has(comboKey)) {
        skippedCombos++;
        continue;
      }

      const progress = `[${totalCombos}/${CITIES.length * CATEGORIES.length}]`;
      console.log(`\n${progress} 🔍 Scraping: "${category}" in "${city}"...`);

      try {
        // Use the existing scraper with limit of 20 per combo
        const count = await scrapeGoogleMaps(city, category, 20, []);
        
        // The scraper already saves to demo_leads.json, 
        // but we need to also save to master_leads in Supabase.
        // Read the leads just scraped from demo_leads.json
        const fs = require('fs');
        const path = require('path');
        const demoPath = path.join(__dirname, '../frontend/public/demo_leads.json');
        
        if (fs.existsSync(demoPath)) {
          const allLeads = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
          // Filter to only the leads for this city+category
          const relevantLeads = allLeads.filter(l => 
            l.city && l.city.toLowerCase() === city.toLowerCase() && 
            l.category && l.category.toLowerCase() === category.toLowerCase()
          );
          
          const saved = await saveMasterLeads(relevantLeads, city, category);
          totalLeads += saved;
          console.log(`   ✅ ${saved} leads saved to master_leads (Total: ${totalLeads})`);
        }

      } catch (err) {
        console.error(`   ❌ Error scraping ${category} in ${city}:`, err.message);
      }

      // Wait between combos to not overwhelm Google
      const waitMs = 5000 + Math.random() * 5000; // 5-10 seconds
      console.log(`   ⏳ Waiting ${Math.round(waitMs/1000)}s before next...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000 / 60);
  console.log('\n' + '='.repeat(70));
  console.log('🏁 BATCH SCRAPING COMPLETE');
  console.log(`   Total time: ${elapsed} minutes`);
  console.log(`   Combos processed: ${totalCombos - skippedCombos} (${skippedCombos} skipped)`);
  console.log(`   Total leads saved: ${totalLeads}`);
  console.log('='.repeat(70) + '\n');
}

main().catch(console.error);
