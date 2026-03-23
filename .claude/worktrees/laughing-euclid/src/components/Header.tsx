'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()

  const isAdminPage = pathname.startsWith('/admin')

  if (loading) return <div className="pf-header" />

  return (
    <header className="pf-header">
      <Link href="/" className="pf-logo">
        join<span>pilates</span>
      </Link>

      <nav className="pf-nav">
        {user ? (
          <>
            {!isAdminPage && (
              <Link
                href="/my-bookings"
                className={`pf-nav-link${pathname === '/my-bookings' ? ' active' : ''}`}
              >
                My Schedule
              </Link>
            )}
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={`pf-nav-link${isAdminPage ? ' active' : ''}`}
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={async () => {
                await signOut()
                window.location.href = '/'
              }}
              className="pf-nav-link signout"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/login" className="pf-btn pf-btn-primary">
            Sign In
          </Link>
        )}
      </nav>
    </header>
  )
}
