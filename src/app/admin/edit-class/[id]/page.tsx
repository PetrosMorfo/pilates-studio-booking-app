'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { updateClass } from '@/lib/actions'
import { useLanguage } from '@/context/LanguageContext'

const CLASS_TYPES = [
  { value: 'IN_PERSON', labelKey: 'class_studio' as const },
  { value: 'ONLINE', labelKey: 'class_online' as const },
]
const DURATIONS = [45, 60, 75, 90]
const MINUTES = [0, 15, 30, 45]
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const pad = (n: number) => String(n).padStart(2, '0')

function toUtcISO(dateStr: string, hour: number, minute: number): string {
  return new Date(`${dateStr}T${pad(hour)}:${pad(minute)}:00`).toISOString()
}

export default function EditClassPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [instructor, setInstructor] = useState('')
  const [classType, setClassType] = useState<'IN_PERSON' | 'ONLINE'>('IN_PERSON')
  const [date, setDate] = useState('')
  const [hour, setHour] = useState(9)
  const [minute, setMinute] = useState(0)
  const [duration, setDuration] = useState(60)
  const [capacity, setCapacity] = useState(10)

  useEffect(() => {
    fetch(`/api/admin/class/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setFetching(false); return }
        setName(data.name)
        setInstructor(data.instructor)
        setClassType(data.type)
        setCapacity(data.capacity)
        const start = new Date(data.startTime)
        const end = new Date(data.endTime)
        const mins = Math.round((end.getTime() - start.getTime()) / 60000)
        setDuration(DURATIONS.includes(mins) ? mins : 60)
        setDate(start.toLocaleDateString('sv')) // YYYY-MM-DD in local tz
        setHour(start.getHours())
        setMinute(MINUTES.includes(start.getMinutes()) ? start.getMinutes() : 0)
        setFetching(false)
      })
      .catch(() => { setError('Failed to load class.'); setFetching(false) })
  }, [id])

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

  const TimePicker = () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <select value={hour} onChange={e => setHour(Number(e.target.value))} style={{ ...selectStyle, width: '90px' }}>
        {HOURS.map(h => <option key={h} value={h}>{pad(h)}</option>)}
      </select>
      <span style={{ fontSize: '1.1rem', color: 'var(--fg-muted)', fontWeight: 700, flexShrink: 0 }}>:</span>
      <div style={{ display: 'flex', gap: '0.35rem', flex: 1 }}>
        {MINUTES.map(m => (
          <button key={m} type="button" onClick={() => setMinute(m)} style={minutePillStyle(minute === m)}>
            {pad(m)}
          </button>
        ))}
      </div>
    </div>
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const startTime = toUtcISO(date, hour, minute)
    const result = await updateClass(id, { name, instructor, startTime, durationMinutes: duration, capacity, type: classType })
    setLoading(false)
    if (result.success) {
      window.location.href = '/admin'
    } else {
      setError(result.error ?? 'Failed to update class.')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--bg)', color: 'var(--fg)',
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
    outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.7rem', fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--fg-muted)', marginBottom: '0.4rem',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2.5rem 1rem' }}>
      <div style={{ maxWidth: '540px', margin: '0 auto' }}>

        <Link href="/admin" style={{ fontSize: '0.78rem', color: 'var(--fg-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '2rem' }}>
          ← {t('edit_class_back')}
        </Link>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.25rem', fontWeight: 600, color: 'var(--fg)', marginBottom: '2rem' }}>
          {t('edit_class_heading')} <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>{t('edit_class_heading_em')}</em>
        </h1>

        {fetching ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {error && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'var(--warn-lt)', border: '1px solid #e8cac3', fontSize: '0.85rem', color: 'var(--warn)' }}>
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label style={labelStyle}>{t('add_class_name')}</label>
              <input style={inputStyle} required value={name} onChange={e => setName(e.target.value)} />
            </div>

            {/* Instructor */}
            <div>
              <label style={labelStyle}>{t('add_class_instructor')}</label>
              <input style={inputStyle} required value={instructor} onChange={e => setInstructor(e.target.value)} />
            </div>

            {/* Type */}
            <div>
              <label style={labelStyle}>{t('add_class_type')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {CLASS_TYPES.map(ct => (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setClassType(ct.value as 'IN_PERSON' | 'ONLINE')}
                    style={{
                      flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${classType === ct.value ? 'var(--forest)' : 'var(--border)'}`,
                      background: classType === ct.value ? 'var(--accent-bg)' : 'var(--bg)',
                      color: classType === ct.value ? 'var(--forest)' : 'var(--fg-muted)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t(ct.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <label style={labelStyle}>{t('add_class_datetime')}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input type="date" style={inputStyle} required value={date} onChange={e => setDate(e.target.value)} />
                <TimePicker />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label style={labelStyle}>{t('add_class_duration')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    style={{
                      flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${duration === d ? 'var(--forest)' : 'var(--border)'}`,
                      background: duration === d ? 'var(--accent-bg)' : 'var(--bg)',
                      color: duration === d ? 'var(--forest)' : 'var(--fg-muted)',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {d}′
                  </button>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label style={labelStyle}>{t('add_class_capacity')}</label>
              <input
                type="number" min={1} max={100} style={{ ...inputStyle, width: '120px' }}
                required value={capacity} onChange={e => setCapacity(Number(e.target.value))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="pf-btn pf-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.78rem', marginTop: '0.5rem', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? t('edit_class_saving') : t('edit_class_submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
