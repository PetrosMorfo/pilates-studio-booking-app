'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClass, createManyClasses } from '@/lib/actions'
import Link from 'next/link'
import Header from '@/components/Header'

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

export default function AddClassPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'single' | 'recurring'>('single')

  // Shared fields
  const [type, setType] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [name, setName] = useState('')
  const [instructor, setInstructor] = useState('')
  const [capacity, setCapacity] = useState(4)

  // Single mode
  const [startTime, setStartTime] = useState('')

  // Recurring mode
  const [days, setDays] = useState<Set<number>>(new Set())
  const [classTime, setClassTime] = useState('')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')

  const occurrences = useMemo<string[]>(() => {
    if (days.size === 0 || !classTime || !rangeStart || !rangeEnd) return []
    const start = new Date(rangeStart + 'T00:00:00')
    const end = new Date(rangeEnd + 'T00:00:00')
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return []
    const result: string[] = []
    const current = new Date(start)
    const pad = (n: number) => String(n).padStart(2, '0')
    while (current <= end && result.length < 200) {
      if (days.has(current.getDay())) {
        const dateStr = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`
        result.push(`${dateStr}T${classTime}`)
      }
      current.setDate(current.getDate() + 1)
    }
    return result
  }, [days, classTime, rangeStart, rangeEnd])

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
      setError('No sessions match your selection. Check that the selected days fall within the date range.')
      return
    }

    setLoading(true)

    let result
    if (mode === 'single') {
      result = await createClass({ name, instructor, startTime, durationMinutes, capacity, type })
    } else {
      result = await createManyClasses(
        occurrences.map(st => ({ name, instructor, startTime: st, durationMinutes, capacity, type }))
      )
    }

    setLoading(false)
    if (result.success) {
      router.push('/admin')
    } else {
      setError(result.error ?? 'Failed to create class.')
    }
  }

  const submitLabel = loading
    ? 'Creating…'
    : mode === 'single'
      ? 'Create Class'
      : occurrences.length > 0
        ? `Create ${occurrences.length} Class${occurrences.length === 1 ? '' : 'es'}`
        : 'Create Classes'

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
              ← Back to Dashboard
            </Link>
            <p className="pf-eyebrow">Admin</p>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '2.75rem',
              fontWeight: 300,
              lineHeight: 1.1,
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
              marginBottom: '0.4rem',
            }}>
              Add <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>classes</em>
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
              Schedule one session or a full recurring timetable.
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
                {m === 'single' ? 'Single Class' : 'Recurring Schedule'}
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
                <label className="pf-label">Class Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {(['IN_PERSON', 'ONLINE'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTypeChange(t)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${type === t ? (t === 'IN_PERSON' ? 'var(--clay)' : 'var(--sage)') : 'var(--border)'}`,
                        background: type === t ? (t === 'IN_PERSON' ? '#FAF1EE' : 'var(--accent-bg)') : 'var(--bg)',
                        color: type === t ? (t === 'IN_PERSON' ? '#7a4a3a' : 'var(--forest)') : 'var(--fg-muted)',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {t === 'IN_PERSON' ? 'In-Person' : 'Online'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class Name */}
              <div className="pf-field">
                <label className="pf-label">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Flow, Reformer Basics"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pf-input"
                />
              </div>

              {/* Instructor */}
              <div className="pf-field">
                <label className="pf-label">Instructor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sofia Martins"
                  value={instructor}
                  onChange={e => setInstructor(e.target.value)}
                  className="pf-input"
                />
              </div>

              {/* Duration */}
              <div className="pf-field">
                <label className="pf-label">Duration</label>
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
                <label className="pf-label">Capacity (spots)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={capacity}
                  onChange={e => setCapacity(parseInt(e.target.value) || 1)}
                  className="pf-input"
                />
                <span className="pf-input-hint">
                  Default: {type === 'IN_PERSON' ? '4 for in-person' : '5 for online'}. Adjust if needed.
                </span>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--border-lt)', margin: '0.25rem 0' }} />

              {/* ── Single mode: one datetime picker ── */}
              {mode === 'single' && (
                <div className="pf-field">
                  <label className="pf-label">Date & Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="pf-input"
                  />
                </div>
              )}

              {/* ── Recurring mode: days + time + date range ── */}
              {mode === 'recurring' && (
                <>
                  <div className="pf-field">
                    <label className="pf-label">Days of Week</label>
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
                    <label className="pf-label">Class Time</label>
                    <input
                      type="time"
                      required
                      value={classTime}
                      onChange={e => setClassTime(e.target.value)}
                      className="pf-input"
                    />
                  </div>

                  <div className="pf-field">
                    <label className="pf-label">Date Range</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--fg-muted)', display: 'block', marginBottom: '0.3rem' }}>From</span>
                        <input
                          type="date"
                          required
                          value={rangeStart}
                          onChange={e => setRangeStart(e.target.value)}
                          className="pf-input"
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--fg-muted)', display: 'block', marginBottom: '0.3rem' }}>To</span>
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
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '1.6rem',
                        fontWeight: 400,
                        color: 'var(--forest)',
                        lineHeight: 1,
                      }}>
                        {occurrences.length}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--forest)' }}>
                        {occurrences.length === 1 ? 'session' : 'sessions'} will be created
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

                  {rangeStart && rangeEnd && days.size > 0 && classTime && occurrences.length === 0 && (
                    <div style={{
                      padding: '0.65rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--warn-lt)',
                      border: '1px solid #e8cac3',
                      fontSize: '0.75rem',
                      color: 'var(--warn)',
                    }}>
                      No matching dates in range. Make sure the selected days fall within your date window.
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
