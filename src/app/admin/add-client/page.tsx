'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { adminInviteUser } from '@/lib/actions'
import { useLanguage } from '@/context/LanguageContext'

export default function AddClientPage() {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    const cleanEmail = email.trim().toLowerCase()
    const result = await adminInviteUser(name.trim(), cleanEmail)
    setLoading(false)
    if (result.success) {
      setSuccess(t('add_client_success', { email: cleanEmail }))
      setName('')
      setEmail('')
    } else {
      setError(result.error ?? 'Failed.')
    }
  }

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="pf-page-md">

          <Link
            href="/admin"
            className="pf-link"
            style={{ fontSize: '0.72rem', display: 'inline-block', marginBottom: '1.5rem' }}
          >
            {t('common_back_dashboard')}
          </Link>

          <div style={{ marginBottom: '2.5rem' }}>
            <p className="pf-eyebrow">{t('admin_eyebrow')}</p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '3.25rem',
              fontWeight: 300,
              lineHeight: 1.1,
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
              marginBottom: '0.3rem',
            }}>
              {t('add_client_heading')}{' '}
              <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>
                {t('add_client_heading_em')}
              </em>
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
              {t('add_client_subtext')}
            </p>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '420px',
          }}>
            {success && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-bg)',
                border: '1px solid var(--accent-lt)',
                fontSize: '0.78rem',
                color: 'var(--forest)',
                marginBottom: '1.25rem',
              }}>
                {success}
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="pf-field">
                <label className="pf-label">{t('add_client_name')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('add_client_name_placeholder')}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pf-input"
                />
              </div>

              <div className="pf-field">
                <label className="pf-label">{t('add_client_email')}</label>
                <input
                  type="email"
                  required
                  placeholder={t('add_client_email_placeholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pf-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="pf-btn pf-btn-primary"
                style={{
                  justifyContent: 'center',
                  padding: '0.8rem 1.2rem',
                  opacity: loading ? 0.6 : 1,
                  marginTop: '0.5rem',
                }}
              >
                {loading ? t('add_client_sending') : t('add_client_submit')}
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  )
}
