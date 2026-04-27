'use client'

import { useState } from 'react'
import { removeCredit } from '@/lib/actions'
import { useRouter } from 'next/navigation'

export default function RemoveCreditButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handle = async () => {
    setLoading(true)
    setError(null)
    const result = await removeCredit(userId)
    setLoading(false)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? 'Failed to remove credit.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
      <button
        onClick={handle}
        disabled={loading}
        style={{
          background: 'none',
          border: '1px solid #e8cac3',
          borderRadius: 'var(--radius-sm)',
          padding: '0.45rem 0.85rem',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: loading ? 'var(--fg-light)' : 'var(--warn)',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: 'nowrap',
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? '…' : '− 1 class'}
      </button>
      {error && (
        <span style={{ fontSize: '0.65rem', color: 'var(--warn)' }}>{error}</span>
      )}
    </div>
  )
}
