import Header from '@/components/Header'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import DeleteClassButton from '@/components/DeleteClassButton'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
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

  const now = new Date()

  const [classes, clients] = await Promise.all([
    prisma.pilatesClass.findMany({
      orderBy: { startTime: 'asc' },
      include: { bookings: { include: { user: true } }, waitlist: true }
    }),
    prisma.user.findMany({
      where: { role: 'CLIENT' },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, email: true, credits: true, createdAt: true,
        _count: { select: { bookings: true } }
      }
    })
  ])

  const upcoming = classes.filter(c => new Date(c.startTime) >= now)
  const past = classes.filter(c => new Date(c.startTime) < now)
  const totalBookings = upcoming.reduce((acc, c) => acc + c.bookings.length, 0)
  const totalCredits = clients.reduce((a, c) => a + c.credits, 0)

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="pf-page-md">

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <div>
              <p className="pf-eyebrow">Admin</p>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '3.25rem',
                fontWeight: 300,
                lineHeight: 1.1,
                color: 'var(--fg)',
                letterSpacing: '-0.01em',
              }}>
                Studio <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>dashboard</em>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Link href="/admin/add-class" className="pf-btn pf-btn-primary">
                + Add class
              </Link>
              <Link href="/admin/attendance" className="pf-btn pf-btn-ghost">
                Attendance
              </Link>
              <Link href="/admin/credits" className="pf-btn pf-btn-ghost">
                Manage credits
              </Link>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="pf-stats" style={{ marginBottom: '2.5rem' }}>
            <div className="pf-stat">
              <div className="pf-stat-value forest">{upcoming.length}</div>
              <div className="pf-stat-label">Upcoming classes</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value">{totalBookings}</div>
              <div className="pf-stat-label">Active bookings</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value clay">{clients.length}</div>
              <div className="pf-stat-label">Total clients</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value sage">{totalCredits}</div>
              <div className="pf-stat-label">Credits held</div>
            </div>
          </div>

          {/* Upcoming Classes */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
              <span className="pf-section-label">Upcoming classes</span>
            </div>

            {upcoming.length === 0 ? (
              <div className="pf-empty">
                <p className="pf-empty-title">No upcoming classes</p>
                <Link href="/admin/add-class" className="pf-link">Add one now →</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {upcoming.map(cls => (
                  <div
                    key={cls.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '0.9rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    {/* Date block */}
                    <div style={{ width: '38px', flexShrink: 0, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--fg-light)' }}>
                        {new Date(cls.startTime).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', lineHeight: 1, color: 'var(--fg)' }}>
                        {new Date(cls.startTime).getDate()}
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '36px', background: 'var(--border-lt)', flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', color: 'var(--fg)' }}>
                          {cls.name}
                        </span>
                        <span className={cls.type === 'ONLINE' ? 'pf-badge pf-badge-sage' : 'pf-badge pf-badge-blush'}>
                          {cls.type === 'ONLINE' ? 'Online' : 'Studio'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
                        {new Date(cls.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span style={{ color: 'var(--border)', margin: '0 0.35rem' }}>·</span>
                        {cls.instructor}
                        {cls.bookings.length > 0 && (
                          <>
                            <span style={{ color: 'var(--border)', margin: '0 0.35rem' }}>·</span>
                            <span style={{ color: 'var(--fg-light)' }}>
                              {cls.bookings.map(b => b.user.name || b.user.email).join(', ')}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: cls.bookings.length >= cls.capacity ? 'var(--clay)' : 'var(--forest)',
                        }}>
                          {cls.bookings.length}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--border)', fontWeight: 400 }}>
                          /{cls.capacity}
                        </span>
                        {cls.waitlist.length > 0 && (
                          <div style={{ fontSize: '0.62rem', color: 'var(--clay)', marginTop: '0.1rem' }}>
                            +{cls.waitlist.length} waiting
                          </div>
                        )}
                      </div>
                      <DeleteClassButton classId={cls.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clients */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
              <span className="pf-section-label">Clients</span>
            </div>

            <div className="pf-panel">
              {clients.length === 0 ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--fg-muted)' }}>No clients yet.</p>
                </div>
              ) : clients.map((client) => (
                <div key={client.id} className="pf-row">
                  <div className="pf-row-main">
                    <strong>{client.name || '—'}</strong>
                    <span>{client.email}</span>
                  </div>
                  <div className="pf-row-aside">
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: client.credits === 0 ? 'var(--warn)' : client.credits <= 2 ? 'var(--clay)' : 'var(--forest)',
                      }}>
                        {client.credits} {client.credits === 1 ? 'credit' : 'credits'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--fg-light)' }}>
                        {client._count.bookings} bookings
                      </div>
                    </div>
                    <Link href={`/admin/clients/${client.id}`} className="pf-link">
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Classes */}
          {past.length > 0 && (
            <div>
              <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
                <span className="pf-section-label" style={{ color: 'var(--fg-light)' }}>Past classes</span>
              </div>
              <div className="pf-panel" style={{ opacity: 0.6 }}>
                {past.slice().reverse().slice(0, 8).map((cls) => (
                  <div key={cls.id} className="pf-row">
                    <div className="pf-row-main">
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {cls.name}
                        <span className={cls.type === 'ONLINE' ? 'pf-badge pf-badge-sage' : 'pf-badge pf-badge-blush'}>
                          {cls.type === 'ONLINE' ? 'Online' : 'Studio'}
                        </span>
                      </strong>
                      <span>
                        {new Date(cls.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <span style={{ margin: '0 0.35rem', color: 'var(--border)' }}>·</span>
                        {cls.bookings.length} attended
                      </span>
                    </div>
                    <div className="pf-row-aside">
                      <DeleteClassButton classId={cls.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
