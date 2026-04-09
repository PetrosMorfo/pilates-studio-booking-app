import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CancelButton from '@/components/CancelButton'
import Header from '@/components/Header'
import Link from 'next/link'
import { getLang } from '@/lib/language'
import { translate } from '@/lib/translations'

export const dynamic = 'force-dynamic'

export default async function MyBookingsPage() {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lang = await getLang()
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
    translate(lang, key, vars)

  const locale = lang === 'gr' ? 'el-GR' : 'en-US'

  const [dbUser, myBookings, myWaitlist] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { credits: true, name: true } }),
    prisma.booking.findMany({
      where: { userId: user.id },
      include: { pilatesClass: true },
      orderBy: { pilatesClass: { startTime: 'asc' } }
    }),
    prisma.waitlist.findMany({
      where: { userId: user.id },
      include: { pilatesClass: true },
      orderBy: { position: 'asc' }
    })
  ])

  const credits = dbUser?.credits ?? 0
  const firstName = dbUser?.name?.split(' ')[0] ?? null
  const upcomingBookings = myBookings.filter(b => new Date(b.pilatesClass.startTime) >= new Date())
  const pastBookings = myBookings.filter(b => new Date(b.pilatesClass.startTime) < new Date())

  const creditColor = credits === 0 ? 'var(--warn)' : credits <= 2 ? 'var(--clay)' : 'var(--forest)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      <div className="pf-page">

        {/* Page header */}
        <div style={{ marginBottom: '2.75rem' }}>
          <p className="pf-eyebrow">{t('my_eyebrow')}</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '3.25rem',
              fontWeight: 300,
              lineHeight: 1.1,
              color: 'var(--fg)',
              letterSpacing: '-0.01em',
            }}>
              {firstName ? `${firstName}'s` : t('my_heading')}{' '}
              <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>
                {firstName ? t('my_heading_em_named') : t('my_heading_em')}
              </em>
            </h1>
            {/* Credits display */}
            <div style={{ textAlign: 'right', paddingBottom: '0.25rem', flexShrink: 0 }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '3rem',
                fontWeight: 300,
                lineHeight: 1,
                color: creditColor,
              }}>
                {credits}
              </div>
              <div style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--fg-light)',
                marginTop: '0.2rem',
              }}>
                {credits === 1 ? t('my_credit_label') : t('my_credits_label')}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming bookings */}
        {upcomingBookings.length === 0 ? (
          <div className="pf-empty" style={{ marginBottom: '2rem' }}>
            <p className="pf-empty-title">{t('my_no_upcoming')}</p>
            <Link href="/" className="pf-link" style={{ fontSize: '0.78rem' }}>
              {t('my_no_upcoming_sub')} →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem' }}>
            {upcomingBookings.map(b => {
              const classTime = new Date(b.pilatesClass.startTime)
              const isOnline = b.pilatesClass.type === 'ONLINE'
              const isToday = classTime.toDateString() === new Date().toDateString()
              return (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.1rem',
                        color: 'var(--fg)',
                        lineHeight: 1.2,
                      }}>
                        {b.pilatesClass.name}
                      </span>
                      <span className={isOnline ? 'pf-badge pf-badge-sage' : 'pf-badge pf-badge-blush'}>
                        {isOnline ? t('class_online') : t('class_studio')}
                      </span>
                      {isToday && (
                        <span className="pf-badge pf-badge-dark">{t('my_today')}</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
                      {classTime.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}
                      <span style={{ color: 'var(--border)', margin: '0 0.35rem' }}>·</span>
                      {classTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <CancelButton type="booking" id={b.id} classTime={classTime} />
                </div>
              )
            })}
          </div>
        )}

        {/* Waitlist */}
        {myWaitlist.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
              <span className="pf-section-label">{t('my_waitlist_section')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {myWaitlist.map(w => (
                <div
                  key={w.id}
                  style={{
                    background: '#FAF1EE',
                    border: '1px solid #EECFCA',
                    borderRadius: 'var(--radius)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.1rem',
                        color: 'var(--fg)',
                      }}>
                        {w.pilatesClass.name}
                      </span>
                      <span className="pf-badge pf-badge-warn" style={{ background: 'var(--blush)', color: '#7a4a3a' }}>
                        #{w.position}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
                      {new Date(w.pilatesClass.startTime).toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}
                      <span style={{ color: 'var(--border)', margin: '0 0.35rem' }}>·</span>
                      {new Date(w.pilatesClass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <CancelButton type="waitlist" id={w.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past sessions */}
        {pastBookings.length > 0 && (
          <div>
            <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
              <span className="pf-section-label">{t('my_past')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', opacity: 0.55 }}>
              {pastBookings.slice().reverse().slice(0, 6).map(b => (
                <div
                  key={b.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '0.75rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--fg)' }}>
                      {b.pilatesClass.name}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--fg-light)' }}>
                      {new Date(b.pilatesClass.startTime).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {b.checkedIn
                    ? <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--forest)' }}>{t('my_attended')}</span>
                    : <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-light)' }}>{t('my_missed')}</span>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
