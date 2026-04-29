import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import GrantCreditsButton from '@/components/GrantCreditsButton'
import { AdminBookingActions, AdminWaitlistRemove, AdminAddToClass } from '@/components/AdminBookingActions'
import DeleteUserButton from '@/components/DeleteUserButton'
import EditUserDetails from '@/components/EditUserDetails'
import RemoveCreditButton from '@/components/RemoveCreditButton'
import { getLang } from '@/lib/language'
import { translate } from '@/lib/translations'

export const dynamic = 'force-dynamic'

const PACKS = [
  { label: '1 class', amount: 1 },
  { label: '4 classes', amount: 4 },
  { label: '8 classes', amount: 8 },
]

export default async function ClientHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (dbUser?.role !== 'ADMIN') redirect('/')

  const lang = await getLang()
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key)
  const locale = lang === 'gr' ? 'el-GR' : 'en-US'

  // Fetch client with bookings, transactions, and waitlist entries
  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: {
        include: { pilatesClass: true },
        orderBy: { createdAt: 'desc' },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
      },
      waitlist: {
        include: { pilatesClass: true },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!client) redirect('/admin')

  // Upcoming classes list for move/add dropdowns
  const rawClasses = await prisma.pilatesClass.findMany({
    where: { startTime: { gte: new Date() } },
    include: { _count: { select: { bookings: true } } },
    orderBy: { startTime: 'asc' },
    take: 40,
  })

  const upcomingClasses = rawClasses.map(cls => ({
    id: cls.id,
    name: cls.name,
    startTime: cls.startTime.toISOString(),
    instructor: cls.instructor,
    spotsLeft: Math.max(0, cls.capacity - cls._count.bookings),
  }))

  const attended = client.bookings.filter(b => b.checkedIn).length
  const upcomingBookings = client.bookings.filter(b => new Date(b.pilatesClass.startTime) >= new Date())
  const pastBookings = client.bookings.filter(b => new Date(b.pilatesClass.startTime) < new Date())
  const futureWaitlist = client.waitlist.filter(w => new Date(w.pilatesClass.startTime) >= new Date())

  const creditColor = client.credits <= 0 ? 'var(--warn)' : client.credits <= 2 ? 'var(--clay)' : 'var(--forest)'
  const creditBg = client.credits <= 0 ? 'var(--warn-lt)' : client.credits <= 2 ? '#FAF1EE' : 'var(--accent-bg)'
  const creditBorder = client.credits <= 0 ? '#e8cac3' : client.credits <= 2 ? '#EECFCA' : 'var(--accent-lt)'

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="pf-page-md">

          <Link
            href="/admin"
            className="pf-link"
            style={{ fontSize: '0.72rem', display: 'inline-block', marginBottom: '1.5rem' }}
          >
            {t('common_back_dashboard')}
          </Link>

          {/* Client header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <div>
              <p className="pf-eyebrow">{t('client_eyebrow')}</p>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '3.25rem',
                fontWeight: 300,
                lineHeight: 1.1,
                color: 'var(--fg)',
                letterSpacing: '-0.01em',
                marginBottom: '0.3rem',
              }}>
                {client.name || '(no name)'}
              </h1>
              <p style={{ fontSize: '0.78rem', color: 'var(--fg-light)' }}>{client.email}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--fg-light)', marginTop: '0.2rem' }}>
                {t('client_member_since')}{' '}
                {new Date(client.createdAt).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <EditUserDetails userId={client.id} initialName={client.name ?? ''} initialEmail={client.email} />
            </div>

            {/* Credit pill */}
            <div style={{
              textAlign: 'center',
              padding: '1.25rem 2rem',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${creditBorder}`,
              background: creditBg,
              flexShrink: 0,
            }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '3.5rem',
                fontWeight: 300,
                lineHeight: 1,
                color: creditColor,
              }}>
                {client.credits}
              </div>
              <div style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--fg-light)',
                marginTop: '0.25rem',
              }}>
                {t('client_credits_label')}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="pf-stats" style={{ marginBottom: '2.5rem' }}>
            <div className="pf-stat">
              <div className="pf-stat-value">{client.bookings.length}</div>
              <div className="pf-stat-label">{t('client_total_bookings')}</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value forest">{attended}</div>
              <div className="pf-stat-label">{t('client_attended')}</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value sage">{upcomingBookings.length}</div>
              <div className="pf-stat-label">{t('client_upcoming')}</div>
            </div>
          </div>

          {/* Grant credits */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <p className="pf-section-label" style={{ marginBottom: '0.85rem' }}>{t('client_grant_credits')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {PACKS.map(pack => (
                  <GrantCreditsButton key={pack.amount} userId={client.id} amount={pack.amount} label={pack.label} />
                ))}
              </div>
              <RemoveCreditButton userId={client.id} />
            </div>
          </div>

          {/* Add to Class */}
          <div style={{ marginBottom: '2rem' }}>
            <AdminAddToClass userId={client.id} upcomingClasses={upcomingClasses} />
          </div>

          {/* Upcoming bookings */}
          {upcomingBookings.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
                <span className="pf-section-label">{t('client_upcoming_bookings')}</span>
              </div>
              <div className="pf-panel">
                {upcomingBookings.map(b => (
                  <div key={b.id} className="pf-row">
                    <div className="pf-row-main">
                      <strong>{b.pilatesClass.name}</strong>
                      <span>
                        {new Date(b.pilatesClass.startTime).toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}
                        {' · '}
                        {new Date(b.pilatesClass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Athens' })}
                      </span>
                    </div>
                    <div className="pf-row-aside">
                      <AdminBookingActions bookingId={b.id} upcomingClasses={upcomingClasses} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waitlist entries */}
          {futureWaitlist.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
                <span className="pf-section-label">{t('client_on_waitlist')}</span>
              </div>
              <div className="pf-panel">
                {futureWaitlist.map(w => (
                  <div key={w.id} className="pf-row">
                    <div className="pf-row-main">
                      <strong>{w.pilatesClass.name}</strong>
                      <span>
                        {new Date(w.pilatesClass.startTime).toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}
                        {' · '}
                        {new Date(w.pilatesClass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Athens' })}
                        {' · '}#{w.position}
                      </span>
                    </div>
                    <div className="pf-row-aside">
                      <AdminWaitlistRemove waitlistId={w.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past bookings */}
          {pastBookings.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
                <span className="pf-section-label" style={{ color: 'var(--fg-light)' }}>{t('client_past_bookings')}</span>
              </div>
              <div className="pf-panel" style={{ opacity: 0.7 }}>
                {pastBookings.map(b => (
                  <div key={b.id} className="pf-row">
                    <div className="pf-row-main">
                      <strong>{b.pilatesClass.name}</strong>
                      <span>
                        {new Date(b.pilatesClass.startTime).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="pf-row-aside">
                      {b.checkedIn
                        ? <span className="pf-badge pf-badge-sage">{t('client_attended')}</span>
                        : <span style={{
                            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: 'var(--fg-light)',
                          }}>{t('client_no_show')}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credit transaction log */}
          {client.transactions.length > 0 && (
            <div>
              <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
                <span className="pf-section-label">{t('client_credit_history')}</span>
              </div>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--accent-bg)', borderBottom: '1px solid var(--border)' }}>
                      {[t('credit_col_type'), t('credit_col_amount'), t('credit_col_note'), t('credit_col_date')].map(h => (
                        <th key={h} style={{
                          padding: '0.65rem 1.25rem',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: 'var(--fg-muted)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {client.transactions.map((tx, i) => (
                      <tr key={tx.id} style={{ borderTop: i > 0 ? '1px solid var(--border-lt)' : 'none' }}>
                        <td style={{ padding: '0.75rem 1.25rem' }}>
                          <span style={{
                            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
                            textTransform: 'uppercase', padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: tx.type === 'MANUAL_GRANT' ? 'var(--accent-bg)' : tx.type === 'DEDUCTED' ? 'var(--warn-lt)' : '#FAF1EE',
                            color: tx.type === 'MANUAL_GRANT' ? 'var(--forest)' : tx.type === 'DEDUCTED' ? 'var(--warn)' : 'var(--clay)',
                          }}>
                            {tx.type === 'MANUAL_GRANT'
                              ? t('credit_type_granted')
                              : tx.type === 'DEDUCTED'
                              ? t('credit_type_deducted')
                              : t('credit_type_refunded')}
                          </span>
                        </td>
                        <td style={{
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: tx.amount > 0 ? 'var(--forest)' : 'var(--warn)',
                        }}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
                          {tx.note || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', color: 'var(--fg-light)' }}>
                          {new Date(tx.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delete profile */}
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-lt)' }}>
            <DeleteUserButton userId={client.id} userName={client.name || client.email} />
          </div>

        </div>
      </div>
    </>
  )
}
