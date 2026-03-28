'use client'
import { useEffect, useState } from 'react'

export function useCountdown(seconds: number, onComplete?: () => void) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.()
      return
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onComplete])

  return { remaining, progress: ((seconds - remaining) / seconds) * 100 }
}
