// composables/useNotify.ts
import { useToast } from '#imports'

export function useNotify() {
  const toast = useToast()

  const notify = ({
    title,
    description = '',
    icon = 'i-lucide-info',
    color = 'primary'
  }: {
    title: string
    description?: string
    icon?: string
    color?: 'primary' | 'success' | 'error' | 'info' | 'warning' | 'neutral'
  }) => {
    toast.add({ title, description, icon, color })
  }

  return { notify }
}
