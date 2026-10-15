// ArrayView.tsx —— 数组视图：排序 / 查找 / 哈希共用
// 下标、指针徽章（low/high/mid/i/j/min/pivot/key）、活跃区间着色、比较对与归位标记一应俱全

import type { Scene } from '../../../engine/scene'
import { PointerBadge, MONO } from './shared'

const CW = 56
const CG = 12
const CH = 56

export default function ArrayView({ scene, hash }: { scene: Scene; hash?: boolean }) {
  const n = scene.arr.length
  const MX = 40
  const Y = hash ? 120 : 130
  const W = MX * 2 + n * (CW + CG)
  const hasTmp = scene.output.length > 0
  const H = hasTmp ? 366 : 320

  const cx = (i: number) => MX + i * (CW + CG)

  // 指针徽章（目标为下标）
  const badgeGroups = new Map<number, string[]>()
  for (const p of scene.ptrs) {
    if (p.target === null || p.target < 0 || p.target >= n) continue
    const arr = badgeGroups.get(p.target) ?? []
    arr.push(p.name)
    badgeGroups.set(p.target, arr)
  }

  const isCmp = (i: number) => scene.cmp && (scene.cmp[0] === i || scene.cmp[1] === i)
  const isHl = (i: number) => scene.hl.includes(i)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: hasTmp ? 400 : 350 }}>
      <defs>
        <marker id="ar" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
        </marker>
      </defs>

      {/* 活跃区间（折半查找 / 快排分区 / 归并段 / 哈希探测路径） */}
      {scene.range && (
        <rect x={cx(scene.range[0]) - 8} y={Y - 16} width={(scene.range[1] - scene.range[0]) * (CW + CG) + CW + 16}
          height={CH + 32} rx={12} fill="#eef0fe" stroke="#c7cdf7" strokeDasharray="4 4" />
      )}

      {scene.arr.map((v, i) => {
        const mark = scene.arrMarks[i] ?? 0
        const empty = v === null || (hash && v === -1)
        return (
          <g key={i} style={{ transform: `translate(${cx(i)}px, ${Y}px)`, transition: 'transform .35s' }}>
            <rect x={0} y={0} width={CW} height={CH} rx={10}
              fill={empty ? '#f8fafc' : mark === 2 ? '#d1fae5' : mark === 1 ? '#e0e7ff' : isCmp(i) ? '#ffedd5' : isHl(i) ? '#fef3c7' : '#ffffff'}
              stroke={mark === 2 ? '#059669' : isCmp(i) ? '#ea580c' : isHl(i) ? '#f59e0b' : empty ? '#d5dbea' : '#334155'}
              strokeWidth={isCmp(i) || mark === 2 ? 2.4 : 1.5}
              style={{ transition: 'fill .3s, stroke .3s' }} />
            {empty ? (
              <text x={CW / 2} y={CH / 2 + 5} textAnchor="middle" fontSize="13" fill="#c3cbdd" style={{ fontFamily: MONO }}>∅</text>
            ) : (
              <text x={CW / 2} y={CH / 2 + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a"
                style={{ fontFamily: MONO, transition: 'all .2s' }}>{String(v)}</text>
            )}
            {/* 下标 */}
            <text x={CW / 2} y={CH + 18} textAnchor="middle" fontSize="10.5" fill="#94a3b8" style={{ fontFamily: MONO }}>{i}</text>
            {mark === 2 && <text x={CW / 2} y={-22} textAnchor="middle" fontSize="10.5" fill="#059669" fontWeight="600">已归位</text>}
          </g>
        )
      })}

      {/* 指针徽章画在下标行下方（独立一层，避免被单元格裁切），箭头朝上指向单元格 */}
      {[...badgeGroups.entries()].map(([idx, names]) =>
        names.map((name, k) => (
          <PointerBadge key={`${idx}-${name}`} x={cx(idx) + CW / 2} y={Y + CH + 60 + k * 30} name={name} point="up" small />
        ))
      )}

      {/* 比较对连线 */}
      {scene.cmp && scene.cmp[0] >= 0 && scene.cmp[1] >= 0 && (
        <path d={`M ${cx(scene.cmp[0]) + CW / 2} ${Y - 24} Q ${(cx(scene.cmp[0]) + cx(scene.cmp[1])) / 2 + CW / 2} ${Y - 52} ${cx(scene.cmp[1]) + CW / 2} ${Y - 24}`}
          fill="none" stroke="#ea580c" strokeWidth="1.8" markerEnd="url(#ar)" />
      )}
      {scene.cmp && scene.cmpKey !== null && (
        <g>
          <rect x={W / 2 - 60} y={Y - 84} width={120} height={26} rx={13} fill="#fff7ed" stroke="#fdba74" />
          <text x={W / 2} y={Y - 66} textAnchor="middle" fontSize="12" fill="#c2410c" style={{ fontFamily: MONO }}>
            比较目标 k = {scene.cmpKey}
          </text>
        </g>
      )}

      {/* 辅助数组 tmp[]（归并排序：与待写回区间逐格对齐） */}
      {hasTmp && (
        <g transform={`translate(${scene.range ? cx(scene.range[0]) : MX}, ${Y + CH + 124})`}>
          <text x={0} y={-10} fontSize="10.5" fill="#15803d" letterSpacing="1">辅助数组 tmp[] —— 双指针取小者依次放入，待会整体写回</text>
          {scene.output.map((v, i) => (
            <g key={i} transform={`translate(${i * (CW + CG)}, 0)`}>
              <rect width={CW - 12} height={36} rx={8} fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
              <text x={(CW - 12) / 2} y={23} textAnchor="middle" fontSize="14.5" fontWeight="700" fill="#15803d" style={{ fontFamily: MONO }}>{String(v)}</text>
              <text x={(CW - 12) / 2} y={48} textAnchor="middle" fontSize="9" fill="#94a3b8" style={{ fontFamily: MONO }}>tmp[{i}]</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
