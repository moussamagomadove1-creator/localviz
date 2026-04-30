'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';

// SVG Icons
const Icons = {
  Home: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Bookmark: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  CreditCard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>,
  LogOut: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Alert: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
  MapPin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Filter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('overview');
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedLeads, setSavedLeads] = useState([]);
  const [trashedLeads, setTrashedLeads] = useState([]);
  const [isPro, setIsPro] = useState(false); // Free plan by default

  const [scanState, setScanState] = useState('idle'); // 'idle' | 'scanning' | 'done'
  const [scanResult, setScanResult] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Scraping form state
  const [scrapeCity, setScrapeCity] = useState('Paris');
  const [scrapeCategory, setScrapeCategory] = useState('Plumber');
  const [scrapeLimit, setScrapeLimit] = useState(15);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');

  const fetchRealData = async (isRefresh = false) => {
    try {
      // Try fetching from the backend API first
      const apiRes = await fetch(`${API_URL}/api/leads`).catch(() => null);
      if (apiRes && apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData && apiData.length > 0) {
          setBusinesses(apiData);
          if (!isRefresh) setTimeout(() => setLoading(false), 800);
          return;
        }
      }
    } catch(e) {
      console.log('API not reachable, falling back to local data');
    }
    // Fallback to local demo_leads.json
    try {
      const res = await fetch('/demo_leads.json?t=' + Date.now());
      if (res.ok) {
        const localData = await res.json();
        if (localData && localData.length > 0) {
          setBusinesses(localData);
        }
      }
    } catch(e) {
      console.error("Failed to load data", e);
    }
    if (!isRefresh) {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    // Check if user is admin to grant Pro access
    const userStr = localStorage.getItem('localviz_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.email === 'admin@localviz.com' || user.role === 'admin') {
          setIsPro(true);
        }
      } catch (e) {}
    }

    // Load saved leads from localStorage
    const stored = localStorage.getItem('localviz_saved_leads');
    if (stored) {
      try {
        setSavedLeads(JSON.parse(stored));
      } catch (e) {}
    }

    // Load trashed leads from localStorage
    const storedTrash = localStorage.getItem('localviz_trashed_leads');
    if (storedTrash) {
      try {
        setTrashedLeads(JSON.parse(storedTrash));
      } catch (e) {}
    }

    fetchRealData();
  }, []);

  const viewResults = async () => {
    setLoading(true);
    setCurrentView('overview');
    await fetchRealData(true);
    setNewLeadsCount(scanResult || 0);
    setScanState('idle');
    setLoading(false);
  };

  const handleSaveLead = (b) => {
    if (savedLeads.find(lead => lead.name === b.name && lead.city === b.city)) return;
    const updated = [...savedLeads, b];
    setSavedLeads(updated);
    localStorage.setItem('localviz_saved_leads', JSON.stringify(updated));
  };

  const handleUnsaveLead = (b) => {
    const updated = savedLeads.filter(lead => !(lead.name === b.name && lead.city === b.city));
    setSavedLeads(updated);
    localStorage.setItem('localviz_saved_leads', JSON.stringify(updated));
  };

  const handleTrashLead = (b) => {
    if (trashedLeads.find(lead => lead.name === b.name && lead.city === b.city)) return;
    const updated = [...trashedLeads, b];
    setTrashedLeads(updated);
    localStorage.setItem('localviz_trashed_leads', JSON.stringify(updated));
    // Also remove from saved if trashed
    handleUnsaveLead(b);
  };

  const isSaved = (b) => {
    return savedLeads.some(lead => lead.name === b.name && lead.city === b.city);
  };

  const exportToCSV = () => {
    const dataToExport = currentView === 'saved' ? savedLeads : filteredBusinesses;
    if (dataToExport.length === 0) return;

    const headers = ['Business Name', 'City', 'Category', 'Rating', 'Phone', 'Website Status', 'URL'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(b => `"${b.name}","${b.city}","${b.category}","${b.rating || ''}","${b.phone || ''}","No Website","${b.url || ''}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `localviz_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    setScraping(true);
    setScanState('scanning');
    setScanResult(null);
    setLiveCount(0);

    const initialLen = businesses.length;

    const msgs = [
      "Establishing secure connection to maps...",
      "Bypassing geographical limitations...",
      `Scanning region for ${scrapeCategory}...`,
      "Filtering out businesses with existing websites...",
      "Extracting contact details and ratings...",
      "Finalizing extraction..."
    ];
    let msgIdx = 0;
    setScrapeMsg(msgs[0]);
    const intv = setInterval(async () => {
      msgIdx++;
      if (msgIdx < msgs.length) setScrapeMsg(msgs[msgIdx]);
      else msgIdx = 0; // loop messages
      
      // Real time update check
      try {
        const r = await fetch('/demo_leads.json?t=' + Date.now());
        if (r.ok) {
           const d = await r.json();
           if (d.length > initialLen) {
             setLiveCount(d.length - initialLen);
           }
        }
      } catch(e){}
    }, 3000);
    
    try {
      const res = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: scrapeCity, category: scrapeCategory, limit: parseInt(scrapeLimit) })
      });
      clearInterval(intv);
      if (res.ok) {
        const data = await res.json();
        setScanResult(data.count);
        setScanState('done');
      } else {
        setScrapeMsg('Error launching scan.');
        setScanState('idle');
      }
    } catch (err) {
      clearInterval(intv);
      setScrapeMsg('Could not connect to backend scraper. The server may be starting up, try again in 30 seconds.');
      setScanState('idle');
    }
    setScraping(false);
  };

  const sourceData = currentView === 'saved' ? savedLeads : businesses;

  let filteredBusinesses = sourceData.filter(b => {
    if (trashedLeads.some(trash => trash.name === b.name && trash.city === b.city)) return false;
    // Exclude businesses without a valid phone number
    if (!b.phone || b.phone.toLowerCase().includes('not found') || b.phone.trim() === '') return false;
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity ? b.city === filterCity : true;
    const matchesCategory = filterCategory ? b.category === filterCategory : true;
    return matchesSearch && matchesCity && matchesCategory;
  });

  const FREE_LIMIT = 5;
  const limitHit = !isPro && currentView === 'overview' && filteredBusinesses.length > FREE_LIMIT;
  if (!isPro && currentView === 'overview') {
    filteredBusinesses = filteredBusinesses.slice(0, FREE_LIMIT);
  }

  // Skeleton Loader for UX
  const TableSkeleton = () => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Business Name</th><th>Location</th><th>Category</th><th>Contact</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        {[1,2,3,4,5].map(i => (
          <tr key={i} className={styles.dataRow}>
            <td><div className="skeleton" style={{height: '24px', width: '70%'}}></div></td>
            <td><div className="skeleton" style={{height: '16px', width: '50%'}}></div></td>
            <td><div className="skeleton" style={{height: '16px', width: '60%'}}></div></td>
            <td><div className="skeleton" style={{height: '16px', width: '80%'}}></div></td>
            <td><div className="skeleton" style={{height: '32px', width: '80px'}}></div></td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderContent = () => {
    if (currentView === 'settings') {
      return (
        <div key="settings" className={`${styles.formCard} ${styles.animateSettings}`}>
          {scanState === 'idle' && (
            <>
              <h2 className={styles.sectionTitle}><Icons.Search /> Manual Deep Scan</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Launch a targeted scan on Google Maps directly from here. Our engine will visit every result to find the most qualified leads.</p>
              
              <form onSubmit={handleScrape}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>City or Region</label>
                  <input 
                    type="text" 
                    className={styles.searchInput} 
                    value={scrapeCity}
                    onChange={(e) => setScrapeCity(e.target.value)}
                    placeholder="e.g. Paris, Lyon, Bordeaux..."
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className={styles.formGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className={styles.formLabel}>Category / Niche</label>
                    <input 
                      type="text" 
                      className={styles.searchInput} 
                      value={scrapeCategory}
                      onChange={(e) => setScrapeCategory(e.target.value)}
                      placeholder="e.g. Plumber, Garage..."
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Max Profiles to Check</label>
                    <input 
                      type="number" 
                      className={styles.searchInput} 
                      value={scrapeLimit}
                      onChange={(e) => setScrapeLimit(e.target.value)}
                      min="1"
                      max="100"
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={scraping} style={{ width: '100%', marginTop: '1rem', height: '48px' }}>
                  Start Extraction
                </button>
                {scrapeMsg && <p style={{ marginTop: '1.5rem', color: scrapeMsg.includes('Could not') ? '#f87171' : 'var(--accent-green)', fontSize: '0.875rem', textAlign: 'center', fontWeight: 500 }}>{scrapeMsg}</p>}
              </form>
            </>
          )}

          {scanState === 'scanning' && (
            <div className={styles.scannerContainer}>
              <div className={styles.radar}></div>
              <div className={styles.scanStatus}>Deep Scanning Active...</div>
              <div className={styles.scanSub}>{scrapeMsg}</div>
              {liveCount > 0 && (
                <div style={{ marginTop: '2rem', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-green)', animation: 'pulse-pin 2s infinite' }}>
                  🔥 {liveCount} leads extracted so far!
                </div>
              )}
            </div>
          )}

          {scanState === 'done' && (
            <div className={styles.resultCard}>
              {scanResult > 0 ? (
                <>
                  <div className={styles.resultNumber}>{scanResult}</div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Qualified Leads Found!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>We successfully extracted these businesses. They have been added to your LocalViz database.</p>
                </>
              ) : (
                <>
                  <div className={styles.resultEmpty}>0</div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Leads Found</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Every business we scanned in this area already has a website, or no results were found for your query.</p>
                </>
              )}
              <button className="btn-primary" onClick={viewResults} style={{ padding: '0.75rem 2rem' }}>
                View Results
              </button>
            </div>
          )}
        </div>
      );
    }

    if (currentView === 'billing') {
      return (
        <div key="billing" className={`${styles.planCard} ${styles.animateBilling}`} style={isPro ? { border: '1px solid var(--accent-green)', background: 'rgba(16, 185, 129, 0.05)' } : {}}>
          <h2 className={styles.sectionTitle}>{isPro ? 'Pro Plan (Admin VIP)' : 'Free Plan'}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
            {isPro ? 'You have full access to all features and unlimited leads.' : 'You are currently on the Free Plan.'}
          </p>
          <div style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>
            {isPro ? '€50' : '€0'}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            {isPro ? 'Limit: Unlimited leads per scan.' : 'Limit: Display maximum 3 leads per scan.'}
          </p>
          {!isPro && <button className="btn-primary" style={{ width: '100%', height: '48px' }}>Upgrade to Pro (€50/mo)</button>}
          {isPro && <button className="btn-secondary" style={{ width: '100%', borderColor: 'var(--accent-green)', color: 'var(--accent-green)', height: '48px' }}><Icons.Check /> Active Subscription</button>}
        </div>
      );
    }

    return (
      <div key={currentView} className={`${styles.contentGrid} ${styles.animateTable}`}>
        <div className={styles.tableSection}>
          <div className={styles.controls}>
            <div className={styles.inputWrapper}>
              <Icons.Search />
              <input 
                type="text" 
                placeholder="Search business name..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.selectWrapper}>
              <Icons.Filter />
              <select className={styles.filterSelect} value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
                <option value="">All Cities</option>
                {[...new Set(businesses.map(b => b.city).filter(Boolean))].sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className={styles.selectWrapper}>
              <Icons.Filter />
              <select className={styles.filterSelect} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All Sectors</option>
                {[...new Set(businesses.map(b => b.category).filter(Boolean))].sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {limitHit && (
            <div className={styles.freeLimitWarning}>
              <Icons.Alert />
              <div>
                <strong>You are on the Free plan.</strong> Showing only 3 results. Upgrade to Pro to see the full list of qualified leads!
              </div>
            </div>
          )}

          {loading ? (
            <TableSkeleton />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                    <th>Business Info</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Contact</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBusinesses.map((b) => {
                    const isBrandNew = currentView === 'overview' && newLeadsCount > 0 && businesses.findIndex(item => item.name === b.name && item.city === b.city) < newLeadsCount;

                    return (
                      <tr key={`${b.name}-${b.city}`} className={`${styles.dataRow} ${isBrandNew ? styles.newLeadRow : ''}`}>
                        <td>
                          <div className={styles.businessInfo}>
                            <span className={styles.businessName}>
                              {b.name}
                              {isBrandNew && <span className={styles.newBadge}>NEW</span>}
                            </span>
                            <span className={styles.businessLocation}><Icons.MapPin /> {b.address || b.city}</span>
                          </div>
                        </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{b.category}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>⭐ {b.rating || 'N/A'}</div>
                      </td>
                      <td><span className={`${styles.statusBadge} ${styles.statusNoSite}`}>No Website</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{b.phone || 'N/A'}</td>
                      <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {isSaved(b) ? (
                          <button className={styles.actionBtnUnsave} onClick={() => handleUnsaveLead(b)} title="Remove from saved">
                            <Icons.Check /> Saved
                          </button>
                        ) : (
                          <button className={`btn-primary ${styles.actionBtnSmall}`} onClick={() => handleSaveLead(b)}>
                            Save Lead
                          </button>
                        )}
                        <a 
                          href={b.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + b.city)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.actionBtnMaps}
                          title="Open precisely in Google Maps"
                        >
                          <Icons.MapPin />
                        </a>
                        <button className={styles.actionBtnTrash} onClick={() => handleTrashLead(b)} title="Discard lead">
                          <Icons.Trash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                  {filteredBusinesses.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: '1rem', opacity: 0.5 }}><Icons.Search /></div>
                        No businesses found matching your criteria. Try adjusting filters or run a new deep scan.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          )}
        </div>

        {/* Activity Feed only on Overview */}
        {currentView === 'overview' && (
          <div className={styles.feedSection}>
            <h2 className={styles.sectionTitle}><Icons.Alert /> Live Feed</h2>
            <div className={styles.feedList}>
              {businesses.slice(0, Math.max(newLeadsCount || 0, 5)).map((b, idx) => (
                <div className={styles.feedItem} key={`feed-${idx}`}>
                  <div className={styles.feedIcon}></div>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Lead Found</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{b.name} in {b.city}</div>
                    <div className={styles.feedTime}>Just now</div>
                  </div>
                </div>
              ))}
              {businesses.length === 0 && <p style={{fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0'}}>No recent activity.</p>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.dashboardLayout}>
      <aside className={styles.sidebar}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className={styles.logo}>Local<span className="text-gradient">Viz</span></div>
        </Link>
        <nav className={styles.navMenu}>
          <div className={`${styles.navItem} ${currentView === 'overview' ? styles.active : ''}`} onClick={() => setCurrentView('overview')}>
            <Icons.Home /> Overview
          </div>
          <div className={`${styles.navItem} ${currentView === 'saved' ? styles.active : ''}`} onClick={() => setCurrentView('saved')}>
            <Icons.Bookmark /> My Saved Leads <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{savedLeads.length}</span>
          </div>
          <div className={`${styles.navItem} ${currentView === 'settings' ? styles.active : ''}`} onClick={() => setCurrentView('settings')}>
            <Icons.Settings /> Scraping Engine
          </div>
          <div className={`${styles.navItem} ${currentView === 'billing' ? styles.active : ''}`} onClick={() => setCurrentView('billing')}>
            <Icons.CreditCard /> Billing
          </div>
          <Link href="/" className={styles.navItem} style={{ marginTop: 'auto', opacity: 0.7 }}>
            <Icons.LogOut /> Sign out
          </Link>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>
              {currentView === 'overview' && 'Dashboard Overview'}
              {currentView === 'saved' && 'My Targeted Leads'}
              {currentView === 'settings' && 'Scraping Engine Settings'}
              {currentView === 'billing' && 'Subscription Details'}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {currentView === 'overview' && 'Welcome back. Here is the latest data extracted for your campaigns.'}
              {currentView === 'saved' && 'Your hand-picked list of high-quality potential clients.'}
              {currentView === 'settings' && 'Configure and launch new extraction tasks across France.'}
            </p>
          </div>
          
          {(currentView === 'overview' || currentView === 'saved') && (
            <button className="btn-secondary" onClick={exportToCSV}>
              <Icons.Download /> Export CSV
            </button>
          )}
        </div>

        {renderContent()}

      </main>
    </div>
  );
}
