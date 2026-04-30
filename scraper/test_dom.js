const puppeteer = require('puppeteer');
const fs = require('fs');

async function test() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('https://www.google.com/maps/search/Plumber+in+Paris,+France', { waitUntil: 'networkidle2' });
  
  // Accept cookies if present (French version: 'Tout accepter')
  try {
    const btn = await page.$('button[aria-label="Tout accepter"]');
    if (btn) await btn.click();
    await page.waitForTimeout(2000);
  } catch (e) {}
  
  const html = await page.content();
  fs.writeFileSync('dom.html', html);
  
  await browser.close();
  console.log('Done');
}
test();
