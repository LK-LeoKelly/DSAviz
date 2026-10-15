// CodePanel.tsx —— C 源码对照面板：动画播到哪一步，源码亮哪一行
// 反向也通：点击任意代码行，动画直接跳到执行该行的那一步（代码驱动导航）

import { useEffect, useRef } from 'react'

export default function CodePanel({ title, code, line, onLineClick }: {
  title: string
  code: string[]
  line: number | null
  onLineClick?: (line: number) => void
}) {
  const cur = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    cur.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [line])
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200/80">
        <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
        <span className="text-[11px] tracking-[0.14em] text-slate-400 font-semibold">SOURCE</span>
        <span className="text-[11.5px] text-slate-500 font-mono ml-auto">{title}</span>
      </div>
      <div className="flex-1 overflow-auto py-2">
        {code.map((c, i) => (
          <div key={i} ref={i === line ? cur : undefined}
            onClick={() => onLineClick?.(i)}
            title={onLineClick ? '点击跳到执行这一行的步骤' : undefined}
            className={`flex gap-3 px-4 py-[2.5px] font-mono text-[12px] leading-relaxed whitespace-pre rounded-sm mx-1 transition-colors ${
              i === line ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500'
            } ${onLineClick ? 'cursor-pointer hover:bg-slate-100/80 hover:text-slate-700' : ''}`}>
            <span className={`w-5 text-right select-none ${i === line ? 'text-indigo-400' : 'text-slate-300'}`}>{i + 1}</span>
            <span>{c || ' '}</span>
          </div>
        ))}
      </div>
      {onLineClick && (
        <div className="px-4 py-2 border-t border-slate-100 text-[10.5px] text-slate-300">
          提示：点击任意代码行，动画跳到执行该行的那一步
        </div>
      )}
    </div>
  )
}
