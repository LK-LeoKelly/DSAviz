// LearnPage.tsx —— 学习路径：六章二十五课，循序渐进
// 顶部是"我的复习清单"：助教给过的演示卡自动收在这里，和课程进度放一起形成复习闭环

import { useState } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, Circle, Clock3, ChevronRight, PlayCircle, Trash2, BookmarkCheck } from 'lucide-react'
import { CHAPTERS, TOTAL_LESSONS } from '../content/chapters'
import { useProgress } from '../hooks/useProgress'
import { loadVizHistory, removeViz, type VizEntry } from '../ai/vizHistory'
import { ALGO_MAP } from '../engine/catalog'
import VizWhiteboard, { type WhiteboardReq } from '../components/ai/VizWhiteboard'

export default function LearnPage() {
  const { isDone, done } = useProgress()
  const pct = Math.round((done.size / TOTAL_LESSONS) * 100)
  const [vizList, setVizList] = useState<VizEntry[]>(() => loadVizHistory())
  const [board, setBoard] = useState<WhiteboardReq | null>(null)

  // 找到下一课（第一个未完成的）
  const flat = CHAPTERS.flatMap((c) => c.lessons)
  const nextLesson = flat.find((l) => !done.has(l.id)) ?? flat[0]

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-10 page-in">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">学习路径</h1>
          <p className="text-[13.5px] text-slate-500 mt-1.5">
            对齐《数据结构》课程主线，共 {CHAPTERS.length} 章 {TOTAL_LESSONS} 课。每课 = 概念 → 逐步演示 → 随堂小测。
          </p>
        </div>
        <div className="w-64">
          <div className="flex justify-between text-[11.5px] text-slate-400 mb-1.5">
            <span>总进度</span><span className="font-mono">{done.size} / {TOTAL_LESSONS}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200/70 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {nextLesson && done.size < TOTAL_LESSONS && (
            <Link to={`/lesson/${nextLesson.id}`} className="mt-2 inline-flex items-center gap-1 text-[12px] text-indigo-600 hover:text-indigo-500 font-medium">
              继续学习：{nextLesson.title} <ChevronRight size={12} />
            </Link>
          )}
        </div>
      </div>

      {/* 我的复习清单：助教给过的演示卡 + 课程进度，组成课后复习闭环 */}
      <section className="mt-8 rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-white">
          <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center"><BookmarkCheck size={15} /></span>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15.5px] font-bold text-slate-900">我的复习清单</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">助教讲过的演示自动收在这里，点开即重播——忘了哪步就再看一遍</p>
          </div>
          <span className="text-[11.5px] font-mono text-slate-400">{vizList.length} 张</span>
        </div>
        {vizList.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
            {vizList.slice(0, 6).map((e) => (
              <div key={e.ts} className="group relative rounded-xl border border-slate-200 px-4 py-3.5 hover:border-indigo-300 hover:shadow-[0_8px_24px_-10px_rgba(79,70,229,.25)] transition">
                <button onClick={() => setBoard({ algoId: e.algoId, params: e.params, title: e.title })} className="w-full text-left">
                  <div className="flex items-center gap-2 text-[11px] text-indigo-500 font-medium">
                    <PlayCircle size={12} /> {ALGO_MAP[e.algoId]?.title ?? e.algoId}
                  </div>
                  <div className="mt-1.5 text-[13.5px] font-semibold text-slate-800 leading-snug line-clamp-2">{e.title}</div>
                  <div className="mt-1.5 text-[10.5px] text-slate-400">
                    {new Date(e.ts).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {e.from ? ` · 来自《${e.from}》` : ''}
                  </div>
                </button>
                <button onClick={() => setVizList((v) => removeViz(e.ts, v))} title="从清单移除"
                  className="absolute top-2.5 right-2.5 text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-[12.5px] text-slate-400 leading-relaxed">
              清单还是空的——去右下角问助教一个问题，比如"给我演示一下归并排序"，<br className="hidden sm:inline" />
              它给的演示卡会自动收进这里，随时回放。
            </p>
          </div>
        )}
      </section>

      <div className="mt-8 space-y-8">
        {CHAPTERS.map((ch, ci) => {
          const chDone = ch.lessons.filter((l) => isDone(l.id)).length
          return (
            <section key={ch.id} className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
              <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <span className="w-8 h-8 rounded-lg bg-slate-900 text-white text-[13px] font-bold flex items-center justify-center font-mono">
                  {String(ci + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15.5px] font-bold text-slate-900">{ch.title}</h2>
                  <p className="text-[12px] text-slate-400 mt-0.5 truncate">{ch.desc}</p>
                </div>
                <span className="text-[11.5px] font-mono text-slate-400">{chDone} / {ch.lessons.length}</span>
              </div>
              <div className="divide-y divide-slate-50">
                {ch.lessons.map((l, li) => {
                  const doneIt = isDone(l.id)
                  return (
                    <Link key={l.id} to={`/lesson/${l.id}`}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-indigo-50/40 transition group">
                      {doneIt
                        ? <CheckCircle2 size={17} className="text-emerald-500 shrink-0" />
                        : <Circle size={17} className="text-slate-300 shrink-0 group-hover:text-indigo-400 transition" />}
                      <span className="text-[12px] font-mono text-slate-300 w-10">{ci + 1}.{li + 1}</span>
                      <span className={`text-[13.5px] flex-1 ${doneIt ? 'text-slate-400' : 'text-slate-700 group-hover:text-slate-900'}`}>{l.title}</span>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-300"><Clock3 size={11} /> {l.minutes} min</span>
                      <ChevronRight size={14} className="text-slate-200 group-hover:text-indigo-400 transition" />
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {board && <VizWhiteboard req={board} onClose={() => setBoard(null)} />}
    </div>
  )
}
