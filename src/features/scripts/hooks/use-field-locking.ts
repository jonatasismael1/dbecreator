import { useEffect, useState, useCallback, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/context/auth-context'

export interface FieldLock {
  userId: string
  userEmail: string
  field: string // 'title', 'hook', 'body', 'cta'
}

export function useFieldLocking(scriptId: string | undefined | null) {
  const { user } = useAuth()
  const [lockedFields, setLockedFields] = useState<Record<string, FieldLock>>({})
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!scriptId || !user) return

    const ch = supabase.channel(`script_locks:${scriptId}`)

    ch.on('broadcast', { event: 'lock_field' }, (payload) => {
      setLockedFields((prev) => ({
        ...prev,
        [payload.payload.field]: {
          userId: payload.payload.userId,
          userEmail: payload.payload.userEmail,
          field: payload.payload.field,
        },
      }))
    })

    ch.on('broadcast', { event: 'unlock_field' }, (payload) => {
      setLockedFields((prev) => {
        const next = { ...prev }
        if (next[payload.payload.field]?.userId === payload.payload.userId) {
          delete next[payload.payload.field]
        }
        return next
      })
    })

    ch.subscribe()
    channelRef.current = ch

    return () => {
      ch.unsubscribe()
      channelRef.current = null
    }
  }, [scriptId, user])

  const lockField = useCallback((field: string) => {
    if (!channelRef.current || !user) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'lock_field',
      payload: { field, userId: user.id, userEmail: user.email },
    })
  }, [user])

  const unlockField = useCallback((field: string) => {
    if (!channelRef.current || !user) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'unlock_field',
      payload: { field, userId: user.id },
    })
  }, [user])

  return { lockedFields, lockField, unlockField }
}
