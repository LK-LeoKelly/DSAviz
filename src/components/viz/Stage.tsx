// Stage.tsx —— 舞台：旁白条 + 视图渲染区 + 代码对照 + 播放控制

import { useEffect, useState } from 'react'
import type { AlgoDef } from '../../engine/catalog'
import type { Player } from '../../hooks/usePlayer'
import { setAiContext } from '../aiContext'
import ListView from './views/ListView'
import ArrayView from './views/ArrayView'
import StackView from './views/StackView'
import QueueView from './views/QueueView'
import TreeView from './views/TreeView'
import HeapView from './views/HeapView'
import CodePanel from './CodePanel'
import Transport from './Transport'
import { Code2, ChevronDown } from 'lucide-react'

export default function Stage({ algo, player, showCode, onToggleCode, headerExtra }: {
  algo: AlgoDef
  player: Player
  showCode: boolean
  onToggleCode: () => void
  headerExtra?: React.ReactNode
}) {
  const { scene } = player
  const [deriveOpen, setDeriveOpen] = useState(false)

  // 让 AI 助教知道学生正在看什么
  useEffect(() => {
    setAiContext({ place: '算法演示', algo: algo.title, note: scene?.note ?? '' })
  }, [algo.title, scene?.note])

  // 键盘快捷键
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Space') { e.preventDefault(); player.toggle() }
      else if (e.key === 'ArrowRight') player.next()
      else if (e.key === 'ArrowLeft') player.prev()
      else if (e.key === 'Home') player.first()
      else if (e.key === 'End') player.last()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [player])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 标题行 */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold text-slate-900 truncate">{algo.title}</h2>
          <p className="text-[12px] text-slate-400 mt-0.5 font-mono">{algo.complexity}</p>
        </div>
        <div className="flex-1" />
        {scene && (scene.compares > 0 || scene.swaps > 0) && (
          <div className="hidden md:flex items-center gap-2 text-[11.5px] font-mono text-slate-500">
            <span className="px-2 py-1 rounded-md bg-orange-50 border border-orange-100">比较 {scene.compares}</span>
            <span className="px-2 py-1 rounded-md bg-sky-50 border border-sky-100">交换/写入 {scene.swaps}</span>
          </div>
        )}
        {headerExtra}
        <button onClick={onToggleCode}
          className={`inline-flex items-center gap-1.5 text-[12.5px] px-3 py-1.5 rounded-lg border transition ${
            showCode ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-500 hover:border-indigo-300'
          }`}>
          <Code2 size={14} /> 源码对照
        </button>
      </div>

      {/* 旁白条 */}
      <div className="mx-5 mb-3">
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
          <span className="mt-0.5 shrink-0 text-[10.5px] font-bold tracking-widest text-white bg-slate-800 rounded px-1.5 py-0.5">旁白</span>
          <p key={player.idx} className="text-[13.5px] leading-relaxed text-slate-700 caption-in">
            {scene?.note || '准备好后开始播放'}
          </p>
        </div>
      </div>

      {/* 复杂度推导卡：不甩结论，讲清"怎么算出来的"，并用实测计数相互印证 */}
      <div className="mx-5 mb-3">
        <div className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/50 to-white overflow-hidden">
          <button onClick={() => setDeriveOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-amber-50/60 transition">
            <span className="shrink-0 text-[10.5px] font-bold tracking-widest text-white bg-amber-500 rounded px-1.5 py-0.5">推导</span>
            <span className="text-[13px] font-semibold text-slate-700">复杂度怎么来的？</span>
            <span className="hidden sm:inline text-[11px] font-mono text-amber-700 bg-amber-100/70 rounded px-1.5 py-0.5">{algo.complexity}</span>
            <span className="flex-1" />
            {scene && (scene.compares > 0 || scene.swaps > 0) && (
              <span className="text-[11px] font-mono text-slate-400">当前实测 · 比较 {scene.compares} · 交换/写入 {scene.swaps}</span>
            )}
            <ChevronDown size={15} className={`text-slate-400 transition-transform duration-300 ${deriveOpen ? 'rotate-180' : ''}`} />
          </button>
          {deriveOpen && (
            <div className="px-4 pb-3.5 caption-in">
              <p className="text-[13px] leading-[1.95] text-slate-600 border-t border-amber-100 pt-2.5">{algo.derive}</p>
              <p className="text-[11.5px] text-slate-400 mt-2">把进度拖到最后一步：标题栏的比较/交换实测数，就是对这段推导的当场验证——复杂度不是背出来的，是数出来的。</p>
            </div>
          )}
        </div>
      </div>

      {/* 舞台 + 代码 */}
      <div className="flex-1 flex min-h-0 px-5 pb-4 gap-4">
        <div className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-grid relative overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            {scene ? (
              <div className="min-w-fit w-full h-full flex items-start justify-center px-4 pt-6">
                <div className="w-full max-w-[1100px]">
                  {scene.view === 'list' && <ListView scene={scene} />}
                  {scene.view === 'array' && <ArrayView scene={scene} />}
                  {scene.view === 'hash' && <ArrayView scene={scene} hash />}
                  {scene.view === 'stack' && <StackView scene={scene} />}
                  {scene.view === 'queue' && <QueueView scene={scene} />}
                  {scene.view === 'cqueue' && <QueueView scene={scene} circular />}
                  {scene.view === 'tree' && <TreeView scene={scene} />}
                  {scene.view === 'heap' && <HeapView scene={scene} />}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 text-sm">—</div>
            )}
          </div>
          <Transport player={player} />
        </div>

        {showCode && (
          <div className="w-[380px] shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden hidden lg:block">
            <CodePanel title={algo.codeTitle} code={algo.code} line={scene?.codeLine ?? null} onLineClick={player.seekToCodeLine} />
          </div>
        )}
      </div>
    </div>
  )
}
