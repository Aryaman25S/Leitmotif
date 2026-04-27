'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface DeleteConfirmButtonProps {
  onDelete: () => Promise<void>
  label?: string
  confirmLabel?: string
  className?: string
  size?: 'sm' | 'default'
  disabled?: boolean
}

/**
 * Two-click delete pattern: first click shows a confirmation prompt,
 * second click executes the delete. Click elsewhere to cancel.
 */
export default function DeleteConfirmButton({
  onDelete,
  label = 'Delete',
  confirmLabel = 'Confirm delete',
  className,
  size = 'sm',
  disabled = false,
}: DeleteConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleClick() {
    if (!confirming) {
      setConfirming(true)
      // Auto-cancel after 4 seconds if user doesn't confirm
      setTimeout(() => setConfirming(false), 4000)
      return
    }
    setDeleting(true)
    await onDelete()
    setDeleting(false)
    setConfirming(false)
  }

  return (
    <Button
      variant={confirming ? 'destructive' : 'ghost'}
      size={size}
      onClick={handleClick}
      disabled={deleting || disabled}
      className={className}
      onBlur={() => setTimeout(() => setConfirming(false), 200)}
    >
      {deleting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : confirming ? (
        <>
          <AlertTriangle className="h-3.5 w-3.5" />
          {confirmLabel}
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </Button>
  )
}
