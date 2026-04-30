const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key';
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));
const randomDelay = (min = 2000, max = 5000) => delay(Math.floor(Math.random() * (max - min + 1)) + min);

// ============================================================
// ZONE SPLITTING: Google Maps caps at ~120 results per query.
// To get MORE, we split into sub-zone searches automatically.
// ============================================================
const CITY_ZONES = {
  'paris': [
    'Paris 1er', 'Paris 2ème', 'Paris 3ème', 'Paris 4ème', 'Paris 5ème',
    'Paris 6ème', 'Paris 7ème', 'Paris 8ème', 'Paris 9ème', 'Paris 10ème',
    'Paris 11ème', 'Paris 12ème', 'Paris 13ème', 'Paris 14ème', 'Paris 15ème',
    'Paris 16ème', 'Paris 17ème', 'Paris 18ème', 'Paris 19ème', 'Paris 20ème',
  ],
  'lyon': [
    'Lyon 1er', 'Lyon 2ème', 'Lyon 3ème', 'Lyon 4ème', 'Lyon 5ème',
    'Lyon 6ème', 'Lyon 7ème', 'Lyon 8ème', 'Lyon 9ème',
  ],
  'marseille': [
    'Marseille 1er', 'Marseille 2ème', 'Marseille 3ème', 'Marseille 4ème',
    'Marseille 5ème', 'Marseille 6ème', 'Marseille 7ème', 'Marseille 8ème',
    'Marseille 9ème', 'Marseille 10ème', 'Marseille 11ème', 'Marseille 12ème',
    'Marseille 13ème', 'Marseille 14ème', 'Marseille 15ème', 'Marseille 16ème',
  ],
  'nice': [
    'Nice Nord', 'Nice Est', 'Nice Ouest', 'Nice Centre',
    'Nice Vieux-Nice', 'Nice Cimiez', 'Nice Saint-Roch',
    'Nice Libération', 'Nice Riquier', 'Nice Port',
  ],
  'toulouse': [
    'Toulouse Centre', 'Toulouse Saint-Cyprien', 'Toulouse Capitole',
    'Toulouse Compans', 'Toulouse Minimes', 'Toulouse Rangueil',
    'Toulouse Purpan', 'Toulouse Borderouge',
  ],
  'bordeaux': [
    'Bordeaux Centre', 'Bordeaux Bastide', 'Bordeaux Chartrons',
    'Bordeaux Saint-Michel', 'Bordeaux Caudéran', 'Bordeaux Mériadeck',
    'Bordeaux Nansouty', 'Bordeaux Saint-Augustin',
  ],
  'lille': [
    'Lille Centre', 'Lille Vauban', 'Lille Wazemmes',
    'Lille Fives', 'Lille Moulins', 'Lille Bois Blancs',
  ],
  'nantes': [
    'Nantes Centre', 'Nantes Ile de Nantes', 'Nantes Chantenay',
    'Nantes Doulon', 'Nantes Dervallières', 'Nantes Erdre',
  ],
  'strasbourg': [
    'Strasbourg Centre', 'Strasbourg Neudorf', 'Strasbourg Krutenau',
    'Strasbourg Robertsau', 'Strasbourg Koenigshoffen', 'Strasbourg Cronenbourg',
  ],
  'montpellier': [
    'Montpellier Centre', 'Montpellier Antigone', 'Montpellier Aiguelongue',
    'Montpellier Mosson', 'Montpellier Port Marianne', 'Montpellier Hôpitaux-Facultés',
  ],
};

function generateSubZones(city) {
  const cityLower = city.toLowerCase().trim();
  for (const [key, zones] of Object.entries(CITY_ZONES)) {
    if (cityLower === key || cityLower.includes(key)) {
      return [city, ...zones];
    }
  }
  // Unknown city: just search the city itself
  return [city];
}

/**
 * Scroll the Google Maps feed until all results are loaded.
 */
async function scrollToLoadAll(page) {
  let previousCount = 0;
  let staleScrolls = 0;
  const MAX_STALE = 4;
  let totalScrolls = 0;

  while (true) {
    const scrolled = await page.evaluate(() => {
      const selectors = [
        'div[role="feed"]',
        'div[aria-label*="Résultats"]', 'div[aria-label*="Results"]',
        'div[aria-label*="résultats"]', 'div[aria-label*="results"]',
      ];
      let el = null;
      for (const s of selectors) { el = document.querySelector(s); if (el) break; }
      if (!el) {
        const main = document.querySelector('div[role="main"]');
        if (main) {
          for (const child of main.querySelectorAll('div')) {
            if (child.scrollHeight > child.clientHeight && child.clientHeight > 200) { el = child; break; }
          }
        }
      }
      if (el) { el.scrollTop = el.scrollHeight; return true; }
      return false;
    });

    if (!scrolled) break;
    totalScrolls++;
    await randomDelay(600, 1200);

    const endReached = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('span, p, div'));
      return all.some(el => el.innerText && (
        el.innerText.includes("You've reached the end of the list") ||
        el.innerText.includes("fin de la liste") ||
        el.innerText.includes("No more results")
      ));
    });
    if (endReached) break;

    const currentCount = await page.evaluate(() => document.querySelectorAll('a[href*="/maps/place/"]').length);
    if (currentCount > previousCount) { staleScrolls = 0; previousCount = currentCount; }
    else { staleScrolls++; if (staleScrolls >= MAX_STALE) break; }
    if (totalScrolls > 200) break;
  }
  return previousCount;
}

/**
 * Extract business links from the current Google Maps page.
 */
async function extractBusinessLinks(page) {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
    const unique = [];
    const seen = new Set();
    links.forEach(link => {
      const ariaLabel = link.getAttribute('aria-label');
      if (!ariaLabel) return;
      const name = ariaLabel.split(',')[0].trim();
      if (seen.has(name)) return;
      seen.add(name);
      unique.push({ name, url: link.href });
    });
    return unique;
  });
}

/**
 * Deep scan a single business page to extract details.
 */
async function deepScanBusiness(page, business) {
  try {
    await page.goto(business.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await delay(500);

    return page.evaluate(() => {
      const siteNode = document.querySelector('a[data-item-id="authority"]');
      const addressNode = document.querySelector('button[data-item-id="address"]');
      const phoneNode = document.querySelector('button[data-item-id^="phone:tel:"]');

      // Rating
      let exactRating = null;
      const fontLarge = document.querySelector('.fontDisplayLarge');
      if (fontLarge && fontLarge.innerText) exactRating = fontLarge.innerText.trim().replace(',', '.');
      if (!exactRating) {
        const ratingSpan = document.querySelector('span[aria-label*=" stars"], span[aria-label*=" étoiles"]');
        if (ratingSpan) { const m = ratingSpan.getAttribute('aria-label').match(/[\d,\.]+/); if (m) exactRating = m[0].replace(',', '.'); }
      }
      if (!exactRating) {
        const allSpans = Array.from(document.querySelectorAll('span[aria-hidden="true"]'));
        const rm = allSpans.find(s => /^[1-5][.,][0-9]$/.test(s.innerText.trim()));
        if (rm) exactRating = rm.innerText.trim().replace(',', '.');
      }

      // Phone
      let phoneText = null;
      if (phoneNode && phoneNode.getAttribute('aria-label')) phoneText = phoneNode.getAttribute('aria-label');
      if (!phoneText) {
        const allButtons = Array.from(document.querySelectorAll('button[aria-label]'));
        const phoneBtn = allButtons.find(b => { const a = b.getAttribute('aria-label').toLowerCase(); return a.includes('phone:') || a.includes('téléphone'); });
        if (phoneBtn) phoneText = phoneBtn.getAttribute('aria-label');
      }
      if (!phoneText) {
        const copyPhoneBtn = document.querySelector('button[data-tooltip*="phone" i], button[data-tooltip*="téléphone" i]');
        if (copyPhoneBtn && copyPhoneBtn.getAttribute('aria-label')) phoneText = copyPhoneBtn.getAttribute('aria-label');
      }
      if (!phoneText) {
        const allDivs = Array.from(document.querySelectorAll('div, span'));
        const phoneDiv = allDivs.find(d => /(\+33|0)[1-9]([-. ]?[0-9]{2}){4}/.test(d.innerText.trim()));
        if (phoneDiv) { const m = phoneDiv.innerText.trim().match(/(\+33|0)[1-9]([-. ]?[0-9]{2}){4}/); if (m) phoneText = m[0]; }
      }
      if (phoneText) phoneText = phoneText.replace(/Phone: |Téléphone(:)? /i, '').trim();

      // Address
      let addressText = null;
      if (addressNode && addressNode.getAttribute('aria-label')) addressText = addressNode.getAttribute('aria-label');
      if (!addressText) {
        const allButtons = Array.from(document.querySelectorAll('button[aria-label]'));
        const addBtn = allButtons.find(b => { const a = b.getAttribute('aria-label').toLowerCase(); return a.includes('address:') || a.includes('adresse'); });
        if (addBtn) addressText = addBtn.getAttribute('aria-label');
      }
      if (!addressText) {
        const allDivs = Array.from(document.querySelectorAll('div'));
        const addrDiv = allDivs.find(d => d.innerText.includes('France') && (d.innerText.includes('Rue') || d.innerText.includes('Avenue') || d.innerText.includes('Bd ') || d.innerText.includes('Boulevard')));
        if (addrDiv) addressText = addrDiv.innerText.trim().split('\n')[0];
      }
      if (addressText) addressText = addressText.replace(/Address: |Adresse(:)? /i, '').trim();

      // Website
      let siteLink = null;
      if (siteNode) siteLink = siteNode.href;
      if (!siteLink) {
        const allLinks = Array.from(document.querySelectorAll('a'));
        const ext = allLinks.find(a => {
          if (!a.href) return false;
          return (a.href.startsWith('http') && !a.href.includes('google.com') && !a.href.includes('gstatic.com') && !a.href.includes('youtube.com'))
                 || a.href.includes('/url?q=') || a.href.includes('/maps/reserve');
        });
        if (ext) siteLink = ext.href;
      }
      if (!siteLink) {
        const websiteElements = Array.from(document.querySelectorAll('[data-tooltip*="website" i], [data-tooltip*="site" i], [data-tooltip*="booking" i], [data-tooltip*="rendez-vous" i], [aria-label*="website" i], [aria-label*="site web" i], [aria-label*="booking" i], [aria-label*="réserver" i]'));
        const real = websiteElements.find(el => {
          const aria = (el.getAttribute('aria-label') || '').toLowerCase();
          const tooltip = (el.getAttribute('data-tooltip') || '').toLowerCase();
          if (aria.includes('add ') || aria.includes('ajouter ') || tooltip.includes('add ') || tooltip.includes('ajouter ')) return false;
          return true;
        });
        if (real) siteLink = real.href || 'hidden-link';
      }

      return { siteLink, address: addressText, phone: phoneText, rating: exactRating };
    });
  } catch (err) {
    return null;
  }
}

/**
 * Save a lead to demo_leads.json in real-time.
 */
function saveLeadRealtime(newLead) {
  const fs = require('fs');
  const path = require('path');
  try {
    const demoPath = path.join(__dirname, '../../frontend/public/demo_leads.json');
    let existing = [];
    if (fs.existsSync(demoPath)) {
      existing = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
    }
    if (!existing.some(e => e.name === newLead.name && e.city === newLead.city)) {
      fs.writeFileSync(demoPath, JSON.stringify([newLead, ...existing], null, 2));
    }
  } catch(e) {}
}

// ============================================================
// MAIN SCRAPER
// ============================================================
async function scrapeGoogleMaps(city, category, limit = 15) {
  const isWholeFrance = city.toLowerCase().trim() === 'france';
  const subZones = isWholeFrance ? ['France'] : generateSubZones(city);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 Starting scrape for: ${category} in ${city}`);
  console.log(`   Sub-zones to search: ${subZones.length}`);
  console.log(`   Deep scan limit: ${limit} profiles`);
  console.log(`${'='.repeat(60)}`);

  const userAgent = new UserAgent({ deviceCategory: 'desktop' });
  const launchOptions = {
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-software-rasterizer'
    ]
  };
  // Use the Chrome installed in Docker if available
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const browser = await puppeteer.launch(launchOptions);

  const page = await browser.newPage();
  await page.setUserAgent(userAgent.toString());
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.google.com', ['geolocation']);
  await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

  const results = [];
  const allBusinesses = new Map(); // name -> {name, url} for deduplication

  try {
    // Set cookies once
    await page.goto('https://www.google.com/404', { waitUntil: 'domcontentloaded' }).catch(()=>null);
    await page.setCookie(
      { name: 'CONSENT', value: 'YES+cb.20230101-11-p0.en+FX+410', domain: '.google.com', path: '/', expires: Date.now() / 1000 + 3600 * 24 * 365 },
      { name: 'SOCS', value: 'CAESHAgBEhJnd3NfMjAyMzA4MTAtMF9SQzIaAmVuIAEaBgiA_LyaBg', domain: '.google.com', path: '/', expires: Date.now() / 1000 + 3600 * 24 * 365 }
    );

    // ===== PHASE 1: DISCOVER businesses from all sub-zones =====
    for (let z = 0; z < subZones.length; z++) {
      const zone = subZones[z];
      const query = isWholeFrance ? `${category} en France` : `${category} à ${zone}, France`;
      console.log(`\n🌍 [Zone ${z+1}/${subZones.length}] Searching: ${query}`);

      let searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=en&gl=FR`;
      if (isWholeFrance) {
        searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/@46.2276,2.2137,6z?hl=en&gl=FR`;
      }

      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 15000 }).catch(()=>null);
      await delay(2000);

      // Accept cookies if shown
      try {
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const acceptBtn = buttons.find(b => b.textContent.toLowerCase().includes('accept all') || b.textContent.toLowerCase().includes('tout accepter'));
          if (acceptBtn) acceptBtn.click();
        });
        await delay(1000);
      } catch(e) {}

      if (z === 0) {
        await page.screenshot({ path: 'debug_scraper.png' });
        console.log("📸 Saved debug screenshot");
      }

      await delay(2000);

      // Scroll to load all results for this zone
      await scrollToLoadAll(page);

      // Extract business links
      const zoneBusinesses = await extractBusinessLinks(page);
      let newInZone = 0;
      for (const b of zoneBusinesses) {
        if (!allBusinesses.has(b.name)) {
          allBusinesses.set(b.name, b);
          newInZone++;
        }
      }

      console.log(`   📊 Found ${zoneBusinesses.length} in zone, ${newInZone} new unique. Total unique: ${allBusinesses.size}`);

      // Small delay between zones to avoid rate limiting
      if (z < subZones.length - 1) {
        await randomDelay(1000, 2000);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 DISCOVERY COMPLETE: ${allBusinesses.size} unique businesses found across ${subZones.length} zones`);
    console.log(`${'='.repeat(60)}`);

    // ===== PHASE 2: DEEP SCAN each business =====
    const businessList = Array.from(allBusinesses.values());
    const maxToScan = Math.min(businessList.length, limit);
    console.log(`\n🔬 Deep scanning ${maxToScan} businesses...\n`);

    for (let i = 0; i < maxToScan; i++) {
      const b = businessList[i];
      console.log(`[${i+1}/${maxToScan}] Inspecting: ${b.name}`);

      const details = await deepScanBusiness(page, b);
      if (!details) {
        console.log(`  -> ⏩ Timeout, skipping.`);
        continue;
      }

      if (details.siteLink) {
        console.log(`  -> ❌ Has website`);
        continue;
      }

      console.log(`  -> ✅ No website found`);

      if (!details.phone) {
        console.log(`  -> ⏭️  Skipped: No phone number`);
        continue;
      }

      const newLead = {
        name: b.name,
        city,
        category,
        has_website: false,
        url: b.url,
        address: details.address || city,
        phone: details.phone,
        rating: details.rating || "N/A",
      };
      results.push(newLead);
      saveLeadRealtime(newLead);
      console.log(`  -> 💾 Lead #${results.length} saved! (${newLead.phone})`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ SCAN COMPLETE`);
    console.log(`   Discovered: ${allBusinesses.size} businesses across ${subZones.length} zones`);
    console.log(`   Deep-scanned: ${maxToScan}`);
    console.log(`   Qualified leads: ${results.length}`);
    console.log(`${'='.repeat(60)}\n`);

    // Final save to file
    if (results.length > 0) {
      const fs = require('fs');
      const path = require('path');
      try {
        const demoPath = path.join(__dirname, '../../frontend/public/demo_leads.json');
        let existing = [];
        if (fs.existsSync(demoPath)) existing = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
        const allLeads = [...results, ...existing].filter((v,i,a)=>a.findIndex(t=>(t.name === v.name && t.city === v.city))===i);
        fs.writeFileSync(demoPath, JSON.stringify(allLeads, null, 2));
        console.log(`💾 Saved ${results.length} leads to local file!`);
      } catch (err) {
        console.log("Could not save to local demo file", err);
      }

      const { error } = await supabase.from('businesses').upsert(results, { onConflict: 'name,city' });
      if (error) console.error('Supabase error (expected if mock):', error.message);
    }

    return results.length;

  } catch (error) {
    console.error(`Error during scraping:`, error);
    return 0;
  } finally {
    if (browser) await browser.close();
  }
}

async function runScraperQueue(targets) {
  let total = 0;
  for (const target of targets) {
    total += await scrapeGoogleMaps(target.city, target.category, target.limit);
    if (targets.length > 1) {
      console.log('Waiting before next target...');
      await randomDelay(2000, 5000);
    }
  }
  return total;
}

module.exports = { runScraperQueue, scrapeGoogleMaps };
