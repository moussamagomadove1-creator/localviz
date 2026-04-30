'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../utils/supabase/client';
import styles from './signup.module.css';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/dashboard';
      }
    });
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else if (data?.user?.identities?.length === 0) {
        setMessage({ type: 'error', text: 'This email is already registered. Try signing in.' });
      } else {
        // Email confirmation is enabled — show the confirmation screen
        setEmailSent(true);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    }
    setLoading(false);
  };

  // Success screen after signup
  if (emailSent) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.successIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1 className={styles.title}>Check your inbox</h1>
          <p className={styles.subtitle} style={{ marginBottom: '1rem' }}>
            We just sent a confirmation link to:
          </p>
          <div className={styles.emailHighlight}>{email}</div>
          <p className={styles.subtitle} style={{ marginTop: '1.5rem', lineHeight: '1.6' }}>
            Click the link in the email to activate your account. 
            Once confirmed, you can sign in and start scanning.
          </p>
          <p className={styles.subtitle} style={{ fontSize: '12px', marginTop: '1rem', opacity: 0.6 }}>
            Didn't receive anything? Check your spam folder.
          </p>
          <Link href="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '12px 28px', borderRadius: '999px', fontSize: '14px', textDecoration: 'none' }}>
            Go to Sign In →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
            <Image src="/SaasLogo.png" alt="NoSite logo" width={64} height={64} priority />
            <span>NoSite</span>
          </Link>
        </div>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Start finding clients who need a website.</p>

        {message && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            textAlign: 'center',
            backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: message.type === 'error' ? '#ef4444' : '#10b981',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
          }}>
            {message.text}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSignup}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              className={styles.input} 
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              className={styles.input} 
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
            <input 
              id="confirmPassword"
              type="password" 
              className={styles.input} 
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.divider}>OR</div>

        <button type="button" onClick={async () => await supabase.auth.signInWithOAuth({ provider: 'google' })} className={`btn-secondary ${styles.googleBtn}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.75 17.55V20.31H19.32C21.41 18.39 22.56 15.58 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.32 20.31L15.75 17.55C14.74 18.23 13.48 18.63 12 18.63C9.13 18.63 6.69 16.7 5.82 14.09H2.13V16.94C3.96 20.57 7.7 23 12 23Z" fill="#34A853"/>
            <path d="M5.82 14.09C5.6 13.42 5.46 12.72 5.46 12C5.46 11.28 5.6 10.58 5.82 9.91V7.06H2.13C1.38 8.56 0.95 10.24 0.95 12C0.95 13.76 1.38 15.44 2.13 16.94L5.82 14.09Z" fill="#FBBC05"/>
            <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.03L19.41 3.83C17.45 2 14.97 0.95 12 0.95C7.7 0.95 3.96 3.43 2.13 7.06L5.82 9.91C6.69 7.3 9.13 5.38 12 5.38Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: '#8a8f9c' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#d4b46a', textDecoration: 'underline' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
