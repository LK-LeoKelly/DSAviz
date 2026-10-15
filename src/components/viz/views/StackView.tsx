// StackView.tsx —— 顺序栈：竖直栈筒 + 输入串扫描条 + 输出序列

import type { Scene } from '../../../engine/scene'
import { MONO } from './shared'

const CW = 120
const CH = 44

export default function StackView({ scene }: { scene: Scene }) {
  const items = scene.stack
  const topIdx = items.length - 1
  const baseY = 300
  const X = 300

  const topPtr = scene.ptrs.find((p) => p.name === 'top')

  return (
    <svg viewBox="0 0 700 400" className="w-full" style={{ maxHeight: 420 }}>
      <defs>
        <marker id="arrS" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0e7490" />
        </marker>
        <marker id="arrIn" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f46e5" />
        </marker>
      </defs>

      {/* 待入栈预告：先看见谁要进来，再看它落进去 */}
      {scene.incoming !== null && scene.incoming !== undefined && (
        <g style={{ transform: `translate(${X - 168}px, ${baseY - (items.length + 1) * (CH + 8)}px)`, transition: 'transform .4s cubic-bezier(.4,0,.2,1)' }}>
          <rect x={0} y={0} width={CW} height={CH} rx={9} fill="#eef0fe" fillOpacity="0.7" stroke="#4f46e5" strokeWidth="1.8" strokeDasharray="6 5" />
          <text x={CW / 2} y={CH / 2 + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="#4f46e5" style={{ fontFamily: MONO }}>
            {String(scene.incoming)}
          </text>
          <text x={CW / 2} y={-9} textAnchor="middle" fontSize="10.5" fill="#4f46e5" letterSpacing="2">待入栈</text>
          <line x1={CW + 8} y1={CH / 2} x2={CW + 30} y2={CH / 2} stroke="#4f46e5" strokeWidth="1.8" strokeDasharray="5 4" markerEnd="url(#arrIn)" />
        </g>
      )}

      {/* 输入串扫描条（括号匹配等） */}
      {scene.input && (
        <g>
          <text x={60} y={44} fontSize="11" fill="#94a3b8" letterSpacing="2">输入串</text>
          {scene.input.split('').map((c, i) => (
            <g key={i} transform={`translate(${70 + i * 34}, 56})`}>
              <rect x={0} y={0} width={28} height={30} rx={7}
                fill={i === scene.scanPos ? '#eef0fe' : i < scene.scanPos ? '#f1f5f9' : '#fff'}
                stroke={i === scene.scanPos ? '#4f46e5' : '#e2e8f0'} strokeWidth={i === scene.scanPos ? 2 : 1.2} />
              <text x={14} y={20} textAnchor="middle" fontSize="14" fontWeight={i === scene.scanPos ? 700 : 400}
                fill={i < scene.scanPos ? '#94a3b8' : '#0f172a'} style={{ fontFamily: MONO }}>{c}</text>
            </g>
          ))}
          {scene.scanPos >= 0 && scene.scanPos < scene.input.length && (
            <text x={84 + scene.scanPos * 34} y={106} textAnchor="middle" fontSize="10" fill="#4f46e5">▲ 扫描位置</text>
          )}
        </g>
      )}

      {/* 栈筒：左右两壁 + 底 */}
      <line x1={X - 14} y1={baseY - 6 * (CH + 8) - 20} x2={X - 14} y2={baseY} stroke="#334155" strokeWidth="3" />
      <line x1={X + CW + 14} y1={baseY - 6 * (CH + 8) - 20} x2={X + CW + 14} y2={baseY} stroke="#334155" strokeWidth="3" />
      <line x1={X - 14} y1={baseY} x2={X + CW + 14} y2={baseY} stroke="#334155" strokeWidth="3" />
      <text x={X + CW / 2} y={baseY + 22} textAnchor="middle" fontSize="10.5" fill="#94a3b8" letterSpacing="3">栈底</text>

      {items.map((v, i) => (
        <g key={i} style={{ transform: `translate(${X}px, ${baseY - (i + 1) * (CH + 8)}px)`, transition: 'transform .4s cubic-bezier(.4,0,.2,1), opacity .3s' }}>
          <rect x={0} y={0} width={CW} height={CH} rx={9}
            fill={i === topIdx ? '#eef0fe' : '#fff'}
            stroke={i === topIdx ? '#4f46e5' : '#94a3b8'} strokeWidth={i === topIdx ? 2.2 : 1.4} />
          <text x={CW / 2} y={CH / 2 + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="#0f172a" style={{ fontFamily: MONO }}>
            {String(v)}
          </text>
          <text x={-24} y={CH / 2 + 4} textAnchor="end" fontSize="10" fill="#94a3b8" style={{ fontFamily: MONO }}>[{i}]</text>
        </g>
      ))}

      {items.length === 0 && (
        <text x={X + CW / 2} y={baseY - 20} textAnchor="middle" fontSize="12" fill="#b3bccf">空栈（top = -1）</text>
      )}

      {/* top 指针 */}
      {topPtr && topPtr.target !== null && topPtr.target >= 0 && topPtr.target <= topIdx && (
        <g style={{ transform: `translate(${X + CW + 40}px, ${baseY - (topIdx + 1) * (CH + 8) + CH / 2}px)`, transition: 'transform .4s' }}>
          <line x1={-26} y1={0} x2={-6} y2={0} stroke="#0e7490" strokeWidth="1.8" markerEnd="url(#arrS)" />
          <rect x={0} y={-13} width={46} height={26} rx={13} fill="#0e7490" />
          <text x={23} y={4.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#fff" style={{ fontFamily: MONO }}>top</text>
        </g>
      )}

      {/* 输出序列（进制转换等） */}
      {scene.output.length > 0 && (
        <g transform="translate(70, 340)">
          <text x={0} y={-8} fontSize="11" fill="#94a3b8" letterSpacing="2">输出序列</text>
          {scene.output.map((v, i) => (
            <g key={i} transform={`translate(${i * 38}, 0)`}>
              <rect width={30} height={30} rx={7} fill="#ecfdf5" stroke="#6ee7b7" />
              <text x={15} y={20} textAnchor="middle" fontSize="14" fontWeight="700" fill="#047857" style={{ fontFamily: MONO }}>{String(v)}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
