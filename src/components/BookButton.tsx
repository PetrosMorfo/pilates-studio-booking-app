'use client'

import { useAuth } from '@/context/AuthContext'
import { bookClass } from '@/lib/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

type Props = {
  classId: string
  isBooked: boolean
  waitlistPosition?: number
  isFull: boolean
}

export default function BookButton({ classId, isBooked, waitlistPosition, isFull }: Props) {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleBooking = async () => {
    if (!user) { router.push('/login'); return }
    setLoading(true)
    setError(null)
    const result = await bookClass(classId)
    setLoading(false)

    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? 'Something went wrong.')
    }
  }

  if (authLoading) {
    return (
      <div style={{
        width: '80px',
        height: '30px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--accent-bg)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
    )
  }

  // Already booked
  if (isBooked) {
    return (
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '0.3rem 0.7rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--accent-bg)',
        color: 'var(--forest)',
        border: '1px solid var(--accent-lt)',
        whiteSpace: 'nowrap',
      }}>
        {t('book_booked')} ✓
      </span>
    )
  }

  // On waitlist
  if (waitlistPosition !== undefined) {
    return (
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '0.3rem 0.7rem',
        borderRadius: 'var(--radius-sm)',
        background: '#FAF1EE',
        color: 'var(--clay)',
        border: '1px solid #EECFCA',
        whiteSpace: 'nowrap',
      }}>
        {t('book_on_waitlist')} #{waitlistPosition}
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
      {/* Full — offer to join waitlist */}
      {isFull ? (
        <button
          onClick={handleBooking}
          disabled={loading}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--blush)',
            color: '#7a4a3a',
            border: '1px solid #ddbbb5',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
            whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
        >
          {loading ? t('book_booking') : t('book_join_waitlist')}
        </button>
      ) : (
        <button
          onClick={handleBooking}
          disabled={loading}
          className="pf-btn pf-btn-primary"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? t('book_booking') : t('book_book')}
        </button>
      )}
      {error && (
        <span style={{ fontSize: '0.65rem', color: 'var(--warn)', textAlign: 'right', maxWidth: '160px' }}>
          {error}
        </span>
      )}
    </div>
  )
}
