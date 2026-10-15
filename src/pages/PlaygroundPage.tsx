// PlaygroundPage.tsx —— 演算沙盒：结构属于你自己，操作即演算
// 链表/BST 的当前状态在操作间持续保留：每次点击都用"当前结构"生成完整动画，
// 播放完毕后新状态自动落地——自由度来自"想怎么折腾就怎么折腾"。

import { useEffect, useMemo, useRef, useState } from 'react'
import { ListTree, GitBranch, RotateCcw, Eraser, MousePointerClick } from 'lucide-react'
import { ALGO_MAP, type AlgoDef } from '../engine/catalog'
import { st, type Step } from '../engine/steps'
import { listInsertTrace, listDeleteTrace, listGetTrace } from '../engine/algos/linkedList'
import { bstBuildTrace, bstSearchTrace, bstInorderTrace } from '../engine/algos/tree'
import { usePlayer } from '../hooks/usePlayer'
import Stage from '../components/viz/Stage'

// ---------- 空闲态（未操作时也把当前结构画出来） ----------
function listIdle(list: number[]): Step[] {
  const out: Step[] = []
  out.push(st('view', '链表沙盘 · 当前结构', { w: 0 }))
  out.push(st('newNode', '头结点 L', { a: 0, w: 0, s: 'L', fast: true }))
  out.push(st('ptr', 'L → 头结点', { s: 'L', a: 0, fast: true }))
  list.forEach((v, i) => {
    out.push(st('newNode', `结点 ${v}`, { a: i + 1, w: v, fast: true }))
    out.push(st('link', '连边', { a: i, b: i + 1, fast: true }))
  })
  if (list.length) out.push(st('link', '表尾 next = NULL', { a: list.length, b: -1, fast: true }))
  out.push(st('message', list.length ? `当前链表：${list.join(' → ')} → NULL。在左侧挑一个操作，看着它一步步发生` : '空链表。先在左侧插入几个结点吧'))
  return out
}

function bstIdle(keys: number[]): Step[] {
  return bstBuildTrace({ keys, fastBefore: keys.length })
}

// 沙盒 idle 用的伪图鉴项（代码面板与推导卡复用对应真实算法）
const LIST_IDLE_DEF: AlgoDef = { ...ALGO_MAP['list-insert']!, id: 'sandbox-list', title: '链表沙盘', summary: '自由演算台' }
const BST_IDLE_DEF: AlgoDef = { ...ALGO_MAP['bst-build']!, id: 'sandbox-bst', title: 'BST 沙盘', summary: '自由演算台' }

const LS_LIST = 'dsaviz-sandbox-list'
const LS_BST = 'dsaviz-sandbox-bst'
function load<T>(key: string, def: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) as T : def } catch { return def }
}

export default function PlaygroundPage() {
  const [tab, setTab] = useState<'list' | 'bst'>('list')
  const [list, setList] = useState<number[]>(() => load(LS_LIST, [3, 7, 5, 9]))
  const [keys, setKeys] = useState<number[]>(() => load(LS_BST, [45, 24, 53, 12, 37]))
  const [showCode, setShowCode] = useState(true)

  // 当前正在演算的事件流与对应的图鉴项；idle 时展示当前结构
  const [session, setSession] = useState<{ algo: AlgoDef; events: Step[] } | null>(null)
  const events = useMemo(() => {
    if (session) return session.events
    return tab === 'list' ? listIdle(list) : bstIdle(keys)
  }, [session, tab, list, keys])
  const algo = session?.algo ?? (tab === 'list' ? LIST_IDLE_DEF : BST_IDLE_DEF)

  const player = usePlayer(events)
  const done = player.total > 0 && player.idx >= player.total - 1 && !player.playing

  // 待落地的结果：播完才提交，中途打断不提交 —— 状态永远一致
  const pending = useRef<null | (() => void)>(null)
  useEffect(() => {
    if (done && pending.current) { pending.current(); pending.current = null; setSession(null) }
  }, [done])
  useEffect(() => { localStorage.setItem(LS_LIST, JSON.stringify(list)) }, [list])
  useEffect(() => { localStorage.setItem(LS_BST, JSON.stringify(keys)) }, [keys])

  // 操作一发出就自动播放
  const fired = useRef(false)
  useEffect(() => {
    if (session && fired.current) { fired.current = false; const t = setTimeout(() => player.play(), 60); return () => clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  const fire = (algoId: string, ev: Step[], commit: (() => void) | null) => {
    pending.current = commit
    fired.current = true
    setSession({ algo: ALGO_MAP[algoId]!, events: ev })
  }

  // ---------- 链表操作 ----------
  const [insPos, setInsPos] = useState(2)
  const [insVal, setInsVal] = useState(6)
  const [delVal, setDelVal] = useState(5)
  const [getPos, setGetPos] = useState(2)

  const listOps = [
    {
      label: '头插', hint: '位序 1 之前', run: () => {
        const v = insVal
        fire('list-insert', listInsertTrace({ list, pos: 1, val: v }), () => setList((l) => [v, ...l]))
      },
    },
    {
      label: '尾插', hint: `位序 ${list.length + 1}`, run: () => {
        const v = insVal
        fire('list-insert', listInsertTrace({ list, pos: list.length + 1, val: v }), () => setList((l) => [...l, v]))
      },
    },
    {
      label: '按位插入', hint: 'i 与 e 可改', run: () => {
        const i = Math.max(1, Math.min(list.length + 1, insPos))
        const v = insVal
        fire('list-insert', listInsertTrace({ list, pos: i, val: v }), () => setList((l) => [...l.slice(0, i - 1), v, ...l.slice(i - 1)]))
      },
    },
    {
      label: '按值删除', hint: '找不到会报错', run: () => {
        const v = delVal
        const idx = list.indexOf(v)
        fire('list-delete', listDeleteTrace({ list, val: v }), idx >= 0 ? () => setList((l) => [...l.slice(0, idx), ...l.slice(idx + 1)]) : null)
      },
    },
    {
      label: '按位查找', hint: '顺链扫描', run: () => {
        const i = Math.max(1, Math.min(Math.max(1, list.length), getPos))
        fire('list-get', listGetTrace({ list, pos: i }), null)
      },
    },
  ]

  // ---------- BST 操作 ----------
  const [bstVal, setBstVal] = useState(28)
  const [bstKey, setBstKey] = useState(37)

  const bstOps = [
    {
      label: '插入', hint: '小走左大走右', run: () => {
        const v = bstVal
        const dup = keys.includes(v)
        if (dup) {
          // 重复值：改用"查找"演示——亲眼看到它已经在树里，自然理解为什么不插
          fire('bst-search', bstSearchTrace({ keys, key: v }), null)
        } else {
          fire('bst-build', bstBuildTrace({ keys: [...keys, v], fastBefore: keys.length }), () => setKeys((k) => [...k, v]))
        }
      },
    },
    {
      label: '查找', hint: '每步排除一棵子树', run: () => {
        fire('bst-search', bstSearchTrace({ keys, key: bstKey }), null)
      },
    },
    {
      label: '中序遍历验证', hint: '输出必然有序', run: () => {
        if (!keys.length) return
        fire('tree-in', bstInorderTrace({ keys }), null)
      },
    },
  ]

  const numInput = 'w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[12.5px] font-mono outline-none focus:border-indigo-400 focus:bg-white transition'

  return (
    <div className="flex-1 flex min-h-0 page-in" style={{ height: 'calc(100vh - 56px)' }}>
      {/* 左侧：沙盘控制台 */}
      <aside className="w-[300px] shrink-0 border-r border-slate-200/80 bg-white overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold tracking-[0.16em] text-slate-400 mb-3">
            <MousePointerClick size={12} /> 演算沙盒 · 结构你做主
          </div>

          {/* 结构切换 */}
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            <button onClick={() => { setTab('list'); setSession(null) }}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[12.5px] font-semibold border transition ${
                tab === 'list' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <ListTree size={14} /> 链表沙盘
            </button>
            <button onClick={() => { setTab('bst'); setSession(null) }}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[12.5px] font-semibold border transition ${
                tab === 'bst' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              <GitBranch size={14} /> BST 沙盘
            </button>
          </div>

          {/* 当前状态 */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 mb-4">
            <div className="text-[10.5px] text-slate-400 mb-1">{tab === 'list' ? '当前链表（头 → 尾）' : '当前 BST（插入顺序）'}</div>
            <div className="text-[13px] font-mono font-semibold text-slate-700 break-all leading-relaxed">
              {tab === 'list' ? (list.length ? list.join(' → ') + ' → NULL' : '（空）') : (keys.length ? keys.join('，') : '（空）')}
            </div>
          </div>

          {tab === 'list' ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] text-slate-400 w-14">插入值 e</span>
                <input className={numInput} type="number" value={insVal} onChange={(e) => setInsVal(Number(e.target.value))} />
                <span className="text-[11.5px] text-slate-400">位序 i</span>
                <input className={numInput} type="number" value={insPos} onChange={(e) => setInsPos(Number(e.target.value))} />
              </div>
              {listOps.slice(0, 3).map((op) => (
                <button key={op.label} onClick={op.run}
                  className="w-full flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left hover:border-indigo-300 hover:bg-indigo-50/50 transition group">
                  <span className="text-[13px] font-semibold text-slate-700 group-hover:text-indigo-700">{op.label}</span>
                  <span className="text-[10.5px] text-slate-400 ml-auto">{op.hint}</span>
                </button>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11.5px] text-slate-400 w-14">删除值 e</span>
                <input className={numInput} type="number" value={delVal} onChange={(e) => setDelVal(Number(e.target.value))} />
              </div>
              {listOps.slice(3, 4).map((op) => (
                <button key={op.label} onClick={op.run}
                  className="w-full flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left hover:border-indigo-300 hover:bg-indigo-50/50 transition group">
                  <span className="text-[13px] font-semibold text-slate-700 group-hover:text-indigo-700">{op.label}</span>
                  <span className="text-[10.5px] text-slate-400 ml-auto">{op.hint}</span>
                </button>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11.5px] text-slate-400 w-14">查找位序</span>
                <input className={numInput} type="number" value={getPos} onChange={(e) => setGetPos(Number(e.target.value))} />
              </div>
              {listOps.slice(4).map((op) => (
                <button key={op.label} onClick={op.run}
                  className="w-full flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left hover:border-indigo-300 hover:bg-indigo-50/50 transition group">
                  <span className="text-[13px] font-semibold text-slate-700 group-hover:text-indigo-700">{op.label}</span>
                  <span className="text-[10.5px] text-slate-400 ml-auto">{op.hint}</span>
                </button>
              ))}
              <button onClick={() => { setList([]); setSession(null) }}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-[12px] text-slate-400 hover:border-rose-300 hover:text-rose-500 transition">
                <Eraser size={13} /> 清空链表
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] text-slate-400 w-14">插入值</span>
                <input className={numInput} type="number" value={bstVal} onChange={(e) => setBstVal(Number(e.target.value))} />
              </div>
              <button onClick={bstOps[0]!.run}
                className="w-full flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left hover:border-indigo-300 hover:bg-indigo-50/50 transition group">
                <span className="text-[13px] font-semibold text-slate-700 group-hover:text-indigo-700">插入</span>
                <span className="text-[10.5px] text-slate-400 ml-auto">小走左大走右</span>
              </button>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11.5px] text-slate-400 w-14">查找目标</span>
                <input className={numInput} type="number" value={bstKey} onChange={(e) => setBstKey(Number(e.target.value))} />
              </div>
              <button onClick={bstOps[1]!.run}
                className="w-full flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left hover:border-indigo-300 hover:bg-indigo-50/50 transition group">
                <span className="text-[13px] font-semibold text-slate-700 group-hover:text-indigo-700">查找</span>
                <span className="text-[10.5px] text-slate-400 ml-auto">每步排除一棵子树</span>
              </button>
              <button onClick={bstOps[2]!.run}
                className="w-full flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/40 px-3 py-2 text-left hover:border-indigo-400 transition group">
                <span className="text-[13px] font-semibold text-indigo-700">中序遍历验证</span>
                <span className="text-[10.5px] text-indigo-400 ml-auto">输出必然有序 ✨</span>
              </button>
              <button onClick={() => { setKeys([]); setSession(null) }}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-[12px] text-slate-400 hover:border-rose-300 hover:text-rose-500 transition">
                <Eraser size={13} /> 清空 BST
              </button>
            </div>
          )}

          <div className="rounded-xl bg-amber-50/60 border border-amber-100 px-3 py-2.5 mt-4 text-[11.5px] text-amber-700/80 leading-relaxed">
            沙盒与实验室的区别：这里的结构状态是连续的——上一个操作的结果，就是下一个操作的起点。
            播放完毕状态才落地；中途切换操作不影响当前结构。
          </div>
        </div>
      </aside>

      {/* 右侧：舞台 */}
      <main className="flex-1 min-w-0">
        <Stage algo={algo} player={player} showCode={showCode} onToggleCode={() => setShowCode((v) => !v)}
          headerExtra={
            <span className="inline-flex items-center gap-1 text-[11.5px] text-slate-300 font-mono">
              <RotateCcw size={12} /> 状态在操作间连续保留
            </span>
          } />
      </main>
    </div>
  )
}
