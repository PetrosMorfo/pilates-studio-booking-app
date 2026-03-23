'use client'

import { toggleCheckIn } from '@/lib/actions'
import { useState, useTransition } from 'react'

export default function CheckInToggle({
  bookingId,
  initialStatus,
}: {
  bookingId: string
  initialStatus: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <input
        type="checkbox"
        defaultChecked={initialStatus}
        disabled={isPending}
        onChange={(e) => {
          const el = e.currentTarget
          setError(null)
          startTransition(async () => {
            const result = await toggleCheckIn(bookingId, initialStatus)
            if (!result.success) {
              setError(result.error ?? 'Check-in failed.')
              el.checked = initialStatus
            }
          })
        }}
        style={{
          width: '1.1rem',
          height: '1.1rem',
          accentColor: 'var(--accent)',
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.5 : 1,
          borderRadius: 'var(--radius-sm)',
        }}
      />
      {error && (
        <span style={{ fontSize: '0.6rem', color: 'var(--warn)', maxWidth: '100px', lineHeight: 1.3 }}>
          {error}
        </span>
      )}
    </div>
  )
}
