import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { calendarService } from '../services/calendar.service'
import type { CreateCalendarItemDTO, UpdateCalendarItemDTO } from '../types/calendar.types'

const KEY = (workspaceId: string) => ['calendar_items', workspaceId]

export function useCalendarItems(workspaceId: string) {
  return useQuery({
    queryKey: KEY(workspaceId),
    queryFn: () => calendarService.getAll(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useCreateCalendarItem(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateCalendarItemDTO) => calendarService.create(workspaceId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(workspaceId) }),
  })
}

export function useUpdateCalendarItem(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCalendarItemDTO }) =>
      calendarService.update(workspaceId, id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(workspaceId) }),
  })
}

export function useDeleteCalendarItem(workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => calendarService.delete(workspaceId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(workspaceId) }),
  })
}
