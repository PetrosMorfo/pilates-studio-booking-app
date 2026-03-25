'use client'

import { deleteClass } from '@/lib/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function DeleteClassButton({ classId }: { classId: string }) {
  const { t } = useLanguage()
  const [confirming, setConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    const result = await deleteClass(classId)
    setIsDeleting(false)

    if (result.success) {
      router.refresh()
    } else {
      setConfirming(false)
      setError(result.error ?? 'Failed to delete.')
    }
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>{t('delete_sure')}</span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              background: 'none',
              border: 'none',
              cursor: isDeleting ? 'default' : 'pointer',
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--warn)',
              fontFamily: "'DM Sans', sans-serif",
              padding: 0,
            }}
          >
            {isDeleting ? '…' : t('delete_yes')}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null) }}
            disabled={isDeleting}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--fg-muted)',
              fontFamily: "'DM Sans', sans-serif",
              padding: 0,
            }}
          >
            {t('delete_cancel_x')}
          </button>
        </div>
        {error && (
          <span style={{ fontSize: '0.65rem', color: 'var(--warn)' }}>{error}</span>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
      <button
        onClick={() => setConfirming(true)}
        className="pf-link pf-link-danger"
      >
        {t('delete_delete')}
      </button>
      {error && (
        <span style={{ fontSize: '0.65rem', color: 'var(--warn)' }}>{error}</span>
      )}
    </div>
  )
}
