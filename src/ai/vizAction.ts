// vizAction.ts —— AI 演示指令协议：AI 在回复里嵌入 ```viz 代码块，
// 前端把它变成一张"可点击的演示卡"，点击后由真实引擎渲染（不是 AI 画的图，保证专业性）
//
// 协议格式（AI 输出）：
// ```viz
// {"algo": "sort-quick", "params": {"arr": [5,3,8,1,9]}, "title": "用课件的例子演示快速排序"}
// ```
// params 可省略（用默认参数）；algo 必须命中目录，支持中文别名模糊匹配。

import { ALGO_MAP, ALGOS, type AlgoDef } from '../engine/catalog'

export interface VizAction {
  algoId: string
  title: string
  params: Record<string, unknown>
}

export type Segment = { type: 'text'; text: string } | { type: 'viz'; action: VizAction }

// 常见叫法 → 目录 id（兜底：AI 写了别名也能命中）
const ALIAS: Record<string, string> = {
  快排: 'sort-quick', 快速排序: 'sort-quick', 冒泡: 'sort-bubble', 冒泡排序: 'sort-bubble',
  选择排序: 'sort-select', 插入排序: 'sort-insert', 直接插入排序: 'sort-insert', 归并: 'sort-merge', 归并排序: 'sort-merge',
  折半查找: 'search-bin', 二分查找: 'search-bin', 顺序查找: 'search-seq', 哈希: 'hash-insert', 哈希表: 'hash-insert',
  栈: 'stack-ops', 括号匹配: 'stack-brackets', 进制转换: 'stack-base',
  队列: 'queue-ops', 循环队列: 'cqueue',
  链表: 'list-insert', 头插: 'list-build-head', 尾插: 'list-build-tail', 链表插入: 'list-insert', 链表删除: 'list-delete', 链表查找: 'list-get',
  先序遍历: 'tree-pre', 中序遍历: 'tree-in', 后序遍历: 'tree-post',
  二叉排序树: 'bst-build', BST: 'bst-build', 二叉查找树: 'bst-build', BST查找: 'bst-search', BST建树: 'bst-build',
  堆: 'heap-sort', 堆排序: 'heap-sort', 堆插入: 'heap-build',
}

function resolveAlgoId(raw: string): AlgoDef | null {
  if (!raw) return null
  const key = raw.trim()
  if (ALGO_MAP[key]) return ALGO_MAP[key]
  if (ALIAS[key]) return ALGO_MAP[ALIAS[key]!] ?? null
  // 模糊兜底：标题包含或被包含
  const hit = ALGOS.find((a) => a.title.includes(key) || key.includes(a.title))
  return hit ?? null
}

/** 按 paramsSpec 钳制参数：非法值回退默认，数值夹取 min/max，数组限量 */
function coerceParams(algo: AlgoDef, raw: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = { ...algo.defaultParams }
  if (!raw || typeof raw !== 'object') return out
  const obj = raw as Record<string, unknown>
  // 宽松键匹配：AI 可能写 arr / input / list / keys / 数组 等，统一往 spec 的 array 键上放
  const firstArrayKey = algo.paramsSpec.find((s) => s.kind === 'array')?.key
  const arrGuess = obj.arr ?? obj.input ?? obj.data ?? obj.list ?? obj.keys ?? obj.array ?? obj.level ?? obj['数组']
  for (const spec of algo.paramsSpec) {
    let v = obj[spec.key]
    if (v === undefined && spec.kind === 'array' && spec.key === firstArrayKey && arrGuess !== undefined) v = arrGuess
    if (v === undefined) continue
    if (spec.kind === 'array') {
      const nums = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[,，\s]+/) : []
      const clean = nums.map((n) => Number(n)).filter((n) => Number.isFinite(n))
      if (clean.length >= 2) out[spec.key] = clean.slice(0, 12)
    } else if (spec.kind === 'number') {
      const n = Number(v)
      if (Number.isFinite(n)) out[spec.key] = Math.max(spec.min ?? -1e9, Math.min(spec.max ?? 1e9, Math.floor(n)))
    } else if (typeof v === 'string' && v.trim()) {
      out[spec.key] = v.trim().slice(0, 40)
    }
  }
  return out
}

function parseBlock(json: string): VizAction | null {
  try {
    const raw = JSON.parse(json)
    const algo = resolveAlgoId(String(raw?.algo ?? raw?.id ?? ''))
    if (!algo) return null
    return {
      algoId: algo.id,
      title: typeof raw?.title === 'string' && raw.title.trim() ? raw.title.trim().slice(0, 40) : algo.title,
      params: coerceParams(algo, raw?.params),
    }
  } catch { return null }
}

/** 把 AI 回复拆成 文本段 + 演示卡段；坏块静默降级为普通文本 */
export function parseAssistant(content: string): Segment[] {
  const segs: Segment[] = []
  const re = /```viz\s*\n([\s\S]*?)```/g
  let last = 0
  for (const m of content.matchAll(re)) {
    const idx = m.index ?? 0
    if (idx > last) segs.push({ type: 'text', text: content.slice(last, idx).trim() })
    const action = parseBlock(m[1]!)
    if (action) segs.push({ type: 'viz', action })
    else segs.push({ type: 'text', text: '' }) // 坏块不显示原始 JSON，保持界面干净
    last = idx + m[0].length
  }
  if (last < content.length) segs.push({ type: 'text', text: content.slice(last).trim() })
  return segs.filter((s) => s.type === 'viz' || s.text.length > 0)
}

/** 给 AI 的目录说明书：有哪些算法、id 是什么、参数怎么给 */
export function catalogBrief(): string {
  return ALGOS.map((a) => {
    const ps = a.paramsSpec.map((s) => `${s.key}(${s.kind === 'array' ? '数字数组' : s.kind === 'number' ? '数字' : '文本'})`).join('、')
    return `${a.id}｜${a.title}｜${a.summary}${ps ? `｜参数：${ps}` : ''}`
  }).join('\n')
}
