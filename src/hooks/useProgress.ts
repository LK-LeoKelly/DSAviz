// useProgress.ts —— 学习进度（localStorage 持久化）

import { useCallback, useEffect, useState } from 'react'

const KEY = 'dsaviz:progress:v1'

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

export function useProgress() {
  const [done, setDone] = useState<Set<string>>(() => load())

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify([...done])) } catch { /* ignore */ }
  }, [done])

  const markDone = useCallback((id: string) => setDone((s) => new Set(s).add(id)), [])
  const isDone = useCallback((id: string) => done.has(id), [done])

  return { done, markDone, isDone }
}
