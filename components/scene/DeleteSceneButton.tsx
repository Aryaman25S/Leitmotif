'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import DeleteConfirmButton from '@/components/ui/delete-confirm-button'

export default function DeleteSceneButton({
  sceneId,
  projectId,
}: {
  sceneId: string
  projectId: string
}) {
  const router = useRouter()

  async function handleDelete() {
    const res = await fetch(`/api/scenes/${sceneId}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete scene')
      return
    }
    toast.success('Scene deleted')
    router.push(`/projects/${projectId}`)
    router.refresh()
  }

  return (
    <DeleteConfirmButton
      onDelete={handleDelete}
      label="Delete scene"
      confirmLabel="Yes, delete"
    />
  )
}
