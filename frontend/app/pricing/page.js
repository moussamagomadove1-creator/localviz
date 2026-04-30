'use client';
import Link from 'next/link';
import styles from './pricing.module.css';

export default function Pricing() {
  const handleCheckout = (planId) => {
    // Integrate Stripe checkout here
    alert(`Redirecting to Stripe checkout for ${planId}`);
  };

  return (
    <>
      <nav className={styles.navBar}>
        <div className={styles.navInner}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={styles.logo}>
              <span className={styles.logoMark}></span>
              LocalViz
            </div>
          </Link>
        </div>
      </nav>

      <div className={styles.pricingContainer}>
        <span className={styles.eyebrow}>Pricing</span>
        <h1 className={styles.title}>Simple, transparent <span className="serif">pricing.</span></h1>
        <p className={styles.subtitle}>Start for free, upgrade when you're ready. No hidden fees, ever.</p>

        <div className={styles.pricingGrid}>
          <div className={styles.pricingCard}>
            <h3 className={styles.planName}>Free</h3>
            <div className={styles.planPrice}>$0<span className={styles.planPeriod}>/forever</span></div>
            <p className={styles.planDesc}>Try LocalViz risk-free and find your first client.</p>
            
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                3 scans included
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Up to 20 leads per scan
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Basic filter by category
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Manual CSV export
              </li>
            </ul>
            
            <Link href="/login" className={`btn-secondary ${styles.actionBtn}`}>Get Started Free</Link>
          </div>

          <div className={`${styles.pricingCard} ${styles.popularCard}`}>
            <div className={styles.popularBadge}>Most Popular</div>
            <h3 className={styles.planName}>Pro</h3>
            <div className={styles.planPrice}>$59<span className={styles.planPeriod}>/month</span></div>
            <p className={styles.planDesc}>Everything you need to close deals consistently.</p>
            
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Unlimited lead extractions
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                All cities in France
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Deep scanning & website detection
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                1-click CSV/Excel export
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Priority 24/7 support
              </li>
            </ul>
            
            <button onClick={() => handleCheckout('pro')} className={`btn-primary ${styles.actionBtn}`}>Subscribe to Pro</button>
          </div>

          <div className={styles.pricingCard}>
            <h3 className={styles.planName}>Agency</h3>
            <div className={styles.planPrice}>$149<span className={styles.planPeriod}>/month</span></div>
            <p className={styles.planDesc}>For teams scaling their local outreach.</p>
            
            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                All Pro features
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                5 User Seats
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                API Access
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Webhook integrations
              </li>
              <li className={styles.featureItem}>
                <span className={styles.featureIcon}>✓</span>
                Advanced CRM integration
              </li>
            </ul>
            
            <button onClick={() => handleCheckout('agency')} className={`btn-secondary ${styles.actionBtn}`}>Contact Sales</button>
          </div>
        </div>
      </div>
    </>
  );
}
