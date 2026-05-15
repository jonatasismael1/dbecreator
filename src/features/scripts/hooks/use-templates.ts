import { useQuery } from '@tanstack/react-query'
import { templatesService } from '../services/templates.service'
import type { ScriptTemplate } from '../types/script.types'

export function useTemplates() {
  const query = useQuery<ScriptTemplate[]>({
    queryKey: ['script-templates'],
    queryFn: () => templatesService.getTemplates(),
  })

  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}
