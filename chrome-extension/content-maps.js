(async function() {
  const hash = window.location.hash;
  if (!hash.includes('localviz-limit=')) return; // Not started by us

  const limitMatch = hash.match(/localviz-limit=(\d+)/);
  const limit = limitMatch ? parseInt(limitMatch[1], 10) : 10;
  
  // Clean hash so it doesn't run again on reload
  window.history.replaceState(null, null, ' ');

  console.log(`[LocalViz] Starting scan with limit ${limit}`);
  
  const delay = (ms) => new Promise(res => setTimeout(res, ms));
  
  // Wait for initial load
  await delay(3000);

  // Extract city and category from search box if possible
  const searchBox = document.querySelector('#searchboxinput');
  let categoryStr = "N/A", cityStr = "N/A";
  if (searchBox) {
    const val = searchBox.value || "";
    if (val.includes(" à ")) {
      [categoryStr, cityStr] = val.split(" à ");
    } else {
      categoryStr = val;
    }
  }

  const results = [];
  const resultsElements = [];
  const processedUrls = new Set();
  
  // Accept cookies if present
  const cookieBtn = document.querySelector('button[aria-label*="Tout accepter"], button[aria-label*="Accept all"]');
  if (cookieBtn) cookieBtn.click();
  await delay(1000);

  let noNewResultsCount = 0;

  // 1. SCROLL AND COLLECT LINKS
  while (resultsElements.length < limit && noNewResultsCount < 5) {
    chrome.runtime.sendMessage({ type: 'SCAN_PROGRESS', payload: { status: `Scrolling... (${resultsElements.length}/${limit})`, count: results.length } });
    
    const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
    let added = 0;
    for (const link of links) {
      if (!processedUrls.has(link.href)) {
        processedUrls.add(link.href);
        resultsElements.push(link);
        added++;
      }
    }
    
    if (added === 0) {
      noNewResultsCount++;
    } else {
      noNewResultsCount = 0;
    }

    if (resultsElements.length >= limit) break;

    const feed = document.querySelector('div[role="feed"]');
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
      await delay(2000);
    } else {
      // Maybe no feed, end of results?
      noNewResultsCount++;
      await delay(1000);
    }
  }

  const elementsToProcess = resultsElements.slice(0, limit);
  console.log(`[LocalViz] Collected ${elementsToProcess.length} places. Starting deep scan...`);

  // 2. DEEP SCAN EACH URL
  for (let i = 0; i < elementsToProcess.length; i++) {
    const el = elementsToProcess[i];
    const url = el.href;
    chrome.runtime.sendMessage({ type: 'SCAN_PROGRESS', payload: { status: `Inspecting ${i+1}/${elementsToProcess.length}...`, count: results.length } });
    
    // Click the element to load details in sidebar without reloading page
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(500);
    el.click();
    
    // Wait for the place details to load (look for h1)
    let loaded = false;
    for (let w = 0; w < 10; w++) {
      await delay(500);
      if (document.querySelector('h1')) {
        loaded = true;
        break;
      }
    }
    await delay(1000); // extra wait for DOM to settle

    // Extract details
    const name = document.querySelector('h1')?.innerText?.trim() || 'Unknown';
    
    const siteNode = document.querySelector('a[data-item-id="authority"]');
    let siteLink = siteNode ? siteNode.href : null;
    if (!siteLink) {
        const ext = Array.from(document.querySelectorAll('a')).find(a => a.href && (a.href.startsWith('http') && !a.href.includes('google') && !a.href.includes('youtube')));
        if (ext) siteLink = ext.href;
    }

    if (siteLink) {
      console.log(`[LocalViz] Skip ${name}: Has website`);
      continue;
    }

    let phoneText = null;
    const phoneNode = document.querySelector('button[data-item-id^="phone:tel:"]');
    if (phoneNode) phoneText = phoneNode.getAttribute('aria-label');
    if (!phoneText) {
      const allDivs = Array.from(document.querySelectorAll('div, span'));
      const phoneDiv = allDivs.find(d => /(\+33|0)[1-9]([-. ]?[0-9]{2}){4}/.test(d.innerText.trim()));
      if (phoneDiv) { const m = phoneDiv.innerText.trim().match(/(\+33|0)[1-9]([-. ]?[0-9]{2}){4}/); if (m) phoneText = m[0]; }
    }
    if (phoneText) phoneText = phoneText.replace(/Phone: |Téléphone(:)? /i, '').trim();

    if (!phoneText) {
      console.log(`[LocalViz] Skip ${name}: No phone`);
      continue;
    }

    let addressText = null;
    const addressNode = document.querySelector('button[data-item-id="address"]');
    if (addressNode) addressText = addressNode.getAttribute('aria-label');
    if (addressText) addressText = addressText.replace(/Address: |Adresse(:)? /i, '').trim();

    results.push({
      name,
      city: cityStr,
      category: categoryStr,
      address: addressText || 'N/A',
      phone: phoneText,
      has_website: false,
      url: url,
      rating: "N/A"
    });
    
    console.log(`[LocalViz] Saved ${name} - ${phoneText}`);
    
    // Go back to the search results feed
    const backBtn = document.querySelector('button[aria-label="Retour"], button[aria-label="Back"]');
    if (backBtn) {
      backBtn.click();
      await delay(1000); // wait for feed to reappear
    }
  }

  // 3. DONE, send results
  chrome.runtime.sendMessage({ type: 'SCAN_COMPLETE', payload: { count: results.length, leads: results } });
  console.log(`[LocalViz] Scan complete! Found ${results.length} leads.`);
  
})();
