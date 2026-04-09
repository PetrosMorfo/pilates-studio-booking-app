import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import BookButton from '@/components/BookButton'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getLang } from '@/lib/language'
import { translate } from '@/lib/translations'

export const dynamic = 'force-dynamic'

export default async function PilatesPage() {
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

  const lang = await getLang()
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
    translate(lang, key, vars)

  let myCredits = 0
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, credits: true },
    })
    if (dbUser?.role === 'ADMIN') redirect('/admin')
    myCredits = dbUser?.credits ?? 0
  }

  const classes = await prisma.pilatesClass.findMany({
    where: { startTime: { gte: new Date() } },
    orderBy: { startTime: 'asc' },
    include: { bookings: true, waitlist: { orderBy: { position: 'asc' } } }
  })

  const [myBookings, myWaitlist] = user ? await Promise.all([
    prisma.booking.findMany({ where: { userId: user.id }, select: { pilatesClassId: true } }),
    prisma.waitlist.findMany({ where: { userId: user.id }, select: { pilatesClassId: true, position: true } }),
  ]) : [[], []]

  const bookedClassIds = new Set(myBookings.map(b => b.pilatesClassId))
  const waitlistMap = new Map(myWaitlist.map(w => [w.pilatesClassId, w.position]))

  // Group by date
  const grouped: Record<string, typeof classes> = {}
  for (const cls of classes) {
    const dateKey = new Date(cls.startTime).toLocaleDateString(lang === 'gr' ? 'el-GR' : 'en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    })
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(cls)
  }

  const creditColor = myCredits === 0 ? 'var(--warn)' : myCredits <= 2 ? 'var(--clay)' : 'var(--forest)'
  const creditBg = myCredits === 0 ? 'var(--warn-lt)' : myCredits <= 2 ? '#FAF1EE' : 'var(--accent-bg)'
  const creditBorder = myCredits === 0 ? '#e8cac3' : myCredits <= 2 ? '#EECFCA' : 'var(--accent-lt)'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />

      <div className="pf-page">

        {/* Page header */}
        <div style={{ marginBottom: '2.75rem' }}>
          <p className="pf-eyebrow">{t('home_eyebrow')}</p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '3.25rem',
            fontWeight: 300,
            lineHeight: 1.1,
            color: 'var(--fg)',
            marginBottom: '0.65rem',
            letterSpacing: '-0.01em',
          }}>
            {t('home_heading')} <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>{t('home_heading_em')}</em>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', lineHeight: 1.65 }}>
            {t('home_subtext')}
          </p>

          {/* Credit badge — only for logged-in clients */}
          {user && (
            <div style={{ marginTop: '1.25rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: '0.35rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '999px',
                background: creditBg,
                border: `1px solid ${creditBorder}`,
              }}>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.25rem',
                  fontWeight: 300,
                  lineHeight: 1,
                  color: creditColor,
                }}>
                  {myCredits}
                </span>
                <span style={{ fontSize: '0.68rem', color: creditColor, fontWeight: 500 }}>
                  {t('home_credits_label')}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Class list */}
        {classes.length === 0 ? (
          <div className="pf-empty">
            <p className="pf-empty-title">{t('home_empty_title')}</p>
            <span style={{ fontSize: '0.78rem', color: 'var(--fg-muted)' }}>{t('home_empty_sub')}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {Object.entries(grouped).map(([date, dayClasses]) => (
              <div key={date}>

                {/* Date section header */}
                <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
                  <span className="pf-section-label">{date}</span>
                </div>

                {/* Class rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {dayClasses.map((cls) => {
                    const spotsLeft = cls.capacity - cls.bookings.length
                    const isBooked = bookedClassIds.has(cls.id)
                    const waitlistPosition = waitlistMap.get(cls.id)
                    const waitlistCount = cls.waitlist.length
                    const isOnline = cls.type === 'ONLINE'
                    const isFull = spotsLeft <= 0

                    const startTime = new Date(cls.startTime)
                    const endTime = new Date(cls.endTime)

                    return (
                      <div
                        key={cls.id}
                        style={{
                          background: isBooked ? 'var(--accent-bg)' : 'var(--bg-card)',
                          border: `1px solid ${isBooked ? 'var(--accent-lt)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                        }}
                      >
                        {/* Time column */}
                        <div style={{ width: '68px', flexShrink: 0 }}>
                          <div style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '1.35rem',
                            fontWeight: 400,
                            color: 'var(--fg)',
                            lineHeight: 1,
                          }}>
                            {startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--fg-light)', marginTop: '0.15rem' }}>
                            – {endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>

                        {/* Vertical rule */}
                        <div style={{ width: '1px', height: '36px', background: 'var(--border-lt)', flexShrink: 0 }} />

                        {/* Class info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '1.1rem',
                            fontWeight: 400,
                            color: 'var(--fg)',
                            lineHeight: 1.2,
                            marginBottom: '0.2rem',
                          }}>
                            {cls.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--fg-muted)' }}>
                              {t('class_with')} {cls.instructor}
                            </span>
                            {!isFull && (
                              <>
                                <span style={{ color: 'var(--border)', fontSize: '0.7rem' }}>·</span>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 500,
                                  color: spotsLeft <= 2 ? 'var(--warn)' : 'var(--fg-muted)',
                                }}>
                                  {spotsLeft} {spotsLeft === 1 ? t('class_spot_left') : t('class_spots_left')}
                                  {spotsLeft <= 2 && ' ●'}
                                </span>
                              </>
                            )}
                            {isFull && (
                              <>
                                <span style={{ color: 'var(--border)', fontSize: '0.7rem' }}>·</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--fg-light)' }}>
                                  {t('class_full')}{waitlistCount > 0 ? ` · ${waitlistCount} ${t('class_on_waitlist')}` : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right: type badge + action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                          <span className={isOnline ? 'pf-badge pf-badge-sage' : 'pf-badge pf-badge-blush'}>
                            {isOnline ? t('class_online') : t('class_studio')}
                          </span>
                          <BookButton
                            classId={cls.id}
                            isBooked={isBooked}
                            waitlistPosition={waitlistPosition}
                            isFull={isFull}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
