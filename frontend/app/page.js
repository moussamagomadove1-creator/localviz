'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  const headerRef = useRef(null);

  // ===== Header hide/show on scroll =====
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (!headerRef.current) return;
      if (y < 80) { headerRef.current.classList.remove(styles.navbarHidden); lastY = y; return; }
      if (y > lastY + 4) headerRef.current.classList.add(styles.navbarHidden);
      else if (y < lastY - 4) headerRef.current.classList.remove(styles.navbarHidden);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ===== Scroll reveal observer =====
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      {/* ===== NAV ===== */}
      <header ref={headerRef} className={`${styles.navbar} glass-nav`}>
        <div className={styles.navInner}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={styles.logo}>
              <span className={styles.logoMark}></span>
              LocalViz
            </div>
          </Link>
          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#pricing" className={styles.navLink}>Pricing</a>
          </div>
          <div className={styles.navCta}>
            <Link href="/login" className="btn-secondary">Log in</Link>
            <Link href="/login" className="btn-primary">Get Started →</Link>
          </div>
        </div>
      </header>

      <main style={{ paddingTop: 72 }}>
        {/* ===== HERO ===== */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <span className={styles.badge}>
              <span className={styles.dot}></span>
              Live Scanning · Google Maps
            </span>
            <h1 className={styles.heroTitle}>
              <span className="text-gradient">Find local clients who</span>
              <br />
              <span className="serif">need a website.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              We scan thousands of local businesses on Google Maps to find the ones with zero online presence. You contact them, you close the deal.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/login" className="btn-primary" style={{ padding: '13px 24px', fontSize: '15px' }}>
                Try it free — 3 scans included
              </Link>
              <a href="#features" className="btn-secondary" style={{ padding: '13px 24px', fontSize: '15px' }}>
                See how it works →
              </a>
            </div>
            <div className={styles.freeTag}>
              <span className={styles.freeTagGold}>Free</span> · 3 scans included to get started
            </div>
          </div>

          {/* ===== MOCK DASHBOARD ===== */}
          <div className={styles.mock}>
            <div className={styles.mockFrame}>
              <div className={styles.mockBar}>
                <span className={styles.mockDot}></span>
                <span className={styles.mockDot}></span>
                <span className={styles.mockDot}></span>
              </div>
              <div className={styles.mockBody}>
                <aside className={styles.mockSide}>
                  <div className={`${styles.mockItem} ${styles.mockItemActive}`}></div>
                  <div className={styles.mockItem}></div>
                  <div className={styles.mockItem}></div>
                  <div className={styles.mockItem}></div>
                  <div className={styles.mockItem}></div>
                </aside>
                <div className={styles.mockMain}>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Leads found</div>
                    <div className={styles.statValue}>421 <span className={styles.statGold}>↑ 24%</span></div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Without website</div>
                    <div className={styles.statValue}>389</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Avg. Rating</div>
                    <div className={styles.statValue}>4.2 ★</div>
                  </div>
                  <div className={styles.chart}>
                    <svg className={styles.chartSvg} viewBox="0 0 600 140" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7c5cff" stopOpacity=".5"/>
                          <stop offset="100%" stopColor="#7c5cff" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M0,110 C60,90 120,100 180,70 C240,40 300,80 360,50 C420,20 480,60 540,30 L600,40 L600,140 L0,140 Z" fill="url(#g)"/>
                      <path d="M0,110 C60,90 120,100 180,70 C240,40 300,80 360,50 C420,20 480,60 540,30 L600,40" stroke="#d4b46a" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section id="features" className={styles.section}>
          <div className={styles.sectionContainer}>
            <div className={`${styles.sectionHead} reveal`}>
              <span className={styles.eyebrow}>How it Works</span>
              <h2 className={styles.sectionTitle}>
                Turn cold leads into <span className="serif">paying clients.</span>
              </h2>
              <p className={styles.sectionDesc}>
                A complete pipeline from discovery to deal — powered by Google Maps data and intelligent filtering.
              </p>
            </div>
            <div className={`${styles.features} reveal-stagger`}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>⚡</div>
                <h3 className={styles.featureTitle}>Automated Scanning</h3>
                <p className={styles.featureDesc}>Our bots scrape Google Maps across France, targeting specific niches like plumbers, bakers, and hair salons. We filter out anyone who already has a website.</p>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>◎</div>
                <h3 className={styles.featureTitle}>Smart Filtering</h3>
                <p className={styles.featureDesc}>Use our dashboard to search by city and category. Get instant access to the business name, address, phone number, and Google rating.</p>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>↗</div>
                <h3 className={styles.featureTitle}>Contact & Close</h3>
                <p className={styles.featureDesc}>Reach out with a targeted pitch: "I noticed your business has great reviews but no website. Let me build one." Conversion rates are unmatched.</p>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>◈</div>
                <h3 className={styles.featureTitle}>Deep Scan Technology</h3>
                <p className={styles.featureDesc}>We don't just skim the surface. Our engine visits each business profile to verify website status, extract phone numbers, and check ratings.</p>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>⌘</div>
                <h3 className={styles.featureTitle}>Zone Splitting</h3>
                <p className={styles.featureDesc}>Google caps results at ~120 per search. We automatically split cities into sub-zones to discover 10x more businesses than a manual search.</p>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>✦</div>
                <h3 className={styles.featureTitle}>1-Click Export</h3>
                <p className={styles.featureDesc}>Export your filtered leads to CSV or Excel instantly. Only the businesses you see on screen get exported — no clutter, no noise.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS BAND ===== */}
        <div className={styles.band}>
          <div className={`${styles.statsGrid} reveal-stagger`}>
            <div>
              <div className={styles.statsNumber}>10+</div>
              <div className={styles.statsLabel}>Cities covered</div>
            </div>
            <div>
              <div className={styles.statsNumber}>100%</div>
              <div className={styles.statsLabel}>Automated scanning</div>
            </div>
            <div>
              <div className={styles.statsNumber}>Free</div>
              <div className={styles.statsLabel}>3 scans to start</div>
            </div>
            <div>
              <div className={styles.statsNumber}>CSV</div>
              <div className={styles.statsLabel}>1-click export</div>
            </div>
          </div>
        </div>

        {/* ===== PRICING ===== */}
        <section id="pricing" className={styles.section}>
          <div className={styles.sectionContainer}>
            <div className={`${styles.sectionHead} reveal`}>
              <span className={styles.eyebrow}>Pricing</span>
              <h2 className={styles.sectionTitle}>
                Simple, transparent <span className="serif">pricing.</span>
              </h2>
              <p className={styles.sectionDesc}>
                Start for free, upgrade when you're ready. No hidden fees, ever.
              </p>
            </div>
            <div className={`${styles.pricingGrid} reveal-stagger`}>
              {/* Free */}
              <div className={styles.plan}>
                <h3 className={styles.planName}>Free</h3>
                <div className={styles.planPrice}>$0<small className={styles.planPriceSub}>/forever</small></div>
                <p className={styles.planTag}>Try LocalViz risk-free</p>
                <ul className={styles.planFeatures}>
                  <li>3 scans included</li>
                  <li>Up to 20 leads per scan</li>
                  <li>Basic category filters</li>
                  <li>Manual CSV export</li>
                </ul>
                <Link href="/login" className={`btn-secondary ${styles.planBtn}`}>Get Started Free</Link>
              </div>

              {/* Pro */}
              <div className={`${styles.plan} ${styles.planFeatured}`}>
                <div className={styles.planBadge}>Most Popular</div>
                <h3 className={styles.planName}>Pro</h3>
                <div className={styles.planPrice}>$59<small className={styles.planPriceSub}>/month</small></div>
                <p className={styles.planTag}>For serious web developers</p>
                <ul className={styles.planFeatures}>
                  <li>Unlimited lead extractions</li>
                  <li>Deep scanning & website detection</li>
                  <li>Google Rating & Review filters</li>
                  <li>1-click export to CSV/Excel</li>
                  <li>Priority 24/7 support</li>
                </ul>
                <Link href="/login" className={`btn-primary ${styles.planBtn}`}>Subscribe to Pro</Link>
              </div>

              {/* Agency */}
              <div className={styles.plan}>
                <h3 className={styles.planName}>Agency</h3>
                <div className={styles.planPrice}>$149<small className={styles.planPriceSub}>/month</small></div>
                <p className={styles.planTag}>For scaling web agencies</p>
                <ul className={styles.planFeatures}>
                  <li>Everything in Pro</li>
                  <li>API Access for automation</li>
                  <li>Webhook integrations</li>
                  <li>Team accounts (up to 5)</li>
                  <li>Dedicated account manager</li>
                </ul>
                <Link href="/login" className={`btn-secondary ${styles.planBtn}`}>Contact Sales</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA FINAL ===== */}
        <section style={{ padding: 0 }}>
          <div className={`${styles.ctaFinal} reveal`}>
            <div className={styles.ctaFinalContent}>
              <span className={styles.eyebrow}>Ready to start?</span>
              <h2 className={styles.ctaFinalTitle}>
                Join freelancers who <span className="serif">close more deals.</span>
              </h2>
              <p className={styles.ctaFinalDesc}>
                Free forever plan. No credit card required. Start finding clients in under 2 minutes.
              </p>
              <div className={styles.ctaRow} style={{ animationDelay: '0s' }}>
                <Link href="/login" className="btn-primary" style={{ padding: '13px 24px' }}>Get Started Now →</Link>
                <a href="#features" className="btn-secondary" style={{ padding: '13px 24px' }}>Learn More</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className={styles.footer}>
        <div className={styles.footInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark}></span>
            LocalViz
          </div>
          <div>© 2026 LocalViz. All rights reserved.</div>
          <div className={styles.footLinks}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Status</a>
          </div>
        </div>
      </footer>
    </>
  );
}
