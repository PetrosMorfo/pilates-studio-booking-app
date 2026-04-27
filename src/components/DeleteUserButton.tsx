'use client'

import { useState } from 'react'
import { deleteUser } from '@/lib/actions'

export default function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete profile for "${userName}"? This will permanently remove their account, bookings, and credit history.`
    )
    if (!confirmed) return

    setLoading(true)
    setError(null)
    const result = await deleteUser(userId)
    if (result.success) {
      window.location.href = '/admin/clients'
    } else {
      setError(result.error ?? 'Failed to delete user.')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <p style={{ fontSize: '0.78rem', color: 'var(--warn)', marginBottom: '0.5rem' }}>{error}</p>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          background: 'none',
          border: '1px solid #e8cac3',
          borderRadius: 'var(--radius-sm)',
          padding: '0.55rem 1.1rem',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--warn)',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {loading ? 'Deleting…' : 'Delete Profile'}
      </button>
    </div>
  )
}
