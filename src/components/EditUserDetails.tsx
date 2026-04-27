'use client'

import { useState } from 'react'
import { updateUserDetails } from '@/lib/actions'

type Props = {
  userId: string
  initialName: string
  initialEmail: string
}

export default function EditUserDetails({ userId, initialName, initialEmail }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    const result = await updateUserDetails(userId, { name, email })
    setLoading(false)
    if (result.success) {
      setEditing(false)
      // Reload to reflect updated name/email in the page header
      window.location.reload()
    } else {
      setError(result.error ?? 'Failed to update.')
    }
  }

  const handleCancel = () => {
    setName(initialName)
    setEmail(initialEmail)
    setError(null)
    setEditing(false)
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg)',
    color: 'var(--fg)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.4rem 0.85rem',
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--fg-muted)',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          marginTop: '0.6rem',
          display: 'inline-block',
        }}
      >
        Edit Details
      </button>
    )
  }

  return (
    <div style={{
      marginTop: '0.75rem',
      padding: '1.25rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxWidth: '380px',
    }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: '0.3rem' }}>
          Name
        </label>
        <input
          style={inputStyle}
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: '0.3rem' }}>
          Email
        </label>
        <input
          style={inputStyle}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      {error && (
        <p style={{ fontSize: '0.78rem', color: 'var(--warn)', margin: 0 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleSave}
          disabled={loading}
          className="pf-btn pf-btn-primary"
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.72rem', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 1rem',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: 'var(--fg-muted)',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
