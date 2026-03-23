'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    const cleanEmail = email.trim().toLowerCase()
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: name } }
        })
        if (error) throw error
        await fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email: cleanEmail }),
        })
        setSuccessMsg('Account created! You can now sign in.')
        setIsSignUp(false)
        setLoading(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (error) throw error
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        })
        const profile = res.ok ? await res.json() : null
        const destination = profile?.role === 'ADMIN' ? '/admin' : '/my-bookings'
        window.location.replace(destination)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="pf-auth-wrap">
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Brand mark */}
        <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', fontWeight: 600, color: 'var(--forest)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              JOIN<span style={{ color: 'var(--clay)' }}>PILATES</span>
            </div>
          </Link>
          <div style={{ width: '24px', height: '1px', background: 'var(--border)', margin: '0.75rem auto 0' }} />
        </div>

        {/* Card */}
        <div className="pf-auth-card">
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.75rem',
            fontWeight: 400,
            color: 'var(--fg)',
            marginBottom: '0.25rem',
            letterSpacing: '-0.01em',
          }}>
            {isSignUp ? 'Join the studio' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginBottom: '1.75rem' }}>
            {isSignUp ? 'Create your account to start booking.' : 'Sign in to manage your schedule.'}
          </p>

          {successMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-lt)',
              fontSize: '0.78rem',
              color: 'var(--forest)',
              marginBottom: '1.25rem',
            }}>
              {successMsg}
            </div>
          )}

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--warn-lt)',
              border: '1px solid #e8cac3',
              fontSize: '0.78rem',
              color: 'var(--warn)',
              marginBottom: '1.25rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isSignUp && (
              <div className="pf-field">
                <label className="pf-label">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sofia Martins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pf-input"
                />
              </div>
            )}

            <div className="pf-field">
              <label className="pf-label">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pf-input"
              />
            </div>

            <div className="pf-field">
              <label className="pf-label">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pf-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="pf-btn pf-btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.8rem 1.2rem',
                marginTop: '0.5rem',
                fontSize: '0.7rem',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMsg(null) }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: 'var(--fg-muted)',
              fontFamily: "'DM Sans', sans-serif",
              padding: 0,
            }}
          >
            {isSignUp ? 'Already have an account? Sign in →' : "Don't have an account? Create one →"}
          </button>
          <Link
            href="/"
            style={{ fontSize: '0.7rem', color: 'var(--fg-light)', textDecoration: 'none' }}
          >
            ← Back to classes
          </Link>
        </div>

      </div>
    </div>
  )
}
