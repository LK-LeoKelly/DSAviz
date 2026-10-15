// TreeView.tsx —— 树视图：布局完全由真实的 left/right 指针推导（中序定 x，深度定 y）
// 遍历教学：每个结点旁的 ①②③ 表示递归过程中的三次经过

import type { Scene } from '../../../engine/scene'
import { PointerBadge, MONO } from './shared'
import type React from 'react'

const R = 23

export default function TreeView({ scene }: { scene: Scene }) {
  const nodes = Object.values(scene.nodes)

  // 中序排名 → x；深度 → y
  const xRank = new Map<number, number>()
  const depth = new Map<number, number>()
  let rank = 0
  const inorder = (id: number | null | undefined, d: number) => {
    if (id === null || id === undefined) return
    const n = scene.nodes[id]
    if (!n) return
    depth.set(id, Math.max(depth.get(id) ?? 0, d))
    inorder(n.left ?? null, d + 1)
    if (!xRank.has(id)) xRank.set(id, rank++)
    inorder(n.right ?? null, d + 1)
  }
  inorder(scene.root, 0)
  // 修正深度（中序只保证访问，深度需按真实父子关系）
  const fixDepth = (id: number | null | undefined, d: number) => {
    if (id === null || id === undefined) return
    depth.set(id, d)
    const n = scene.nodes[id]!
    fixDepth(n.left ?? null, d + 1)
    fixDepth(n.right ?? null, d + 1)
  }
  fixDepth(scene.root, 0)

  const total = Math.max(1, xRank.size)
  const MX = 60
  const usable = Math.max(320, total * 86)
  const X = (id: number) => MX + ((xRank.get(id) ?? 0) + 0.5) * (usable / total)
  const Y = (id: number) => 96 + (depth.get(id) ?? 0) * 86

  // 未接入树的结点（如 BST 新建的 s）：暂存区
  const staging = nodes.filter((n) => !xRank.has(n.id))

  const W = MX * 2 + usable
  const H = Math.max(360, 140 + (Math.max(0, ...depth.values()) + 1) * 86)

  // 每个结点是父母的左孩子还是右孩子（决定徽章/序号放在哪一侧才不压边）
  const sideOf = new Map<number, 'L' | 'R'>()
  nodes.forEach((n) => {
    if (n.left !== null && n.left !== undefined) sideOf.set(n.left, 'L')
    if (n.right !== null && n.right !== undefined) sideOf.set(n.right, 'R')
  })

  const isCmp = (id: number) => scene.cmp && (scene.cmp[0] === id || scene.cmp[1] === id)
  const isHl = (id: number) => scene.hl.includes(id)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 460 }}>
      <defs>
        <marker id="arrT" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
        </marker>
      </defs>

      {/* 边：由真实 left/right 指针画出，标注 左/右 */}
      {nodes.filter((n) => xRank.has(n.id)).flatMap((n) => {
        const edges: React.ReactElement[] = []
        const child = (cid: number | null | undefined, side: 0 | 1) => {
          if (cid === null || cid === undefined) return
          if (!xRank.has(cid)) return
          const isNew = scene.lastLink && scene.lastLink.from === cid && scene.lastLink.to === n.id
          edges.push(
            <g key={`e-${n.id}-${cid}`}>
              <line x1={X(n.id)} y1={Y(n.id)} x2={X(cid)} y2={Y(cid)}
                stroke={isNew ? '#4f46e5' : '#94a3b8'} strokeWidth={isNew ? 2.6 : 1.6}
                className={isNew ? 'link-draw' : undefined} />
              <text x={(X(n.id) + X(cid)) / 2 + (side === 0 ? -10 : 10)} y={(Y(n.id) + Y(cid)) / 2 - 4}
                textAnchor="middle" fontSize="9.5" fill="#b3bccf">{side === 0 ? '左' : '右'}</text>
            </g>
          )
        }
        child(n.left ?? null, 0)
        child(n.right ?? null, 1)
        return edges
      })}

      {/* 暂存区提示 */}
      {staging.length > 0 && (
        <g>
          <rect x={W / 2 - 120} y={14} width={240} height={46} rx={10} fill="#fafbfe" stroke="#e2e8f0" strokeDasharray="5 4" />
          <text x={W / 2} y={10} textAnchor="middle" fontSize="10" fill="#b3bccf">堆区暂存（malloc 的新结点）</text>
        </g>
      )}

      {/* 结点 */}
      {nodes.map((n) => {
        const inTree = xRank.has(n.id)
        const sx = inTree ? X(n.id) : W / 2 + (staging.findIndex((s) => s.id === n.id)) * 64 - (staging.length - 1) * 32
        const sy = inTree ? Y(n.id) : 37
        const ptrsHere = scene.ptrs.filter((p) => p.target === n.id).map((p) => p.name)
        // 左孩子的父母边从右上方来 → 徽章和序号都放左侧；右孩子反之；根结点放右侧
        const side = sideOf.get(n.id)
        const freeRight = side !== 'L'   // 左孩子空出左边，其余空出右边
        const chipCount = Math.min(n.visits.length, 3)
        return (
          <g key={n.id} style={{ transform: `translate(${sx}px, ${sy}px)`, transition: 'transform .5s cubic-bezier(.4,0,.2,1)' }}>
            <circle r={R}
              fill={n.mark === 2 ? '#d1fae5' : isCmp(n.id) ? '#ffedd5' : isHl(n.id) ? '#fef3c7' : inTree ? '#fff' : '#fafbfe'}
              stroke={n.mark === 2 ? '#059669' : isCmp(n.id) ? '#ea580c' : isHl(n.id) ? '#f59e0b' : '#334155'}
              strokeWidth={isCmp(n.id) || n.mark === 2 ? 2.6 : 1.7}
              strokeDasharray={inTree ? undefined : '5 4'}
              style={{ transition: 'fill .3s' }} />
            <text y={6} textAnchor="middle" fontSize="16" fontWeight="700" fill="#0f172a" style={{ fontFamily: MONO }}>{String(n.val)}</text>
            {/* 经过次数标记 ①②③：放在父母边的反侧，不压边 */}
            {n.visits.length > 0 && (
              <g transform={`translate(${freeRight ? R + 4 : -(R + 4) - (chipCount - 1) * 17}, ${-R - 2})`}>
                {n.visits.slice(0, 3).map((v, k) => (
                  <g key={k} transform={`translate(${k * 17}, 0)`}>
                    <circle r={7} fill={v === 0 ? '#fff' : '#4f46e5'} opacity={0.95} />
                    <text y={3.5} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#fff">{v}</text>
                  </g>
                ))}
              </g>
            )}
            {n.mark === 2 && <text y={-R - 10} textAnchor="middle" fontSize="10" fontWeight="600" fill="#059669">命中</text>}
            {/* 指针徽章：横放在父母边的反侧（与结点同高），彻底避开连线和序号 */}
            {ptrsHere.map((name, k) => (
              <PointerBadge key={name}
                x={freeRight ? R + 22 : -(R + 22)}
                y={-8 + k * 22}
                name={name} point={freeRight ? 'left' : 'right'} small />
            ))}
          </g>
        )
      })}

      {/* 输出序列 */}
      {scene.output.length > 0 && (
        <g transform={`translate(${MX}, ${H - 34})`}>
          <text x={0} y={-6} fontSize="11" fill="#94a3b8" letterSpacing="2">输出序列</text>
          {scene.output.map((v, i) => (
            <g key={i} transform={`translate(${i * 38}, 0)`}>
              <rect width={30} height={28} rx={7} fill="#eef0fe" stroke="#c7cdf7" />
              <text x={15} y={19} textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#4338ca" style={{ fontFamily: MONO }}>{String(v)}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
