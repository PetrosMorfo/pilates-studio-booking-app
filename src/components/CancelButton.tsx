'use client'

import { cancelBooking, leaveWaitlist } from '@/lib/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

type Props =
  | { type: 'booking'; id: string; classTime: Date }
  | { type: 'waitlist'; id: string }

export default function CancelButton(props: Props) {
  const { t } = useLanguage()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isWithin2Hours = props.type === 'booking'
    ? (new Date(props.classTime).getTime() - Date.now()) < 2 * 60 * 60 * 1000
    : false

  const handleCancel = async () => {
    setLoading(true)
    setError(null)
    const result = props.type === 'waitlist'
      ? await leaveWaitlist(props.id)
      : await cancelBooking(props.id)
    setLoading(false)

    if (result.success) {
      router.refresh()
    } else {
      setConfirming(false)
      setError(result.error ?? 'Something went wrong.')
    }
  }

  if (isWithin2Hours) {
    return (
      <span
        title="Cancellations close 2 hours before class"
        style={{
          fontSize: '0.68rem',
          fontWeight: 500,
          color: 'var(--fg-light)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        No cancels &lt;2h
      </span>
    )
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>
            {props.type === 'waitlist' ? t('cancel_confirm_waitlist') : t('cancel_confirm_booking')}
          </span>
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--warn)',
              fontFamily: "'DM Sans', sans-serif",
              padding: 0,
            }}
          >
            {loading ? '…' : t('cancel_yes')}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null) }}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--fg-muted)',
              fontFamily: "'DM Sans', sans-serif",
              padding: 0,
            }}
          >
            {t('cancel_no')}
          </button>
        </div>
        {error && (
          <span style={{ fontSize: '0.65rem', color: 'var(--warn)' }}>{error}</span>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
      <button
        onClick={() => setConfirming(true)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.68rem',
          fontWeight: 600,
          color: 'var(--fg-muted)',
          fontFamily: "'DM Sans', sans-serif",
          padding: 0,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--warn)' }}
        onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--fg-muted)' }}
      >
        {props.type === 'waitlist' ? t('cancel_leave') : t('cancel_cancel')}
      </button>
      {error && (
        <span style={{ fontSize: '0.65rem', color: 'var(--warn)' }}>{error}</span>
      )}
    </div>
  )
}
