import { prisma } from '@/lib/prisma'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import GrantCreditsButton from '@/components/GrantCreditsButton'
import Link from 'next/link'
import Header from '@/components/Header'
import { getLang } from '@/lib/language'
import { translate } from '@/lib/translations'

export const dynamic = 'force-dynamic'

const PACKS = [
  { labelKey: '1 class', amount: 1 },
  { labelKey: '8 classes', amount: 8 },
  { labelKey: '30 classes', amount: 30 },
]

export default async function AdminCreditsPage() {
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

  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    orderBy: { name: 'asc' },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  })

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="pf-page-md">

          {/* Page header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <Link
              href="/admin"
              className="pf-link"
              style={{ fontSize: '0.72rem', display: 'inline-block', marginBottom: '1.5rem' }}
            >
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
              marginBottom: '0.3rem',
            }}>
              {t('credits_heading')} <em style={{ color: 'var(--sage)', fontStyle: 'italic' }}>{t('credits_heading_em')}</em>
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--fg-muted)' }}>{t('credits_subtext')}</p>
          </div>

          {/* Clients list */}
          {clients.length === 0 ? (
            <div className="pf-empty">
              <p className="pf-empty-title">{t('credits_no_clients')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {clients.map((client) => {
                const creditColor = client.credits === 0 ? 'var(--warn)' : client.credits <= 2 ? 'var(--clay)' : 'var(--forest)'
                return (
                  <div
                    key={client.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>

                      {/* Client info + transaction log */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', color: 'var(--fg)', fontWeight: 400 }}>
                            {client.name || '(no name)'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--fg-light)' }}>{client.email}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.85rem' }}>
                          <span style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '2rem',
                            fontWeight: 300,
                            lineHeight: 1,
                            color: creditColor,
                          }}>
                            {client.credits}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
                            {t('credits_remaining')}
                          </span>
                        </div>

                        {/* Recent transactions */}
                        {client.transactions.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {client.transactions.map(t => (
                              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.68rem' }}>
                                <span style={{ color: t.amount > 0 ? 'var(--forest)' : 'var(--warn)', fontWeight: 600, width: '2.5rem', flexShrink: 0 }}>
                                  {t.amount > 0 ? `+${t.amount}` : t.amount}
                                </span>
                                <span style={{ color: 'var(--fg-muted)' }}>{t.note}</span>
                                <span style={{ color: 'var(--fg-light)', marginLeft: 'auto' }}>
                                  {new Date(t.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pack buttons */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {PACKS.map(pack => (
                          <GrantCreditsButton
                            key={pack.amount}
                            userId={client.id}
                            amount={pack.amount}
                            label={pack.labelKey}
                          />
                        ))}
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
