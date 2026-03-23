import { prisma } from '@/lib/prisma'
import Header from '@/components/Header'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import GrantCreditsButton from '@/components/GrantCreditsButton'

export const dynamic = 'force-dynamic'

const PACKS = [
  { label: '1 class', amount: 1 },
  { label: '5 classes', amount: 5 },
  { label: '8 classes', amount: 8 },
  { label: '10 classes', amount: 10 },
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

  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: {
        include: { pilatesClass: true },
        orderBy: { createdAt: 'desc' }
      },
      transactions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!client) redirect('/admin')

  const attended = client.bookings.filter(b => b.checkedIn).length
  const upcoming = client.bookings.filter(b => new Date(b.pilatesClass.startTime) >= new Date())
  const past = client.bookings.filter(b => new Date(b.pilatesClass.startTime) < new Date())

  const creditColor = client.credits === 0 ? 'var(--warn)' : client.credits <= 2 ? 'var(--clay)' : 'var(--forest)'
  const creditBg = client.credits === 0 ? 'var(--warn-lt)' : client.credits <= 2 ? '#FAF1EE' : 'var(--accent-bg)'
  const creditBorder = client.credits === 0 ? '#e8cac3' : client.credits <= 2 ? '#EECFCA' : 'var(--accent-lt)'

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
            ← Back to Dashboard
          </Link>

          {/* Client header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <div>
              <p className="pf-eyebrow">Client</p>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
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
                Member since {new Date(client.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '1.25rem 2rem',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${creditBorder}`,
              background: creditBg,
              flexShrink: 0,
            }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
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
                credits
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="pf-stats" style={{ marginBottom: '2.5rem' }}>
            <div className="pf-stat">
              <div className="pf-stat-value">{client.bookings.length}</div>
              <div className="pf-stat-label">Total bookings</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value forest">{attended}</div>
              <div className="pf-stat-label">Classes attended</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value sage">{upcoming.length}</div>
              <div className="pf-stat-label">Upcoming</div>
            </div>
          </div>

          {/* Grant credits */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}>
            <p className="pf-section-label" style={{ marginBottom: '0.85rem' }}>Grant Credits</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {PACKS.map(pack => (
                <GrantCreditsButton key={pack.amount} userId={client.id} amount={pack.amount} label={pack.label} />
              ))}
            </div>
          </div>

          {/* Upcoming bookings */}
          {upcoming.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
                <span className="pf-section-label">Upcoming Bookings</span>
              </div>
              <div className="pf-panel">
                {upcoming.map(b => (
                  <div key={b.id} className="pf-row">
                    <div className="pf-row-main">
                      <strong>{b.pilatesClass.name}</strong>
                      <span>
                        {new Date(b.pilatesClass.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        {' · '}
                        {new Date(b.pilatesClass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="pf-row-aside">
                      <span className="pf-badge pf-badge-sage">Booked</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past bookings */}
          {past.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
                <span className="pf-section-label" style={{ color: 'var(--fg-light)' }}>Past Bookings</span>
              </div>
              <div className="pf-panel" style={{ opacity: 0.7 }}>
                {past.map(b => (
                  <div key={b.id} className="pf-row">
                    <div className="pf-row-main">
                      <strong>{b.pilatesClass.name}</strong>
                      <span>
                        {new Date(b.pilatesClass.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="pf-row-aside">
                      {b.checkedIn
                        ? <span className="pf-badge pf-badge-sage">Attended</span>
                        : <span style={{
                            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: 'var(--fg-light)',
                          }}>No-show</span>
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
                <span className="pf-section-label">Credit History</span>
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
                      {['Type', 'Amount', 'Note', 'Date'].map(h => (
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
                    {client.transactions.map((t, i) => (
                      <tr key={t.id} style={{ borderTop: i > 0 ? '1px solid var(--border-lt)' : 'none' }}>
                        <td style={{ padding: '0.75rem 1.25rem' }}>
                          <span style={{
                            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
                            textTransform: 'uppercase', padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: t.type === 'MANUAL_GRANT' ? 'var(--accent-bg)' : t.type === 'DEDUCTED' ? 'var(--warn-lt)' : '#FAF1EE',
                            color: t.type === 'MANUAL_GRANT' ? 'var(--forest)' : t.type === 'DEDUCTED' ? 'var(--warn)' : 'var(--clay)',
                          }}>
                            {t.type === 'MANUAL_GRANT' ? 'Granted' : t.type === 'DEDUCTED' ? 'Deducted' : 'Refunded'}
                          </span>
                        </td>
                        <td style={{
                          padding: '0.75rem 1.25rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: t.amount > 0 ? 'var(--forest)' : 'var(--warn)',
                        }}>
                          {t.amount > 0 ? `+${t.amount}` : t.amount}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
                          {t.note || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.72rem', color: 'var(--fg-light)' }}>
                          {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
