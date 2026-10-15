// shared.tsx —— 视图共享：指针徽章配色、常量

export const PTR_COLORS: Record<string, string> = {
  L: '#475569', p: '#4f46e5', q: '#d97706', s: '#059669', r: '#7c3aed',
  top: '#0e7490', front: '#0e7490', rear: '#7c3aed',
  low: '#0e7490', high: '#7c3aed', mid: '#d97706',
  min: '#059669', pivot: '#dc2626', i: '#4f46e5', j: '#d97706', key: '#059669',
}

export function ptrColor(name: string): string {
  return PTR_COLORS[name] ?? '#334155'
}

// 指针徽章：一个带名字的胶囊 + 指向目标的细线
// point：箭头朝哪边指（即目标在徽章的哪一侧）。down=徽章在目标正上方；up=徽章在目标下方；left/right=徽章在目标右/左侧
export function PointerBadge(props: { x: number; y: number; name: string; stackIndex?: number; small?: boolean; point?: 'down' | 'up' | 'left' | 'right' }) {
  const { x, y, name, stackIndex = 0, small, point = 'down' } = props
  const h = small ? 16 : 20
  const w = Math.max(26, name.length * (small ? 8 : 9.5) + 12)
  const c = ptrColor(name)
  const yy = point === 'down' ? y - stackIndex * (h + 6) : y + stackIndex * (h + 6)
  return (
    <g style={{ transform: `translate(${x}px, ${yy}px)`, transition: 'transform .4s cubic-bezier(.4,0,.2,1)' }}>
      {point === 'down' && (
        <>
          <line x1={0} y1={h} x2={0} y2={h + 8} stroke={c} strokeWidth={1.4} />
          <polygon points={`-4,${h + 8} 4,${h + 8} 0,${h + 13}`} fill={c} />
        </>
      )}
      {point === 'up' && (
        <>
          <line x1={0} y1={-26} x2={0} y2={0} stroke={c} strokeWidth={1.4} />
          <polygon points={`-4,-26 4,-26 0,-31`} fill={c} />
        </>
      )}
      {point === 'left' && (
        <>
          <line x1={-w / 2 - 8} y1={h / 2} x2={-w / 2} y2={h / 2} stroke={c} strokeWidth={1.4} />
          <polygon points={`${-w / 2 - 8},${h / 2 - 4} ${-w / 2 - 8},${h / 2 + 4} ${-w / 2 - 13},${h / 2}`} fill={c} />
        </>
      )}
      {point === 'right' && (
        <>
          <line x1={w / 2} y1={h / 2} x2={w / 2 + 8} y2={h / 2} stroke={c} strokeWidth={1.4} />
          <polygon points={`${w / 2 + 8},${h / 2 - 4} ${w / 2 + 8},${h / 2 + 4} ${w / 2 + 13},${h / 2}`} fill={c} />
        </>
      )}
      <rect x={-w / 2} y={0} width={w} height={h} rx={h / 2} fill={c} />
      <text x={0} y={h / 2 + (small ? 3.5 : 4)} textAnchor="middle" fontSize={small ? 10 : 11.5} fontWeight={700}
        fill="#fff" style={{ fontFamily: 'ui-monospace, Consolas, monospace' }}>
        {name}
      </text>
    </g>
  )
}

export const MONO = 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace'
