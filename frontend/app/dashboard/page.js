'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../utils/supabase/client';
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
  Filter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Menu: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="18" y2="18"/></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localviz-scraper.onrender.com';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('overview');
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedLeads, setSavedLeads] = useState([]);
  const [trashedLeads, setTrashedLeads] = useState([]);
  const [isPro, setIsPro] = useState(false); // Free plan by default
  const [userId, setUserId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  const [hasExtension, setHasExtension] = useState(true);

  // SECURITY: These limits are enforced in JS (not just HTML attributes)
  const MAX_SCAN_LIMIT = isPro ? 999999 : 50;
  const MIN_SCAN_LIMIT = 1;

  const fetchRealData = async (isRefresh = false, uid = null) => {
    try {
      const activeUser = uid || userId;
      // SECURITY: Get fresh JWT token for authenticated API call
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      
      const apiRes = await fetch(`${API_URL}/api/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null);
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
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }
      const user = session.user;
      let currentUid = user.id;
      setUserId(user.id);
      
      // Check Pro status if needed (mocked for now, or check user metadata)
      if (user.email === 'admin@localviz.com') {
        setIsPro(true);
      }
      
      fetchRealData(false, currentUid);
    };

    checkUser();

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

    // Check if extension is installed (retry a few times as content script may load late)
    const checkExt = (attempts = 0) => {
      if (document.getElementById('localviz-extension-installed')) {
        setHasExtension(true);
      } else if (attempts < 5) {
        setTimeout(() => checkExt(attempts + 1), 500);
      } else {
        setHasExtension(false);
      }
    };
    checkExt();

    // Listen for messages from the Chrome Extension
    const handleMessage = async (event) => {
      if (event.source !== window) return;
      
      if (event.data.type === 'LOCALVIZ_SCAN_PROGRESS') {
        setScrapeMsg(event.data.payload.status || 'Scanning in background...');
        setLiveCount(event.data.payload.count || 0);
      }
      
      if (event.data.type === 'LOCALVIZ_SCAN_COMPLETE') {
        const { leads } = event.data.payload;
        setScanResult(leads.length);
        setScanState('done');
        setScraping(false);
        setScrapeMsg('Scan complete! Saving leads...');
        
        // Save to Supabase directly
        const { data: { session } } = await supabase.auth.getSession();
        if (session && leads.length > 0) {
          const userLeads = leads.map(l => ({
            user_id: session.user.id,
            name: l.name,
            city: l.city || 'N/A',
            category: l.category || 'N/A',
            phone: l.phone || null,
            rating: l.rating || null,
            url: l.url || null
          }));
          const { error } = await supabase.from('leads').insert(userLeads);
          if (error) console.error('Error saving leads:', error);
        }
        
        fetchRealData(true);
      }
      
      if (event.data.type === 'LOCALVIZ_SCAN_ERROR') {
        setScrapeMsg(event.data.payload.error || 'Scan failed.');
        setScanState('idle');
        setScraping(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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
    
    // SECURITY: Enforce limit in JS code (can't be bypassed via F12)
    const enforcedLimit = Math.min(Math.max(parseInt(scrapeLimit) || 15, MIN_SCAN_LIMIT), MAX_SCAN_LIMIT);
    if (parseInt(scrapeLimit) !== enforcedLimit) {
      setScrapeLimit(enforcedLimit);
      if (!isPro && parseInt(scrapeLimit) > 50) {
        setScrapeMsg('⚠️ 50 is the maximum on the Free plan. Upgrade to Pro to scan unlimited profiles!');
      } else {
        setScrapeMsg(`⚠️ Limit adjusted to ${enforcedLimit}.`);
      }
      return;
    }
    
    // SECURITY: Also validate city/category are not empty or too long
    if (!scrapeCity.trim() || !scrapeCategory.trim()) {
      setScrapeMsg('⚠️ City and category are required.');
      return;
    }
    if (scrapeCity.length > 100 || scrapeCategory.length > 100) {
      setScrapeMsg('⚠️ Input too long (max 100 characters).');
      return;
    }
    
    setScraping(true);
    setScanState('scanning');
    setScanResult(null);
    setLiveCount(0);

    setScrapeMsg("Starting Chrome Extension Scraper...");

    // Send message to extension
    window.postMessage({
      type: 'LOCALVIZ_START_SCAN',
      payload: {
        city: scrapeCity.trim(),
        category: scrapeCategory.trim(),
        limit: enforcedLimit
      }
    }, '*');

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
                      onChange={(e) => {
                        setScrapeMsg(''); // Clear previous messages
                        // SECURITY: Clamp value in JS, not just HTML
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val < MIN_SCAN_LIMIT) setScrapeLimit(MIN_SCAN_LIMIT);
                        else if (val > MAX_SCAN_LIMIT) {
                          setScrapeLimit(MAX_SCAN_LIMIT);
                          if (!isPro) {
                            setScrapeMsg('⚠️ 50 is the maximum on the Free plan. Upgrade to Pro to scan unlimited profiles!');
                          }
                        }
                        else setScrapeLimit(val);
                      }}
                      min={MIN_SCAN_LIMIT}
                      max={MAX_SCAN_LIMIT}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                {!hasExtension && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ color: '#ff6b6b', margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                      ⚠️ <strong>Extension requise:</strong> Vous devez installer l'extension Chrome LocalViz pour scraper Google Maps de façon transparente.
                    </p>
                    <button 
                      type="button"
                      style={{ padding: '0.5rem 1rem', background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => alert("Pour installer : allez dans chrome://extensions, activez le mode développeur, et cliquez sur 'Charger l'extension non empaquetée' puis sélectionnez le dossier chrome-extension.")}
                    >
                      Comment installer l'extension ?
                    </button>
                  </div>
                )}
                
                <button type="submit" className="btn-primary" disabled={scraping || !hasExtension} style={{ width: '100%', marginTop: '1rem', height: '48px', opacity: hasExtension ? 1 : 0.5 }}>
                  {scraping ? 'Scan in Progress...' : 'Start Extraction'}
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
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>We successfully extracted these businesses. They have been added to your NoSite database.</p>
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
            {isPro ? '$59' : '$0'}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            {isPro ? 'Limit: Unlimited leads per scan.' : 'Limit: Display up to 5 leads per scan. Upgrade for unlimited access.'}
          </p>
          {!isPro && <button className="btn-primary" style={{ width: '100%', height: '48px' }}>Upgrade to Pro ($59/mo)</button>}
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
                <strong>You are on the Free plan.</strong> Showing only {FREE_LIMIT} results. Upgrade to Pro to see the full list of qualified leads!
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
      <div className={styles.mobileHeader}>
        <button className={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <Icons.Close /> : <Icons.Menu />}
        </button>
      </div>

      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }} className={styles.desktopLogo}>
          <div className={styles.logo}>
            <Image src="/SaasLogo.png" alt="NoSite logo" width={52} height={52} priority />
            <span>NoSite</span>
          </div>
        </Link>
        <nav className={styles.navMenu}>
          <div className={`${styles.navItem} ${currentView === 'overview' ? styles.active : ''}`} onClick={() => {setCurrentView('overview'); setIsMobileMenuOpen(false);}}>
            <Icons.Home /> Overview
          </div>
          <div className={`${styles.navItem} ${currentView === 'saved' ? styles.active : ''}`} onClick={() => {setCurrentView('saved'); setIsMobileMenuOpen(false);}}>
            <Icons.Bookmark /> My Saved Leads <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{savedLeads.length}</span>
          </div>
          <div className={`${styles.navItem} ${currentView === 'settings' ? styles.active : ''}`} onClick={() => {setCurrentView('settings'); setIsMobileMenuOpen(false);}}>
            <Icons.Settings /> Scraping Engine
          </div>
          <div className={`${styles.navItem} ${currentView === 'billing' ? styles.active : ''}`} onClick={() => {setCurrentView('billing'); setIsMobileMenuOpen(false);}}>
            <Icons.CreditCard /> Billing
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href='/'; }} className={styles.navItem} style={{ marginTop: 'auto', opacity: 0.7, background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <Icons.LogOut /> Sign out
          </button>
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
