'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../utils/supabase/client';
import styles from './login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e, isSignUp = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
        if (result.data?.user && result.data?.user?.identities?.length === 0) {
           alert("This email is already registered. Try signing in.");
        } else if (result.error) {
           alert(result.error.message);
        } else {
           alert("Registration successful! You are now signed in.");
           window.location.href = '/dashboard';
        }
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) alert(result.error.message);
        else window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during authentication.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
            <span className={styles.logoMark}></span>
            LocalViz
          </Link>
        </div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to access your LocalViz dashboard.</p>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              className={styles.input} 
              placeholder="admin@localviz.com"
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <button type="button" onClick={(e) => handleAuth(e, false)} className={`btn-primary ${styles.submitBtn}`} disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Wait...' : 'Sign In'}
            </button>
            <button type="button" onClick={(e) => handleAuth(e, true)} className={`btn-secondary ${styles.submitBtn}`} disabled={loading} style={{ flex: 1 }}>
              Sign Up
            </button>
          </div>
        </form>

        <div className={styles.divider}>OR</div>

        <button className={`btn-secondary ${styles.googleBtn}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.75 17.55V20.31H19.32C21.41 18.39 22.56 15.58 22.56 12.25Z" fill="#4285F4"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.32 20.31L15.75 17.55C14.74 18.23 13.48 18.63 12 18.63C9.13 18.63 6.69 16.7 5.82 14.09H2.13V16.94C3.96 20.57 7.7 23 12 23Z" fill="#34A853"/>
            <path d="M5.82 14.09C5.6 13.42 5.46 12.72 5.46 12C5.46 11.28 5.6 10.58 5.82 9.91V7.06H2.13C1.38 8.56 0.95 10.24 0.95 12C0.95 13.76 1.38 15.44 2.13 16.94L5.82 14.09Z" fill="#FBBC05"/>
            <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.03L19.41 3.83C17.45 2 14.97 0.95 12 0.95C7.7 0.95 3.96 3.43 2.13 7.06L5.82 9.91C6.69 7.3 9.13 5.38 12 5.38Z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
