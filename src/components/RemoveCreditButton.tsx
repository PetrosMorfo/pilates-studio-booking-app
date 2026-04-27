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
        className="pf-btn pf-btn-ghost"
        style={{
          color: 'var(--warn)',
          borderColor: '#e8cac3',
          opacity: loading ? 0.5 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
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
