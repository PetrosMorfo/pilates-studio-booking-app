'use client'

import { useState } from 'react'
import Link from 'next/link'
import DeleteClassButton from './DeleteClassButton'
import { useLanguage } from '@/context/LanguageContext'

type CalendarClass = {
  id: string
  name: string
  startTime: string
  endTime: string
  instructor: string
  type: string
  capacity: number
  bookings: { user: { name: string | null; email: string } }[]
  waitlist: { id: string }[]
}

type Props = {
  classes: CalendarClass[]
  locale: string
}

const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAYS_GR = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_GR = ['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος','Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος']

export default function AdminClassCalendar({ classes, locale }: Props) {
  const { t, lang } = useLanguage()
  const isGr = lang === 'gr'
  const DAY_NAMES = isGr ? DAYS_GR : DAYS_EN
  const MONTH_NAMES = isGr ? MONTHS_GR : MONTHS_EN

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    // Default to today if there are classes today, otherwise null
    return today.toISOString().slice(0, 10)
  })

  // Build a map: dateKey (YYYY-MM-DD) → classes[]
  const classMap: Record<string, CalendarClass[]> = {}
  for (const cls of classes) {
    const key = new Date(cls.startTime).toLocaleDateString('sv')
    if (!classMap[key]) classMap[key] = []
    classMap[key].push(cls)
  }

  // Calendar grid
  const firstDay = new Date(year, month, 1)
  // Shift so week starts on Monday (0=Mon … 6=Sun)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const selectedClasses = selectedDate ? (classMap[selectedDate] ?? []) : []
  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null

  const totalClasses = Object.values(classMap).flat().length

  return (
    <div>
      {/* Calendar card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
      }}>
        {/* Month navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-lt)',
        }}>
          <button onClick={prevMonth} style={navBtnStyle}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.15rem', fontWeight: 600, color: 'var(--fg)' }}>
              {MONTH_NAMES[month]} {year}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--fg-muted)', marginTop: '0.1rem' }}>
              {totalClasses} {isGr ? 'μαθήματα συνολικά' : 'total classes'}
            </div>
          </div>
          <button onClick={nextMonth} style={navBtnStyle}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-lt)' }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ padding: '0.5rem 0', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-light)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} style={{ minHeight: '64px', borderBottom: '1px solid var(--border-lt)', borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border-lt)' : 'none' }} />

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayClasses = classMap[dateKey] ?? []
            const isToday = dateKey === today.toISOString().slice(0, 10)
            const isSelected = dateKey === selectedDate
            const isPast = new Date(dateKey) < today
            const hasClasses = dayClasses.length > 0

            return (
              <div
                key={dateKey}
                onClick={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
                style={{
                  minHeight: '64px',
                  padding: '0.4rem',
                  borderBottom: '1px solid var(--border-lt)',
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border-lt)' : 'none',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--accent-bg)' : 'transparent',
                  transition: 'background 0.12s',
                  position: 'relative',
                }}
              >
                {/* Day number */}
                <div style={{
                  width: '26px', height: '26px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: isToday ? 'var(--forest)' : 'transparent',
                  color: isToday ? '#fff' : isPast ? 'var(--fg-light)' : 'var(--fg)',
                  fontSize: '0.8rem',
                  fontWeight: isToday || isSelected ? 700 : 400,
                  marginBottom: '0.25rem',
                }}>
                  {day}
                </div>

                {/* Class count dots / pill */}
                {hasClasses && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayClasses.slice(0, 3).map(cls => (
                      <div key={cls.id} style={{
                        height: '4px',
                        borderRadius: '2px',
                        background: cls.bookings.length >= cls.capacity
                          ? 'var(--clay)'
                          : isPast ? 'var(--fg-light)' : 'var(--forest)',
                      }} />
                    ))}
                    {dayClasses.length > 3 && (
                      <div style={{ fontSize: '0.58rem', color: 'var(--fg-muted)', lineHeight: 1 }}>
                        +{dayClasses.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '0.6rem',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--fg)' }}>
              {selectedDateObj?.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            {selectedClasses.length === 0 && (
              <Link href="/admin/add-class" style={{ fontSize: '0.75rem', color: 'var(--forest)', textDecoration: 'none', fontWeight: 600 }}>
                + {t('admin_add_class')}
              </Link>
            )}
          </div>

          {selectedClasses.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '1.5rem',
              textAlign: 'center', color: 'var(--fg-muted)', fontSize: '0.85rem',
            }}>
              {isGr ? 'Δεν υπάρχουν μαθήματα αυτή την ημέρα.' : 'No classes on this day.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedClasses
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map(cls => {
                  const start = new Date(cls.startTime)
                  const end = new Date(cls.endTime)
                  const durationMins = Math.round((end.getTime() - start.getTime()) / 60000)
                  const isFull = cls.bookings.length >= cls.capacity
                  const isPast = start < new Date()

                  return (
                    <div key={cls.id} style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${isFull ? 'var(--clay)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      padding: '0.85rem 1.1rem',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      opacity: isPast ? 0.65 : 1,
                    }}>
                      {/* Time block */}
                      <div style={{ flexShrink: 0, textAlign: 'center', width: '48px' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--fg)', lineHeight: 1 }}>
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--fg-light)', marginTop: '2px' }}>
                          {durationMins}′
                        </div>
                      </div>

                      <div style={{ width: '1px', height: '36px', background: 'var(--border-lt)', flexShrink: 0 }} />

                      {/* Class info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600, color: 'var(--fg)' }}>
                            {cls.name}
                          </span>
                          <span className={cls.type === 'ONLINE' ? 'pf-badge pf-badge-sage' : 'pf-badge pf-badge-blush'}>
                            {cls.type === 'ONLINE' ? t('class_online') : t('class_studio')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--fg-muted)' }}>
                          {cls.instructor}
                          {cls.bookings.length > 0 && (
                            <span style={{ marginLeft: '0.5rem', color: 'var(--fg-light)' }}>
                              · {cls.bookings.map(b => b.user.name || b.user.email).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Capacity + actions */}
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isFull ? 'var(--clay)' : 'var(--forest)' }}>
                            {cls.bookings.length}
                          </span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--border)' }}>/{cls.capacity}</span>
                          {cls.waitlist.length > 0 && (
                            <div style={{ fontSize: '0.62rem', color: 'var(--clay)', marginTop: '0.1rem' }}>
                              +{cls.waitlist.length} {t('admin_waitlisted')}
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/admin/edit-class/${cls.id}`}
                          style={{
                            fontSize: '0.72rem', fontWeight: 600,
                            color: 'var(--forest)', textDecoration: 'none',
                            padding: '0.3rem 0.65rem',
                            border: '1px solid var(--accent-lt)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--accent-bg)',
                          }}
                        >
                          {t('admin_edit')}
                        </Link>
                        <DeleteClassButton classId={cls.id} />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', width: '32px', height: '32px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', fontSize: '1.1rem', color: 'var(--fg-muted)',
}
