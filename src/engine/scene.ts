// scene.ts —— 场景状态：把事件流折叠成一张张"快照"
// 播放器任意时刻的画面 = 前 index 个事件折叠出的状态。
// 前进 / 后退 / 拖进度条都只是换一个快照 —— 状态完全由事件推导，不存在渲染层残影。

import type { Step, ViewKind } from './steps'

export interface NodeInfo {
  id: number
  val: number | string
  addr: string          // 模拟内存地址（教学用，如 0x1A14）
  alias?: string        // 结点别名（s、q …）
  head?: boolean        // 头结点
  next?: number | null  // 链表后继
  left?: number | null  // 树左孩子
  right?: number | null // 树右孩子
  floating?: boolean    // 悬停展示中
  freed?: boolean       // 已 free
  slot: number          // 最近一次在链中的逻辑位序（布局记忆：被摘除后仍画在原位淡出）
  mark: number          // 0 无 1 处理中 2 完成 3 摘除
  visits: number[]      // 遍历经过的序号（第 1/2/3 次经过 → ①②③）
}

export interface PtrInfo { name: string; target: number | null }

export interface Scene {
  view: ViewKind
  title: string
  // 数组系（排序/查找/哈希/循环队列底層）
  arr: (number | string | null)[]
  arrMarks: Record<number, number>
  range: [number, number] | null
  // 链式系（链表/树）
  nodes: Record<number, NodeInfo>
  root: number | null
  // 指针变量（p / q / s / L / top / front / rear / low / high / mid …）—— 一等公民
  ptrs: PtrInfo[]
  // 栈 / 队列
  stack: (number | string)[]
  queue: (number | string)[]
  capacity: number
  front: number
  rear: number
  count: number
  // 输入串扫描（括号匹配等）
  input: string
  scanPos: number
  paired: Record<number, number>   // 输入串下标 -> 1 已配对
  // 输出序列（遍历结果等）
  output: (number | string)[]
  // 待入元素预告（入栈/入队前先亮出"谁要进来"）
  incoming: number | string | null
  // 本步瞬时表现
  hl: number[]
  cmp: [number, number] | null
  cmpKey: number | string | null
  lastLink: { from: number; to: number | null; cut: number | null } | null
  lastFree: number | null
  // 统计与旁白
  compares: number
  swaps: number
  visitSeq: number
  note: string
  codeLine: number | null
}

let addrSeed = 0
export function resetAddrSeed() { addrSeed = 0 }
function genAddr(): string {
  addrSeed += 1
  return '0x' + (0x1a00 + addrSeed * 0x14).toString(16).toUpperCase()
}

export function emptyScene(): Scene {
  return {
    view: 'array', title: '',
    arr: [], arrMarks: {}, range: null,
    nodes: {}, root: null,
    ptrs: [],
    stack: [], queue: [], capacity: 0, front: 0, rear: 0, count: 0,
    input: '', scanPos: -1, paired: {},
    output: [], incoming: null,
    hl: [], cmp: null, cmpKey: null, lastLink: null, lastFree: null,
    compares: 0, swaps: 0, visitSeq: 0,
    note: '', codeLine: null,
  }
}

function setPtr(sc: Scene, name: string, target: number | null) {
  const found = sc.ptrs.find((p) => p.name === name)
  if (found) found.target = target
  else sc.ptrs.push({ name, target })
}

// 重新梳理链式可达结点的逻辑位序；不可达结点保留原 slot（用于 free 原位淡出）
function relayoutSlots(sc: Scene) {
  const headId = Object.values(sc.nodes).find((n) => n.head)?.id
  if (headId === undefined) return
  let cur = sc.nodes[headId]!.next ?? null
  let slot = 1
  let guard = 0
  while (cur !== null && sc.nodes[cur] && guard++ < 1000) {
    if (!sc.nodes[cur]!.floating) sc.nodes[cur]!.slot = slot++
    cur = sc.nodes[cur]!.next ?? null
  }
}

function applyStep(sc: Scene, s: Step) {
  // 瞬时表现清零（每步重新给出）
  sc.hl = []
  sc.cmp = null
  sc.cmpKey = null
  sc.lastLink = null
  sc.lastFree = null
  if (s.note) sc.note = s.note
  if (s.code !== undefined) sc.codeLine = s.code

  switch (s.op) {
    case 'view': {
      const order: ViewKind[] = ['list', 'array', 'stack', 'queue', 'cqueue', 'tree', 'heap', 'hash']
      sc.view = order[Number(s.w ?? 0)] ?? 'array'
      sc.title = s.note
      sc.capacity = s.a ?? 0   // 循环队列等视图用 a 携带容量
      break
    }
    case 'message': break
    case 'input': sc.input = s.s ?? ''; sc.scanPos = -1; sc.paired = {}; break
    case 'scan': sc.scanPos = s.a ?? -1; break
    case 'initArray': {
      const i = s.a ?? 0
      while (sc.arr.length <= i) sc.arr.push(null)
      sc.arr[i] = s.w ?? null
      break
    }
    case 'setValue': {
      const i = s.a ?? 0
      while (sc.arr.length <= i) sc.arr.push(null)
      sc.arr[i] = s.w ?? null
      break
    }
    case 'compare':
      sc.cmp = [s.a ?? -1, s.b ?? -1]
      if (s.b === -1 || s.b === undefined) sc.cmpKey = s.w ?? null
      sc.compares += 1
      break
    case 'swap': {
      const i = s.a ?? 0, j = s.b ?? 0
      if (i < sc.arr.length && j < sc.arr.length) {
        const t = sc.arr[i]; sc.arr[i] = sc.arr[j]; sc.arr[j] = t
      }
      sc.swaps += 1
      break
    }
    case 'highlight': sc.hl = [s.a ?? -1]; break
    case 'mark': {
      const id = s.a ?? -1
      if (sc.nodes[id]) sc.nodes[id]!.mark = Number(s.w ?? 0)
      else sc.arrMarks[id] = Number(s.w ?? 0)
      break
    }
    case 'range': sc.range = s.a === -1 || s.a === undefined ? null : [s.a, s.b ?? s.a]; break
    case 'push': sc.stack.push(s.w ?? ''); sc.incoming = null; break
    case 'pop': sc.stack.pop(); break
    case 'enqueue':
      if (sc.capacity > 0) { sc.rear = (sc.rear + 1) % sc.capacity; sc.count += 1 }
      sc.queue.push(s.w ?? '')
      sc.incoming = null
      break
    case 'dequeue':
      if (sc.capacity > 0) { sc.front = (sc.front + 1) % sc.capacity; sc.count -= 1 }
      sc.queue.shift()
      break
    case 'newNode': {
      const id = s.a ?? 0
      sc.nodes[id] = {
        id, val: s.w ?? '', addr: genAddr(), alias: s.s || undefined,
        head: s.s === 'L',   // 约定：别名为 L 的是头结点
        next: null, left: null, right: null, slot: 0, mark: 0, visits: [],
      }
      break
    }
    case 'link': {
      const id = s.a ?? 0
      const target = s.b === -1 || s.b === undefined ? null : s.b
      const n = sc.nodes[id]
      if (!n) break
      if (sc.view === 'tree' || sc.view === 'heap') {
        // 树：b=-1 → a 成为根；否则 a 挂到 b 的左/右
        if (s.b === -1 || s.b === undefined) sc.root = id
        else {
          const p = sc.nodes[s.b]
          if (p) {
            if ((s.w ?? 0) === 0) p.left = id
            else p.right = id
          }
        }
        sc.lastLink = { from: id, to: s.b ?? -1, cut: null }
      } else {
        const cut = n.next ?? null
        n.next = target
        sc.lastLink = { from: id, to: target, cut: cut === target ? null : cut }
      }
      relayoutSlots(sc)
      break
    }
    case 'ptr': setPtr(sc, s.s ?? 'p', s.a === -1 || s.a === undefined ? null : s.a ?? null); break
    case 'float': { const n = sc.nodes[s.a ?? -1]; if (n) n.floating = true; break }
    case 'unfloat': { const n = sc.nodes[s.a ?? -1]; if (n) { n.floating = false } relayoutSlots(sc); break }
    case 'free': {
      const n = sc.nodes[s.a ?? -1]
      if (n) { n.freed = true; n.mark = 3; sc.lastFree = n.id }
      for (const p of sc.ptrs) if (p.target === (s.a ?? -1)) p.target = null
      relayoutSlots(sc)
      break
    }
    case 'visit': {
      const n = sc.nodes[s.a ?? -1]
      if (n) { sc.visitSeq += 1; n.visits.push(sc.visitSeq); sc.hl = [n.id] }
      break
    }
    case 'output': sc.output.push(s.w ?? ''); break
    case 'outClear': sc.output = []; break
    case 'incoming': sc.incoming = s.w ?? null; break
    case 'markAll': {
      const mk = Number(s.w ?? 0)
      for (let i = 0; i < sc.arr.length; i++) sc.arrMarks[i] = mk
      break
    }
  }
}

// 把事件流折叠成快照数组（scenes[i] = 播完第 i 步后的画面）
export function buildScenes(events: Step[]): Scene[] {
  resetAddrSeed()
  const scenes: Scene[] = []
  let cur = emptyScene()
  for (const ev of events) {
    applyStep(cur, ev)
    scenes.push(structuredClone(cur))
  }
  return scenes
}
