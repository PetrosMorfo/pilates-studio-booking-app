'use client'

import { grantCredits } from '@/lib/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GrantCreditsButton({
  userId,
  amount,
  label,
}: {
  userId: string
  amount: number
  label: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handle = async () => {
    setLoading(true)
    setError(null)
    const result = await grantCredits(userId, amount)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to grant credits.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
      <button
        onClick={handle}
        disabled={loading}
        className="pf-btn pf-btn-ghost"
        style={{
          fontSize: '0.72rem',
          padding: '0.45rem 0.85rem',
          opacity: loading ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? '…' : `+ ${label}`}
      </button>
      {error && (
        <span style={{ fontSize: '0.65rem', color: 'var(--warn)' }}>{error}</span>
      )}
    </div>
  )
}
