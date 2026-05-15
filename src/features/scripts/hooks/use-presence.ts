import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/context/auth-context'

export interface PresenceUser {
  id: string
  email: string
  online_at: string
}

export function usePresence(scriptId: string | undefined | null) {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!scriptId || !user) return

    const channel = supabase.channel(`script_presence:${scriptId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: PresenceUser[] = []
        for (const key in state) {
          const presenceArray = state[key] as unknown as Array<{ email: string; online_at: string }>
          if (presenceArray.length > 0) {
            users.push({
              id: key,
              email: presenceArray[0].email,
              online_at: presenceArray[0].online_at,
            })
          }
        }
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            email: user.email,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [scriptId, user])

  return { onlineUsers }
}
