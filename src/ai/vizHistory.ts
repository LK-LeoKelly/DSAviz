// vizHistory.ts —— 演示记录：助教给过的每一张演示卡自动收进来，课后一键回放
// 存 localStorage，上限 30 条，最新在前；同一卡片（算法+参数+标题）不重复收

import type { VizAction } from './vizAction'

export interface VizEntry {
  algoId: string
  params: Record<string, unknown>
  title: string
  from?: string   // 来自哪份课件（如有）
  ts: number
}

const KEY = 'dsaviz-viz-history'
const MAX = 30

export function loadVizHistory(): VizEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((e) => e && typeof e.algoId === 'string' && typeof e.title === 'string') : []
  } catch { return [] }
}

function save(list: VizEntry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))) } catch { /* 存储满就静默 */ }
}

/** 收录一批演示卡；返回收录后的完整列表 */
export function collectViz(actions: VizAction[], from: string | undefined, current: VizEntry[]): VizEntry[] {
  if (!actions.length) return current
  const seen = new Set(current.map((e) => `${e.algoId}|${e.title}|${JSON.stringify(e.params)}`))
  const fresh: VizEntry[] = []
  for (const a of actions) {
    const k = `${a.algoId}|${a.title}|${JSON.stringify(a.params)}`
    if (seen.has(k)) continue
    seen.add(k)
    fresh.push({ algoId: a.algoId, params: a.params, title: a.title, from, ts: Date.now() })
  }
  if (!fresh.length) return current
  const next = [...fresh.reverse(), ...current].slice(0, MAX)
  save(next)
  return next
}

export function removeViz(ts: number, current: VizEntry[]): VizEntry[] {
  const next = current.filter((e) => e.ts !== ts)
  save(next)
  return next
}

export function clearViz(): VizEntry[] {
  save([])
  return []
}
