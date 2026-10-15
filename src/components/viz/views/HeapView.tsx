// HeapView.tsx —— 堆双视图：上面是完全二叉树（逻辑结构），下面是数组（物理存储）
// 二者用同一组下标联动：学生一眼看清"完全二叉树用数组存"的含义

import type { Scene } from '../../../engine/scene'
import { MONO } from './shared'

const R = 21

export default function HeapView({ scene }: { scene: Scene }) {
  const a = scene.arr
  const n = a.length
  const W = Math.max(560, 70 * n + 80)
  const levels = Math.max(1, Math.ceil(Math.log2(n + 1)))
  const treeH = 40 + levels * 74
  const arrY = treeH + 46
  const H = arrY + 96

  const pos = (i: number) => {
    const d = Math.floor(Math.log2(i + 1))
    const k = i - (2 ** d - 1)
    const cnt = 2 ** d
    return { x: ((k + 0.5) / cnt) * (W - 80) + 40, y: 46 + d * 74 }
  }

  const isCmp = (i: number) => scene.cmp && (scene.cmp[0] === i || scene.cmp[1] === i)
  const isHl = (i: number) => scene.hl.includes(i)
  const mark = (i: number) => scene.arrMarks[i] ?? 0

  const color = (i: number) =>
    mark(i) === 2 ? { f: '#d1fae5', s: '#059669' }
      : mark(i) === 1 ? { f: '#e0e7ff', s: '#6366f1' }
        : isCmp(i) ? { f: '#ffedd5', s: '#ea580c' }
          : isHl(i) ? { f: '#fef3c7', s: '#f59e0b' }
            : { f: '#fff', s: '#334155' }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 480 }}>
      <text x={40} y={24} fontSize="11" fill="#94a3b8" letterSpacing="2">逻辑结构 · 完全二叉树</text>
      {/* 树边 */}
      {a.map((_, i) => {
        if (i === 0) return null
        const p = pos((i - 1) >> 1)
        const c = pos(i)
        const hot = isCmp(i) && isCmp((i - 1) >> 1)
        return <line key={i} x1={p.x} y1={p.y} x2={c.x} y2={c.y} stroke={hot ? '#ea580c' : '#cbd5e1'} strokeWidth={hot ? 2.4 : 1.5} />
      })}
      {/* 树结点 */}
      {a.map((v, i) => (
        <g key={i} transform={`translate(${pos(i).x}, ${pos(i).y})`}>
          <circle r={R} fill={color(i).f} stroke={color(i).s} strokeWidth={isCmp(i) || mark(i) === 2 ? 2.6 : 1.7} style={{ transition: 'fill .3s' }} />
          <text y={5.5} textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f172a" style={{ fontFamily: MONO }}>
            {v === null || v === -1 ? '' : String(v)}
          </text>
          <text y={R + 14} textAnchor="middle" fontSize="9.5" fill="#94a3b8" style={{ fontFamily: MONO }}>{i}</text>
        </g>
      ))}

      {/* 物理存储：数组 */}
      <text x={40} y={arrY - 12} fontSize="11" fill="#94a3b8" letterSpacing="2">物理存储 · 数组</text>
      {a.map((v, i) => {
        const x = 40 + i * 62
        return (
          <g key={`c-${i}`} transform={`translate(${x}, ${arrY})`}>
            <rect width={52} height={46} rx={9} fill={color(i).f} stroke={color(i).s} strokeWidth={isCmp(i) ? 2.4 : 1.4} style={{ transition: 'fill .3s' }} />
            <text x={26} y={28} textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f172a" style={{ fontFamily: MONO }}>
              {v === null || v === -1 ? '∅' : String(v)}
            </text>
            <text x={26} y={62} textAnchor="middle" fontSize="9.5" fill="#94a3b8" style={{ fontFamily: MONO }}>[{i}]</text>
            {/* 树-数组联动线 */}
            {i < n && <line x1={26} y1={-8} x2={pos(i).x - x} y2={-arrY + pos(i).y + R + 18} stroke="#eef1f8" strokeWidth="1" strokeDasharray="2 4" />}
          </g>
        )
      })}
    </svg>
  )
}
