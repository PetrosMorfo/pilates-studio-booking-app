import Header from '@/components/Header'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import AdminClassCalendar from '@/components/AdminClassCalendar'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getLang } from '@/lib/language'
import { translate } from '@/lib/translations'

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

  const lang = await getLang()
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key)
  const locale = lang === 'gr' ? 'el-GR' : 'en-US'

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
              <p className="pf-eyebrow">{t('admin_eyebrow')}</p>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '3.25rem',
                fontWeight: 300,
                lineHeight: 1.1,
                color: 'var(--fg)',
                letterSpacing: '-0.01em',
              }}>
                {t('admin_heading')} <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>{t('admin_heading_em')}</em>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Link href="/admin/add-class" className="pf-btn pf-btn-primary">
                + {t('admin_add_class')}
              </Link>
              <Link href="/admin/add-client" className="pf-btn pf-btn-ghost">
                + {t('admin_add_client')}
              </Link>
              <Link href="/admin/attendance" className="pf-btn pf-btn-ghost">
                {t('admin_attendance')}
              </Link>
              <Link href="/admin/credits" className="pf-btn pf-btn-ghost">
                {t('admin_manage_credits')}
              </Link>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="pf-stats" style={{ marginBottom: '2.5rem' }}>
            <div className="pf-stat">
              <div className="pf-stat-value forest">{upcoming.length}</div>
              <div className="pf-stat-label">{t('admin_upcoming_classes')}</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value">{totalBookings}</div>
              <div className="pf-stat-label">{t('admin_active_bookings')}</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value clay">{clients.length}</div>
              <div className="pf-stat-label">{t('admin_total_clients')}</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value sage">{totalCredits}</div>
              <div className="pf-stat-label">{t('admin_credits_held')}</div>
            </div>
          </div>

          {/* Classes Calendar */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
              <span className="pf-section-label">{t('admin_classes_section')}</span>
            </div>
            <AdminClassCalendar
              classes={classes.map(cls => ({
                id: cls.id,
                name: cls.name,
                startTime: cls.startTime.toISOString(),
                endTime: cls.endTime.toISOString(),
                instructor: cls.instructor,
                type: cls.type,
                capacity: cls.capacity,
                bookings: cls.bookings.map(b => ({ user: { name: b.user.name, email: b.user.email } })),
                waitlist: cls.waitlist.map(w => ({ id: w.id })),
              }))}
              locale={locale}
            />
          </div>

          {/* Clients */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div className="pf-section-rule" style={{ marginBottom: '0.75rem' }}>
              <span className="pf-section-label">{t('admin_clients_section')}</span>
            </div>

            <div className="pf-panel">
              {clients.length === 0 ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--fg-muted)' }}>{t('admin_no_clients')}</p>
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
                        {client.credits} {t('client_credits_label')}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--fg-light)' }}>
                        {client._count.bookings} {t('admin_booked')}
                      </div>
                    </div>
                    <Link href={`/admin/clients/${client.id}`} className="pf-link">
                      {t('admin_view')} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>
    </>
  )
}
