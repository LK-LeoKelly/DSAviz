// QueueView.tsx —— 顺序队列（横排）与循环队列（环形）

import type { Scene } from '../../../engine/scene'
import { ptrColor, MONO } from './shared'

const CW = 62
const CG = 10
const CH = 50

export default function QueueView({ scene, circular }: { scene: Scene; circular?: boolean }) {
  if (circular) return <CircularQueue scene={scene} />

  const items = scene.queue
  const W = 60 + Math.max(items.length, 6) * (CW + CG) + 60
  const front = scene.ptrs.find((p) => p.name === 'front')
  const rear = scene.ptrs.find((p) => p.name === 'rear')

  return (
    <svg viewBox={`0 0 ${W} 240`} className="w-full" style={{ maxHeight: 280 }}>
      <text x={60} y={50} fontSize="11" fill="#94a3b8" letterSpacing="2">队头 → 队尾</text>
      {items.map((v, i) => (
        <g key={i} style={{ transform: `translate(${60 + i * (CW + CG)}px, 70px)`, transition: 'transform .4s cubic-bezier(.4,0,.2,1)' }}>
          <rect width={CW} height={CH} rx={10} fill={i === 0 ? '#eef0fe' : '#fff'} stroke={i === 0 ? '#4f46e5' : '#94a3b8'} strokeWidth={i === 0 ? 2.2 : 1.4} />
          <text x={CW / 2} y={CH / 2 + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="#0f172a" style={{ fontFamily: MONO }}>{String(v)}</text>
        </g>
      ))}
      {items.length === 0 && <text x={70} y={100} fontSize="12" fill="#b3bccf">空队列</text>}
      {/* 待入队预告：新元素先亮在队尾位置，再真正入队 */}
      {scene.incoming !== null && scene.incoming !== undefined && (
        <g style={{ transform: `translate(${60 + items.length * (CW + CG)}px, 70px)`, transition: 'transform .4s cubic-bezier(.4,0,.2,1)' }}>
          <rect width={CW} height={CH} rx={10} fill="#eef0fe" fillOpacity="0.7" stroke="#4f46e5" strokeWidth="1.8" strokeDasharray="6 5" />
          <text x={CW / 2} y={CH / 2 + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="#4f46e5" style={{ fontFamily: MONO }}>{String(scene.incoming)}</text>
          <text x={CW / 2} y={CH + 17} textAnchor="middle" fontSize="10" fill="#4f46e5" letterSpacing="1">待入队</text>
        </g>
      )}
      {/* front / rear 指针 */}
      {front && front.target !== null && items.length > 0 && (
        <QBadge x={60 + 0 * (CW + CG) + CW / 2} y={140} name="front" />
      )}
      {rear && rear.target !== null && items.length > 0 && (
        <QBadge x={60 + (items.length - 1) * (CW + CG) + CW / 2} y={140} name="rear" shift={front?.target === items.length - 1} />
      )}
      <text x={60} y={210} fontSize="11" fill="#94a3b8">只能队头出、队尾进 —— 先进先出（FIFO）</text>
    </svg>
  )
}

function QBadge({ x, y, name, shift }: { x: number; y: number; name: string; shift?: boolean }) {
  const c = ptrColor(name)
  const w = name.length * 8 + 18
  return (
    <g style={{ transform: `translate(${x + (shift ? 46 : 0)}px, ${y}px)`, transition: 'transform .4s' }}>
      <line x1={0} y1={-20} x2={0} y2={0} stroke={c} strokeWidth="1.5" />
      <polygon points="-4,-20 4,-20 0,-26" fill={c} />
      <rect x={-w / 2} y={0} width={w} height={20} rx={10} fill={c} />
      <text x={0} y={14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" style={{ fontFamily: MONO }}>{name}</text>
    </g>
  )
}

// ---------------- 循环队列：环形 ----------------
function CircularQueue({ scene }: { scene: Scene }) {
  const cap = scene.capacity || 6
  const CXC = 330, CYC = 190, R = 118
  const front = scene.ptrs.find((p) => p.name === 'front')?.target ?? 0
  const rear = scene.ptrs.find((p) => p.name === 'rear')?.target ?? 0
  const values = scene.arr
  const count = values.filter((v) => v !== null && v !== -1 && v !== undefined).length

  const slotPos = (i: number) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / cap
    return { x: CXC + R * Math.cos(ang), y: CYC + R * Math.sin(ang) }
  }

  return (
    <svg viewBox="0 0 660 400" className="w-full" style={{ maxHeight: 420 }}>
      <circle cx={CXC} cy={CYC} r={R} fill="none" stroke="#eef1f8" strokeWidth="2" />
      {Array.from({ length: cap }).map((_, i) => {
        const p = slotPos(i)
        const v = values[i]
        const empty = v === null || v === undefined || v === -1
        const isHl = scene.hl.includes(i)
        const isCmp = scene.cmp && (scene.cmp[0] === i || scene.cmp[1] === i)
        return (
          <g key={i}>
            <g transform={`translate(${p.x - 30}, ${p.y - 25})`}>
              <rect width={60} height={50} rx={11}
                fill={empty ? '#f8fafc' : isCmp ? '#ffedd5' : isHl ? '#fef3c7' : '#fff'}
                stroke={isCmp ? '#ea580c' : isHl ? '#f59e0b' : empty ? '#d5dbea' : '#334155'}
                strokeWidth={isCmp || isHl ? 2.2 : 1.5} style={{ transition: 'fill .3s' }} />
              <text x={30} y={31} textAnchor="middle" fontSize="16" fontWeight="700"
                fill={empty ? '#c3cbdd' : '#0f172a'} style={{ fontFamily: MONO }}>
                {empty ? '∅' : String(v)}
              </text>
            </g>
            <text x={p.x} y={p.y + 42} textAnchor="middle" fontSize="10" fill="#94a3b8" style={{ fontFamily: MONO }}>[{i}]</text>
          </g>
        )
      })}
      {/* front/rear 徽章（放在环外侧） */}
      {(() => {
        const fp = slotPos(front)
        const rp = slotPos(rear)
        const badge = (p: { x: number; y: number }, name: string, extra: number) => {
          const c = ptrColor(name)
          const dx = p.x - CXC, dy = p.y - CYC
          const len = Math.hypot(dx, dy) || 1
          const bx = p.x + (dx / len) * (52 + extra), by = p.y + (dy / len) * (52 + extra)
          const w = name.length * 8 + 18
          return (
            <g style={{ transform: `translate(${bx}px, ${by}px)`, transition: 'transform .45s cubic-bezier(.4,0,.2,1)' }}>
              <line x1={-dx / len * 30} y1={-dy / len * 30} x2={0} y2={0} stroke={c} strokeWidth="1.6" />
              <rect x={-w / 2} y={-11} width={w} height={22} rx={11} fill={c} />
              <text x={0} y={4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" style={{ fontFamily: MONO }}>{name}</text>
            </g>
          )
        }
        const same = front === rear
        return (
          <>
            {badge(fp, 'front', same ? 18 : 0)}
            {badge(rp, 'rear', same ? 66 : 0)}
          </>
        )
      })()}
      {/* 待入队预告：亮在 rear 槽位的环外侧 */}
      {scene.incoming !== null && scene.incoming !== undefined && (() => {
        const rp = slotPos(rear)
        const dx = rp.x - CXC, dy = rp.y - CYC
        const len = Math.hypot(dx, dy) || 1
        const bx = rp.x + (dx / len) * 104, by = rp.y + (dy / len) * 104
        return (
          <g style={{ transform: `translate(${bx}px, ${by}px)`, transition: 'transform .45s cubic-bezier(.4,0,.2,1)' }}>
            <rect x={-26} y={-21} width={52} height={42} rx={10} fill="#eef0fe" fillOpacity="0.75" stroke="#4f46e5" strokeWidth="1.8" strokeDasharray="6 5" />
            <text x={0} y={6} textAnchor="middle" fontSize="15" fontWeight="700" fill="#4f46e5" style={{ fontFamily: MONO }}>{String(scene.incoming)}</text>
            <text x={0} y={-29} textAnchor="middle" fontSize="9.5" fill="#4f46e5" letterSpacing="1">待入队</text>
          </g>
        )
      })()}
      {/* 中心状态 */}
      <text x={CXC} y={CYC - 8} textAnchor="middle" fontSize="13" fill="#64748b">元素个数</text>
      <text x={CXC} y={CYC + 22} textAnchor="middle" fontSize="26" fontWeight="800" fill="#0f172a" style={{ fontFamily: MONO }}>{count}</text>
      <text x={CXC} y={CYC + 44} textAnchor="middle" fontSize="10.5" fill="#94a3b8" style={{ fontFamily: MONO }}>(rear−front+{cap}) mod {cap}</text>
    </svg>
  )
}
