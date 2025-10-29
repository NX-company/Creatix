'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function UserActivityTracker() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    // Update lastActive on mount
    fetch('/api/user/ping', { method: 'POST' }).catch(() => {})

    // Update every 2 minutes
    const interval = setInterval(() => {
      fetch('/api/user/ping', { method: 'POST' }).catch(() => {})
    }, 2 * 60 * 1000) // 2 minutes

    return () => clearInterval(interval)
  }, [session])

  return null
}
