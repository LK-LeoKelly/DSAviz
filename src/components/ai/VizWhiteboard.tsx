// VizWhiteboard.tsx —— AI 白板：AI 在对话里给出的演示卡，点开后在这里真实演算
// 画面仍由事件流引擎渲染（与实验室同一套），保证指针、结构、复杂度全部准确

import { useEffect, useMemo, useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { ALGO_MAP } from '../../engine/catalog'
import { usePlayer } from '../../hooks/usePlayer'
import Stage from '../viz/Stage'

export interface WhiteboardReq {
  algoId: string
  params: Record<string, unknown>
  title: string
}

export default function VizWhiteboard({ req, onClose }: { req: WhiteboardReq; onClose: () => void }) {
  const algo = ALGO_MAP[req.algoId]
  const [showCode, setShowCode] = useState(true)

  const events = useMemo(() => {
    if (!algo) return []
    try { return algo.run(req.params) } catch { return algo.run(algo.defaultParams) }
  }, [algo, req.params])
  const player = usePlayer(events)

  // 开场自动播放，像老师"我再给你们演示一遍"
  useEffect(() => {
    const t = window.setTimeout(() => player.play(), 400)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Esc 关闭
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!algo) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-[min(1180px,96vw)] h-[min(760px,92vh)] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 to-white shrink-0">
          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center"><Sparkles size={14} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-slate-900 truncate">{req.title}</div>
            <div className="text-[10.5px] text-slate-400">来自助教的演示 · 与实验室同一引擎，可逐帧回放</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition p-1"><X size={17} /></button>
        </div>
        <div className="flex-1 min-h-0">
          <Stage algo={algo} player={player} showCode={showCode} onToggleCode={() => setShowCode((v) => !v)} />
        </div>
      </div>
    </div>
  )
}
