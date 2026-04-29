import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import CheckInToggle from '@/components/CheckInToggle'
import Header from '@/components/Header'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getLang } from '@/lib/language'
import { translate } from '@/lib/translations'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'ADMIN') redirect('/')

  const lang = await getLang()
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key)
  const locale = lang === 'gr' ? 'el-GR' : 'en-US'

  const allClasses = await prisma.pilatesClass.findMany({
    include: {
      bookings: {
        include: { user: { select: { id: true, name: true, email: true, credits: true } } }
      },
      waitlist: true
    },
    orderBy: { startTime: 'asc' }
  })

  // Use today's date in Athens timezone as the cutoff so that all of today's
  // classes stay in the "upcoming" section (for check-in) even after they start.
  const todayAthens = new Date().toLocaleDateString('sv', { timeZone: 'Europe/Athens' }) // YYYY-MM-DD
  const upcoming = allClasses.filter(c =>
    new Date(c.startTime).toLocaleDateString('sv', { timeZone: 'Europe/Athens' }) >= todayAthens
  )
  const past = allClasses.filter(c =>
    new Date(c.startTime).toLocaleDateString('sv', { timeZone: 'Europe/Athens' }) < todayAthens
  )

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="pf-page-md">

          <div style={{ marginBottom: '2rem' }}>
            <Link href="/admin" className="pf-link" style={{ fontSize: '0.72rem', display: 'inline-block', marginBottom: '1.5rem' }}>
              {t('common_back_dashboard')}
            </Link>
            <p className="pf-eyebrow">{t('admin_eyebrow')}</p>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '3.25rem',
              fontWeight: 300,
              lineHeight: 1.1,
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
            }}>
              {t('attendance_heading')} <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>{t('attendance_heading_em')}</em>
            </h1>
          </div>

          {/* Upcoming */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3.5rem' }}>
            {upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--border)' }}>{t('attendance_no_classes')}</p>
              </div>
            ) : (
              upcoming.map(cls => <ClassCard key={cls.id} cls={cls} locale={locale} />)
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <>
              <div className="pf-section-rule" style={{ marginBottom: '1rem' }}>
                <span className="pf-section-label" style={{ color: 'var(--fg-light)' }}>{t('attendance_past')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.5 }}>
                {past.slice().reverse().map(cls => <ClassCard key={cls.id} cls={cls} isPast locale={locale} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

type ClassCardProps = {
  cls: {
    id: string
    name: string
    type: string
    startTime: Date
    capacity: number
    bookings: {
      id: string
      checkedIn: boolean
      user: { id: string; name: string | null; email: string; credits: number }
    }[]
    waitlist: { id: string }[]
  }
  isPast?: boolean
  locale: string
}

function ClassCard({ cls, isPast, locale }: ClassCardProps) {
  const checkedInCount = cls.bookings.filter(b => b.checkedIn).length
  const isOnline = cls.type === 'ONLINE'

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Class header */}
      <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border-lt)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: 'var(--fg)', fontWeight: 400 }}>
              {cls.name}
            </h2>
            <span className={isOnline ? 'pf-badge pf-badge-sage' : 'pf-badge pf-badge-blush'}>
              {isOnline ? 'Online' : 'Studio'}
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
            {new Date(cls.startTime).toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}
            <span style={{ color: 'var(--border)', margin: '0 0.35rem' }}>·</span>
            {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Athens' })}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {cls.waitlist.length > 0 && (
            <span className="pf-badge" style={{ background: '#FBF3E2', color: '#D4A853', border: '1px solid #EDD99A' }}>
              +{cls.waitlist.length}
            </span>
          )}
          <span className="pf-badge pf-badge-sage">
            {cls.bookings.length}/{cls.capacity}
          </span>
          {!isPast && cls.bookings.length > 0 && (
            <span className="pf-badge" style={{ background: 'var(--fg)', color: 'var(--bg)' }}>
              ✓ {checkedInCount}
            </span>
          )}
        </div>
      </div>

      {/* Attendance list */}
      <div style={{ padding: '0.5rem 1.5rem 1rem' }}>
        {cls.bookings.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--fg-light)', fontStyle: 'italic', padding: '0.75rem 0' }}>
            —
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {cls.bookings.map(b => (
              <li key={b.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0',
                borderTop: '1px solid var(--border-lt)',
                opacity: b.checkedIn ? 0.55 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {!isPast && <CheckInToggle bookingId={b.id} initialStatus={b.checkedIn} />}
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--fg)' }}>
                      {b.user.name || b.user.email}
                    </p>
                    <p style={{
                      fontSize: '0.68rem',
                      marginTop: '0.1rem',
                      color: b.user.credits <= 0 ? 'var(--warn)' : 'var(--fg-light)',
                      fontWeight: b.user.credits <= 0 ? 600 : 400,
                    }}>
                      {b.user.credits} cr
                    </p>
                  </div>
                </div>
                {b.checkedIn && (
                  <span style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--forest)',
                  }}>
                    ✓
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
