'use client'

import { useState, useMemo } from 'react'
import { createClass, createManyClasses } from '@/lib/actions'
import Link from 'next/link'
import Header from '@/components/Header'
import { useLanguage } from '@/context/LanguageContext'

const DURATIONS = [
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '75 min', value: 75 },
  { label: '90 min', value: 90 },
]

const WEEKDAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
]

const MINUTES = [0, 15, 30, 45]
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const pad = (n: number) => String(n).padStart(2, '0')

// Convert local date+hour+minute to a UTC ISO string so the server stores
// the correct moment regardless of what timezone Vercel runs in.
function toUtcISO(dateStr: string, hour: number, minute: number): string {
  return new Date(`${dateStr}T${pad(hour)}:${pad(minute)}:00`).toISOString()
}

export default function AddClassPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'single' | 'recurring'>('single')

  // Shared fields
  const [type, setType] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [name, setName] = useState('')
  const [instructor, setInstructor] = useState('')
  const [capacity, setCapacity] = useState(4)

  // Single mode: date + hour + minute
  const [singleDate, setSingleDate] = useState('')
  const [singleHour, setSingleHour] = useState(9)
  const [singleMinute, setSingleMinute] = useState(0)

  // Recurring mode: hour + minute + days + date range
  const [classHour, setClassHour] = useState(9)
  const [classMinute, setClassMinute] = useState(0)
  const [days, setDays] = useState<Set<number>>(new Set())
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')

  const occurrences = useMemo<string[]>(() => {
    if (days.size === 0 || !rangeStart || !rangeEnd) return []
    const start = new Date(rangeStart + 'T00:00:00')
    const end = new Date(rangeEnd + 'T00:00:00')
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return []
    const result: string[] = []
    const current = new Date(start)
    while (current <= end && result.length < 200) {
      if (days.has(current.getDay())) {
        const dateStr = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`
        result.push(toUtcISO(dateStr, classHour, classMinute))
      }
      current.setDate(current.getDate() + 1)
    }
    return result
  }, [days, classHour, classMinute, rangeStart, rangeEnd])

  const toggleDay = (day: number) => {
    setDays(prev => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const handleTypeChange = (newType: 'IN_PERSON' | 'ONLINE') => {
    setType(newType)
    setCapacity(newType === 'IN_PERSON' ? 4 : 5)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'recurring' && occurrences.length === 0) {
      setError(t('add_class_no_match'))
      return
    }

    setLoading(true)

    let result
    if (mode === 'single') {
      const startTime = toUtcISO(singleDate, singleHour, singleMinute)
      result = await createClass({ name, instructor, startTime, durationMinutes, capacity, type })
    } else {
      result = await createManyClasses(
        occurrences.map(st => ({ name, instructor, startTime: st, durationMinutes, capacity, type }))
      )
    }

    setLoading(false)
    if (result.success) {
      window.location.href = '/admin'
    } else {
      setError(result.error ?? t('add_class_no_match'))
    }
  }

  const submitLabel = loading
    ? t('add_class_creating')
    : mode === 'single'
    ? t('add_class_submit_single')
    : occurrences.length === 1
    ? t('add_class_submit_multi', { n: 1 })
    : occurrences.length > 1
    ? t('add_class_submit_multi', { n: occurrences.length })
    : t('add_class_submit_single')

  const capacityHint = type === 'IN_PERSON'
    ? t('add_class_capacity_hint', { hint: t('add_class_capacity_hint_in') })
    : t('add_class_capacity_hint', { hint: t('add_class_capacity_hint_online') })

  const selectStyle: React.CSSProperties = {
    padding: '0.65rem 0.9rem',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg)',
    color: 'var(--fg)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.9rem',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23919682' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    paddingRight: '2.25rem',
  }

  const minutePillStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '0.65rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    border: `2px solid ${active ? 'var(--sage)' : 'var(--border)'}`,
    background: active ? 'var(--accent-bg)' : 'var(--bg)',
    color: active ? 'var(--forest)' : 'var(--fg-muted)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'center' as const,
  })

  const TimePicker = ({ hour, minute, onHour, onMinute }: {
    hour: number; minute: number
    onHour: (h: number) => void; onMinute: (m: number) => void
  }) => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <select value={hour} onChange={e => onHour(Number(e.target.value))} style={{ ...selectStyle, width: '90px' }}>
        {HOURS.map(h => (
          <option key={h} value={h}>{pad(h)}</option>
        ))}
      </select>
      <span style={{ fontSize: '1.1rem', color: 'var(--fg-muted)', fontWeight: 700, flexShrink: 0 }}>:</span>
      <div style={{ display: 'flex', gap: '0.35rem', flex: 1 }}>
        {MINUTES.map(m => (
          <button key={m} type="button" onClick={() => onMinute(m)} style={minutePillStyle(minute === m)}>
            {pad(m)}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* Back + heading */}
          <div style={{ marginBottom: '2rem' }}>
            <Link
              href="/admin"
              className="pf-link"
              style={{ fontSize: '0.72rem', display: 'inline-block', marginBottom: '1.5rem' }}
            >
              {t('common_back_dashboard')}
            </Link>
            <p className="pf-eyebrow">{t('admin_eyebrow')}</p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '2.75rem',
              fontWeight: 300,
              lineHeight: 1.1,
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
              marginBottom: '0.4rem',
            }}>
              {t('add_class_heading')}{' '}
              <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>{t('add_class_heading_em')}</em>
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
              {t('add_class_subtext')}
            </p>
          </div>

          {/* Mode tab switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {(['single', 'recurring'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null) }}
                style={{
                  padding: '0.7rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${mode === m ? 'var(--sage)' : 'var(--border)'}`,
                  background: mode === m ? 'var(--accent-bg)' : 'var(--bg-card)',
                  color: mode === m ? 'var(--forest)' : 'var(--fg-muted)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'single' ? t('add_class_tab_single') : t('add_class_tab_recurring')}
              </button>
            ))}
          </div>

          {/* Form card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            boxShadow: 'var(--shadow)',
          }}>
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Class Type */}
              <div className="pf-field">
                <label className="pf-label">{t('add_class_type')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {(['IN_PERSON', 'ONLINE'] as const).map((ct) => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => handleTypeChange(ct)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${type === ct ? (ct === 'IN_PERSON' ? 'var(--clay)' : 'var(--sage)') : 'var(--border)'}`,
                        background: type === ct ? (ct === 'IN_PERSON' ? '#FAF1EE' : 'var(--accent-bg)') : 'var(--bg)',
                        color: type === ct ? (ct === 'IN_PERSON' ? '#7a4a3a' : 'var(--forest)') : 'var(--fg-muted)',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {ct === 'IN_PERSON' ? t('add_class_in_person') : t('add_class_online')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Name */}
              <div className="pf-field">
                <label className="pf-label">{t('add_class_name')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('add_class_name_placeholder')}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pf-input"
                />
              </div>

              {/* Instructor */}
              <div className="pf-field">
                <label className="pf-label">{t('add_class_instructor')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('add_class_instructor_placeholder')}
                  value={instructor}
                  onChange={e => setInstructor(e.target.value)}
                  className="pf-input"
                />
              </div>

              {/* Duration */}
              <div className="pf-field">
                <label className="pf-label">{t('add_class_duration')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDurationMinutes(d.value)}
                      style={{
                        padding: '0.7rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${durationMinutes === d.value ? 'var(--sage)' : 'var(--border)'}`,
                        background: durationMinutes === d.value ? 'var(--accent-bg)' : 'var(--bg)',
                        color: durationMinutes === d.value ? 'var(--forest)' : 'var(--fg-muted)',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity */}
              <div className="pf-field">
                <label className="pf-label">{t('add_class_capacity')}</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={capacity}
                  onChange={e => setCapacity(parseInt(e.target.value) || 1)}
                  className="pf-input"
                />
                <span className="pf-input-hint">{capacityHint}</span>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--border-lt)', margin: '0.25rem 0' }} />

              {/* ── Single mode ── */}
              {mode === 'single' && (
                <div className="pf-field">
                  <label className="pf-label">{t('add_class_datetime')}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      type="date"
                      required
                      value={singleDate}
                      onChange={e => setSingleDate(e.target.value)}
                      className="pf-input"
                    />
                    <TimePicker
                      hour={singleHour} minute={singleMinute}
                      onHour={setSingleHour} onMinute={setSingleMinute}
                    />
                  </div>
                </div>
              )}

              {/* ── Recurring mode ── */}
              {mode === 'recurring' && (
                <>
                  <div className="pf-field">
                    <label className="pf-label">{t('add_class_days')}</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {WEEKDAYS.map(d => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDay(d.value)}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius-sm)',
                            border: `2px solid ${days.has(d.value) ? 'var(--sage)' : 'var(--border)'}`,
                            background: days.has(d.value) ? 'var(--accent-bg)' : 'var(--bg)',
                            color: days.has(d.value) ? 'var(--forest)' : 'var(--fg-muted)',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            flexShrink: 0,
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pf-field">
                    <label className="pf-label">{t('add_class_time')}</label>
                    <TimePicker
                      hour={classHour} minute={classMinute}
                      onHour={setClassHour} onMinute={setClassMinute}
                    />
                  </div>

                  <div className="pf-field">
                    <label className="pf-label">{t('add_class_range')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--fg-muted)', display: 'block', marginBottom: '0.3rem' }}>
                          {t('add_class_from')}
                        </span>
                        <input
                          type="date"
                          required
                          value={rangeStart}
                          onChange={e => setRangeStart(e.target.value)}
                          className="pf-input"
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--fg-muted)', display: 'block', marginBottom: '0.3rem' }}>
                          {t('add_class_to')}
                        </span>
                        <input
                          type="date"
                          required
                          value={rangeEnd}
                          onChange={e => setRangeEnd(e.target.value)}
                          className="pf-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live preview */}
                  {occurrences.length > 0 && (
                    <div style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-bg)',
                      border: '1px solid var(--accent-lt)',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.5rem',
                    }}>
                      <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.6rem',
                        fontWeight: 400,
                        color: 'var(--forest)',
                        lineHeight: 1,
                      }}>
                        {occurrences.length}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--forest)' }}>
                        {occurrences.length === 1
                          ? t('add_class_preview_session')
                          : t('add_class_preview_sessions', { n: occurrences.length })}
                        {occurrences.length > 1 && (
                          <>
                            {' · '}
                            {new Date(occurrences[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' → '}
                            {new Date(occurrences[occurrences.length - 1]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  {rangeStart && rangeEnd && days.size > 0 && occurrences.length === 0 && (
                    <div style={{
                      padding: '0.65rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--warn-lt)',
                      border: '1px solid #e8cac3',
                      fontSize: '0.75rem',
                      color: 'var(--warn)',
                    }}>
                      {t('add_class_no_match')}
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="pf-btn pf-btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.85rem 1.25rem',
                  marginTop: '0.25rem',
                  fontSize: '0.72rem',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {submitLabel}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
