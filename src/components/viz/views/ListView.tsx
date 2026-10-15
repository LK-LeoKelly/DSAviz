// ListView.tsx —— 单链表视图：忠实地把"指针结构"画出来
// 布局完全由 next 指针图推导：从 L 顺链可达的结点排成水平链；
// 未接入链的结点（如 malloc 出的 s）悬停在上方——位置同样由它的 next 指向推导。
// 改接瞬间：旧箭头以红色虚线 + ✕ 淡出，新箭头描边生长。

import type { Scene } from '../../../engine/scene'
import { PointerBadge, MONO } from './shared'

const NW = 96        // 结点总宽
const NH = 46        // 结点高
const DW = 58        // 数据域宽
const PW = NW - DW   // 指针域宽
const GAP = 66       // 相邻结点间隙
const MX = 48        // 左边距
const ROW_Y = 236    // 水平链所在行
const FLOAT_Y = 92   // 悬停行

interface Box { x: number; y: number }

export default function ListView({ scene }: { scene: Scene }) {
  const nodes = Object.values(scene.nodes)
  const head = nodes.find((n) => n.head)

  // 1) 从 L 顺链推出水平链顺序（可达且未 free 且未悬停）
  const chain: number[] = []
  if (head) {
    let cur = head.next ?? null
    let guard = 0
    while (cur !== null && scene.nodes[cur] && !scene.nodes[cur]!.freed && guard++ < 200) {
      chain.push(cur)
      cur = scene.nodes[cur]!.next ?? null
    }
  }
  const slotOf = new Map<number, number>()
  if (head) slotOf.set(head.id, 0)
  chain.forEach((id, i) => slotOf.set(id, i + 1))
  const maxSlot = Math.max(0, ...slotOf.values())

  // 2) 每个结点的位置
  const pos = new Map<number, Box>()
  for (const n of nodes) {
    const slot = slotOf.get(n.id)
    if (slot !== undefined && !n.floating && !n.freed) {
      pos.set(n.id, { x: MX + slot * (NW + GAP), y: ROW_Y })
    } else if (n.freed) {
      pos.set(n.id, { x: MX + n.slot * (NW + GAP), y: ROW_Y + 10 })
    } else {
      // 悬停结点：由它自己的 next 指向推导应处的"缺口"
      let x: number
      if (n.next !== null && n.next !== undefined && slotOf.has(n.next)) {
        x = MX + (slotOf.get(n.next)! - 0.5) * (NW + GAP)
      } else {
        x = MX + (maxSlot + 1) * (NW + GAP)
      }
      pos.set(n.id, { x, y: FLOAT_Y })
    }
  }

  const dot = (id: number) => {
    const p = pos.get(id)!
    return { x: p.x + DW + PW / 2, y: p.y + NH / 2 }
  }
  const anchor = (id: number) => {
    const p = pos.get(id)!
    return { x: p.x - 5, y: p.y + NH / 2 }
  }

  // 直角折线箭头（教材风格：无曲线）
  const elbow = (s: Box, t: Box) => {
    if (Math.abs(s.y - t.y) < 2) return `M ${s.x} ${s.y} H ${t.x}`
    return `M ${s.x} ${s.y} V ${t.y} H ${t.x}`
  }

  const W = MX * 2 + (maxSlot + 2.2) * (NW + GAP)
  const H = 380

  // 指针徽章按目标分组
  const badgeGroups = new Map<number, string[]>()
  for (const p of scene.ptrs) {
    if (p.target === null) continue
    if (!scene.nodes[p.target]) continue
    const arr = badgeGroups.get(p.target) ?? []
    arr.push(p.name)
    badgeGroups.set(p.target, arr)
  }

  const isCmp = (id: number) => scene.cmp && (scene.cmp[0] === id || scene.cmp[1] === id)
  const isHl = (id: number) => scene.hl.includes(id)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ minHeight: 320 }}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
        </marker>
        <marker id="arrNew" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7.5" markerHeight="7.5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f46e5" />
        </marker>
      </defs>

      {/* 悬停区与水平链的分隔提示线 */}
      <line x1={MX - 20} y1={(FLOAT_Y + ROW_Y) / 2 + 12} x2={W - 30} y2={(FLOAT_Y + ROW_Y) / 2 + 12}
        stroke="#e7eaf3" strokeDasharray="2 6" />
      <text x={W - 34} y={(FLOAT_Y + ROW_Y) / 2 + 6} textAnchor="end" fontSize="10" fill="#b3bccf">堆区（malloc 的新结点悬停于此）</text>
      <text x={MX - 22} y={(FLOAT_Y + ROW_Y) / 2 + 6} fontSize="10" fill="#b3bccf">链区</text>

      {/* 现有指针箭头 */}
      {nodes.filter((n) => !n.freed).map((n) => {
        if (n.next === null || n.next === undefined) {
          // NULL 终止符 ∧
          const d0 = pos.get(n.id)
          if (!d0 || !slotOf.has(n.id)) return null
          const s = dot(n.id)
          return (
            <g key={`null-${n.id}`}>
              <line x1={s.x} y1={s.y} x2={s.x + 20} y2={s.y} stroke="#64748b" strokeWidth="1.6" />
              <text x={s.x + 27} y={s.y + 5} fontSize="15" fill="#64748b" style={{ fontFamily: MONO }}>∧</text>
            </g>
          )
        }
        const t = scene.nodes[n.next]
        if (!t) return null
        const path = elbow(dot(n.id), anchor(n.next))
        const isNew = scene.lastLink && scene.lastLink.from === n.id && scene.lastLink.to === n.next
        return (
          <path key={`lk-${n.id}`} d={path} fill="none"
            stroke={isNew ? '#4f46e5' : '#334155'} strokeWidth={isNew ? 2.4 : 1.8}
            markerEnd={`url(#${isNew ? 'arrNew' : 'arr'})`}
            className={isNew ? 'link-draw' : undefined}
            style={{ transition: 'd .45s' }} />
        )
      })}

      {/* 被改接掉的旧箭头：红色虚线 + ✕（本步淡出） */}
      {scene.lastLink && scene.lastLink.cut !== null && scene.nodes[scene.lastLink.from] && scene.nodes[scene.lastLink.cut] && (() => {
        const from = scene.nodes[scene.lastLink.from]!
        if (from.freed) return null
        const path = elbow(dot(from.id), anchor(scene.lastLink!.cut!))
        const s = dot(from.id)
        const t = anchor(scene.lastLink!.cut!)
        return (
          <g className="cut-fade">
            <path d={path} fill="none" stroke="#dc2626" strokeWidth="1.8" strokeDasharray="6 5" />
            <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 8} textAnchor="middle" fontSize="15" fontWeight="700" fill="#dc2626">✕</text>
          </g>
        )
      })()}

      {/* 结点本体 */}
      {nodes.map((n) => {
        const p = pos.get(n.id)!
        const floating = !slotOf.has(n.id) && !n.freed
        return (
          <g key={n.id}
            style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: 'transform .5s cubic-bezier(.4,0,.2,1), opacity .45s' }}
            opacity={n.freed ? 0.38 : 1}>
            {/* 数据域 */}
            <rect x={0} y={0} width={DW} height={NH} rx={0}
              fill={n.head ? '#e8edf5' : isCmp(n.id) ? '#ffedd5' : isHl(n.id) ? '#fef3c7' : n.mark === 2 ? '#d1fae5' : '#ffffff'}
              stroke={n.freed ? '#dc2626' : n.mark === 2 ? '#059669' : isCmp(n.id) ? '#ea580c' : '#334155'}
              strokeWidth={isCmp(n.id) || n.mark === 2 ? 2.4 : 1.6}
              strokeDasharray={floating || n.freed ? '5 4' : undefined} />
            {n.head ? (
              <text x={DW / 2} y={NH / 2 + 4} textAnchor="middle" fontSize="12" fill="#64748b" fontStyle="italic">head</text>
            ) : (
              <text x={DW / 2} y={NH / 2 + 5.5} textAnchor="middle" fontSize="17" fontWeight="700" fill="#0f172a"
                style={{ fontFamily: MONO }}>{String(n.val)}</text>
            )}
            {/* 指针域 */}
            <rect x={DW} y={0} width={PW} height={NH}
              fill={floating ? '#fafbfe' : '#f8fafc'}
              stroke={n.freed ? '#dc2626' : isCmp(n.id) ? '#ea580c' : '#334155'}
              strokeWidth={isCmp(n.id) ? 2.4 : 1.6}
              strokeDasharray={floating || n.freed ? '5 4' : undefined} />
            {!n.freed && <circle cx={DW + PW / 2} cy={NH / 2} r={3.4} fill="#334155" />}
            {/* 地址 */}
            <text x={NW / 2} y={NH + 15} textAnchor="middle" fontSize="9.5" fill="#94a3b8" style={{ fontFamily: MONO }}>{n.addr}</text>
            {n.head && (
              <text x={NW / 2} y={NH + 27} textAnchor="middle" fontSize="9.5" fill="#94a3b8">头结点（不存数据）</text>
            )}
            {n.freed && (
              <text x={NW / 2} y={NH + 27} textAnchor="middle" fontSize="10" fontWeight="600" fill="#dc2626">已 free</text>
            )}
            {/* 指针徽章 */}
            {(badgeGroups.get(n.id) ?? []).map((name, k) => (
              <PointerBadge key={name} x={NW / 2} y={-14} name={name} stackIndex={(badgeGroups.get(n.id)!.length - 1 - k)} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
