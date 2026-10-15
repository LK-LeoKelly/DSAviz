// Transport.tsx —— 播放控制条：首/上一步/播放/下一步/末 + 倍速 + 进度条 + 步数

import { SkipBack, ChevronLeft, Play, Pause, ChevronRight, SkipForward } from 'lucide-react'
import type { Player } from '../../hooks/usePlayer'

const SPEEDS = [
  { label: '0.5×', v: 0.5 },
  { label: '1×', v: 1 },
  { label: '2×', v: 2 },
  { label: '4×', v: 4 },
]

export default function Transport({ player }: { player: Player }) {
  const p = player
  const btn = 'h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-600'
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-200/80 bg-white/70 backdrop-blur">
      <button className={btn} onClick={p.first} disabled={p.total === 0} title="回到开头"><SkipBack size={15} /></button>
      <button className={btn} onClick={p.prev} disabled={p.idx <= 0} title="上一步（←）"><ChevronLeft size={16} /></button>
      <button
        className="h-10 w-12 inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm shadow-indigo-200 disabled:opacity-30"
        onClick={p.toggle} disabled={p.total === 0} title="播放 / 暂停（空格）">
        {p.playing ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
      </button>
      <button className={btn} onClick={p.next} disabled={p.idx >= p.total - 1} title="下一步（→）"><ChevronRight size={16} /></button>
      <button className={btn} onClick={p.last} disabled={p.total === 0} title="跳到结尾"><SkipForward size={15} /></button>

      <div className="flex rounded-lg border border-slate-200 overflow-hidden ml-1">
        {SPEEDS.map((s) => (
          <button key={s.v} onClick={() => p.setSpeed(s.v)}
            className={`px-2 py-1.5 text-[11.5px] font-mono transition ${p.speed === s.v ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <input
        type="range" min={0} max={Math.max(0, p.total - 1)} value={p.idx}
        onChange={(e) => { p.pause(); p.seek(Number(e.target.value)) }}
        className="flex-1 accent-indigo-600 h-1.5 cursor-pointer"
      />
      <span className="text-[12px] font-mono text-slate-400 w-20 text-right select-none">
        {p.total ? `${p.idx + 1} / ${p.total}` : '— / —'}
      </span>
    </div>
  )
}
