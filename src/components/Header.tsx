'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { user, loading, signOut } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const pathname = usePathname()

  const isAdminPage = pathname.startsWith('/admin')

  if (loading) return <div className="pf-header" />

  return (
    <header className="pf-header">
      <Link href="/" className="pf-logo">
        join<span>pilates</span>
      </Link>

      <nav className="pf-nav">
        {/* Language toggle */}
        <div style={{ display: 'flex', gap: '0.1rem', marginRight: '0.5rem' }}>
          {(['en', 'gr'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: lang === l ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: lang === l ? 'var(--fg-on-dark)' : 'rgba(240,237,232,0.45)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {l === 'en' ? 'EN' : 'ΕΛ'}
            </button>
          ))}
        </div>

        {user ? (
          <>
            {!isAdminPage && (
              <Link
                href="/my-bookings"
                className={`pf-nav-link${pathname === '/my-bookings' ? ' active' : ''}`}
              >
                {t('nav_my_schedule')}
              </Link>
            )}
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={`pf-nav-link${isAdminPage ? ' active' : ''}`}
              >
                {t('nav_dashboard')}
              </Link>
            )}
            <button
              onClick={async () => {
                await signOut()
                window.location.href = '/login'
              }}
              className="pf-nav-link signout"
            >
              {t('nav_sign_out')}
            </button>
          </>
        ) : (
          <Link href="/login" className="pf-btn pf-btn-primary">
            {t('nav_sign_in')}
          </Link>
        )}
      </nav>
    </header>
  )
}
