'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminCancelBooking, adminMoveBooking, adminRemoveFromWaitlist, adminBookClass } from '@/lib/actions'
import { useLanguage } from '@/context/LanguageContext'

type UpcomingClass = {
  id: string
  name: string
  startTime: string
  instructor: string
  spotsLeft: number
}

// ─── Cancel / Move a booking ──────────────────────────────────────────────────

type BookingActionsProps = {
  bookingId: string
  upcomingClasses: UpcomingClass[]
}

export function AdminBookingActions({ bookingId, upcomingClasses }: BookingActionsProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'confirmCancel' | 'move'>('idle')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    setLoading(true)
    setError(null)
    const result = await adminCancelBooking(bookingId)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      setMode('idle')
      setError(result.error ?? 'Failed.')
    }
  }

  const handleMove = async () => {
    if (!selectedClassId) return
    setLoading(true)
    setError(null)
    const result = await adminMoveBooking(bookingId, selectedClassId)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      setMode('idle')
      setError(result.error ?? 'Failed.')
    }
  }

  if (mode === 'confirmCancel') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>
            {t('cancel_confirm_booking')}
          </span>
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer', fontSize: '0.65rem', fontWeight: 700, color: 'var(--warn)', fontFamily: "'DM Sans', sans-serif", padding: 0 }}
          >
            {loading ? '…' : t('cancel_yes')}
          </button>
          <button
            onClick={() => { setMode('idle'); setError(null) }}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, color: 'var(--fg-muted)', fontFamily: "'DM Sans', sans-serif", padding: 0 }}
          >
            {t('cancel_no')}
          </button>
        </div>
        {error && <span style={{ fontSize: '0.6rem', color: 'var(--warn)' }}>{error}</span>}
      </div>
    )
  }

  if (mode === 'move') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            style={{
              fontSize: '0.68rem',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              fontFamily: "'DM Sans', sans-serif",
              maxWidth: '200px',
            }}
          >
            <option value="">{t('client_select_class')}</option>
            {upcomingClasses.map(cls => (
              <option key={cls.id} value={cls.id}>
                {new Date(cls.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {' '}
                {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                {' — '}{cls.name}
                {cls.spotsLeft === 0 ? ' (full)' : ` (${cls.spotsLeft} left)`}
              </option>
            ))}
          </select>
          <button
            onClick={handleMove}
            disabled={loading || !selectedClassId}
            style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              background: selectedClassId ? 'var(--forest)' : 'var(--border)',
              color: selectedClassId ? 'white' : 'var(--fg-light)',
              cursor: !selectedClassId || loading ? 'default' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {loading ? '…' : t('client_confirm')}
          </button>
          <button
            onClick={() => { setMode('idle'); setError(null); setSelectedClassId('') }}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', color: 'var(--fg-muted)', fontFamily: "'DM Sans', sans-serif", padding: 0 }}
          >
            ✕
          </button>
        </div>
        {error && <span style={{ fontSize: '0.6rem', color: 'var(--warn)' }}>{error}</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => setMode('move')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, color: 'var(--fg-muted)', fontFamily: "'DM Sans', sans-serif", padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--forest)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--fg-muted)' }}
        >
          {t('client_move')}
        </button>
        <button
          onClick={() => setMode('confirmCancel')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, color: 'var(--fg-muted)', fontFamily: "'DM Sans', sans-serif", padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--warn)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--fg-muted)' }}
        >
          {t('client_cancel')}
        </button>
      </div>
      {error && <span style={{ fontSize: '0.6rem', color: 'var(--warn)' }}>{error}</span>}
    </div>
  )
}

// ─── Remove from waitlist ─────────────────────────────────────────────────────

type WaitlistRemoveProps = {
  waitlistId: string
}

export function AdminWaitlistRemove({ waitlistId }: WaitlistRemoveProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRemove = async () => {
    setLoading(true)
    setError(null)
    const result = await adminRemoveFromWaitlist(waitlistId)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      setConfirming(false)
      setError(result.error ?? 'Failed.')
    }
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>
            {t('cancel_confirm_waitlist')}
          </span>
          <button
            onClick={handleRemove}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer', fontSize: '0.65rem', fontWeight: 700, color: 'var(--warn)', fontFamily: "'DM Sans', sans-serif", padding: 0 }}
          >
            {loading ? '…' : t('cancel_yes')}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null) }}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, color: 'var(--fg-muted)', fontFamily: "'DM Sans', sans-serif", padding: 0 }}
          >
            {t('cancel_no')}
          </button>
        </div>
        {error && <span style={{ fontSize: '0.6rem', color: 'var(--warn)' }}>{error}</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
      <button
        onClick={() => setConfirming(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600, color: 'var(--fg-muted)', fontFamily: "'DM Sans', sans-serif", padding: 0, transition: 'color 0.15s' }}
        onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--warn)' }}
        onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--fg-muted)' }}
      >
        {t('client_remove')}
      </button>
      {error && <span style={{ fontSize: '0.6rem', color: 'var(--warn)' }}>{error}</span>}
    </div>
  )
}

// ─── Add to a class ───────────────────────────────────────────────────────────

type AddToClassProps = {
  userId: string
  upcomingClasses: UpcomingClass[]
}

export function AdminAddToClass({ userId, upcomingClasses }: AddToClassProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!selectedClassId) return
    setLoading(true)
    setError(null)
    setResult(null)
    const res = await adminBookClass(userId, selectedClassId)
    setLoading(false)
    if (res.success) {
      const r = res as { success: true; waitlisted: boolean; position?: number }
      setResult(r.waitlisted ? `✓ Added to waitlist (#${r.position})` : '✓ Booked')
      setOpen(false)
      setSelectedClassId('')
      setTimeout(() => { setResult(null); router.refresh() }, 1500)
    } else {
      setError(res.error ?? 'Failed.')
    }
  }

  if (!open) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <button
          onClick={() => setOpen(true)}
          className="pf-btn pf-btn-ghost"
          style={{ fontSize: '0.7rem', padding: '0.4rem 0.85rem' }}
        >
          + {t('client_add_to_class')}
        </button>
        {result && <span style={{ fontSize: '0.65rem', color: 'var(--forest)' }}>{result}</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          style={{
            fontSize: '0.68rem',
            padding: '0.3rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--fg)',
            fontFamily: "'DM Sans', sans-serif",
            maxWidth: '240px',
          }}
        >
          <option value="">{t('client_select_class')}</option>
          {upcomingClasses.map(cls => (
            <option key={cls.id} value={cls.id}>
              {new Date(cls.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {' '}
              {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              {' — '}{cls.name}
              {cls.spotsLeft === 0 ? ' (full)' : ` (${cls.spotsLeft} left)`}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={loading || !selectedClassId}
          className="pf-btn pf-btn-primary"
          style={{ fontSize: '0.68rem', padding: '0.3rem 0.75rem', opacity: !selectedClassId || loading ? 0.5 : 1 }}
        >
          {loading ? '…' : t('client_confirm')}
        </button>
        <button
          onClick={() => { setOpen(false); setError(null); setSelectedClassId('') }}
          disabled={loading}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.65rem', color: 'var(--fg-muted)', fontFamily: "'DM Sans', sans-serif", padding: 0 }}
        >
          ✕
        </button>
      </div>
      {error && <span style={{ fontSize: '0.6rem', color: 'var(--warn)' }}>{error}</span>}
    </div>
  )
}
