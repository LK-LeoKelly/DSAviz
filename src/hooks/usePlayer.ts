// usePlayer.ts —— 播放器内核
// 画面 = 前 idx 个事件折叠出的快照（buildScenes）。前进/后退/拖动只是换快照，零残影。
// 自动播放节奏：按事件语义分配时长（link 比 message 久），fast 事件（搭建段）加速。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildScenes, type Scene } from '../engine/scene'
import { PACE, type Step } from '../engine/steps'

export interface Player {
  scenes: Scene[]
  idx: number
  total: number
  scene: Scene | null
  playing: boolean
  speed: number
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  first: () => void
  last: () => void
  seek: (i: number) => void
  setSpeed: (s: number) => void
  seekToCodeLine: (line: number) => void   // 跳到第一个执行该源码行的步骤（代码驱动导航）
}

export function usePlayer(events: Step[] | null): Player {
  const scenes = useMemo(() => (events && events.length ? buildScenes(events) : []), [events])
  const total = scenes.length
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timer = useRef<number | null>(null)

  // 事件流换了：回到开头并暂停
  useEffect(() => {
    setIdx(0)
    setPlaying(false)
  }, [events])

  const clear = () => {
    if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null }
  }

  const stepMs = useCallback((i: number) => {
    if (!events || i >= events.length) return 800
    const ev = events[i]
    const base = ev.fast ? 320 : PACE[ev.op] ?? 800
    return base / speed
  }, [events, speed])

  useEffect(() => {
    if (!playing) { clear(); return }
    if (idx >= total - 1) { setPlaying(false); return }
    timer.current = window.setTimeout(() => setIdx((v) => Math.min(v + 1, total - 1)), stepMs(idx))
    return clear
  }, [playing, idx, total, stepMs])

  const seek = useCallback((i: number) => {
    setIdx(() => Math.max(0, Math.min(i, total - 1)))
  }, [total])
  const seekToCodeLine = useCallback((line: number) => {
    if (!events) return
    // 优先找"当前位置之后"第一次执行该行的步骤，绕一圈都没有就回到开头第一处
    for (let k = 1; k <= events.length; k++) {
      const i = (idx + k) % events.length
      if (events[i]!.code === line) {
        setPlaying(false)
        setIdx(i)
        return
      }
    }
  }, [events, idx])
  const stepBy = useCallback((d: number) => {
    setPlaying(false)
    setIdx((v) => Math.max(0, Math.min(v + d, total - 1)))
  }, [total])

  return {
    scenes, idx, total,
    scene: total ? scenes[idx] : null,
    playing, speed,
    play: () => {
      if (idx >= total - 1) setIdx(0)
      setPlaying(true)
    },
    pause: () => setPlaying(false),
    toggle: () => (playing ? setPlaying(false) : (idx >= total - 1 && setIdx(0), setPlaying(true))),
    next: () => stepBy(1),
    prev: () => stepBy(-1),
    first: () => { setPlaying(false); setIdx(0) },
    last: () => { setPlaying(false); setIdx(total - 1) },
    seek,
    setSpeed,
    seekToCodeLine,
  }
}
