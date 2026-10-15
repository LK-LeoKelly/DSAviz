// LessonPage.tsx —— 课堂页：左概念右演示，源码对照，学完即测

import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, BookOpen, KeyRound } from 'lucide-react'
import { LESSON_MAP, CHAPTERS } from '../content/chapters'
import { ALGO_MAP } from '../engine/catalog'
import { usePlayer } from '../hooks/usePlayer'
import { useProgress } from '../hooks/useProgress'
import Stage from '../components/viz/Stage'
import QuizCard from '../components/QuizCard'

export default function LessonPage() {
  const { lessonId } = useParams()
  const nav = useNavigate()
  const lesson = lessonId ? LESSON_MAP[lessonId] : undefined
  const algo = lesson ? ALGO_MAP[lesson.algoId] : undefined

  const events = useMemo(() => {
    if (!algo) return null
    const params = { ...algo.defaultParams, ...(lesson?.params ?? {}) }
    return algo.run(params)
  }, [algo, lesson])

  const player = usePlayer(events)
  const [showCode, setShowCode] = useState(true)
  const { markDone, isDone } = useProgress()

  if (!lesson || !algo) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        课不存在。<Link to="/learn" className="text-indigo-600 ml-2">返回学习路径</Link>
      </div>
    )
  }

  const chapter = CHAPTERS.find((c) => c.id === lesson.chapterId)!
  const flat = CHAPTERS.flatMap((c) => c.lessons)
  const idx = flat.findIndex((l) => l.id === lesson.id)
  const prev = idx > 0 ? flat[idx - 1] : null
  const next = idx < flat.length - 1 ? flat[idx + 1] : null

  return (
    <div className="flex-1 flex min-h-0 page-in">
      {/* 左侧：概念与测验 */}
      <aside className="w-[340px] shrink-0 border-r border-slate-200/80 bg-white overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <div className="text-[11px] font-mono text-slate-400">{chapter.title}</div>
            <h1 className="text-[19px] font-bold text-slate-900 mt-1 leading-snug">{lesson.title}</h1>
            <div className="text-[11.5px] text-slate-400 mt-1">约 {lesson.minutes} 分钟 · {isDone(lesson.id) ? '已完成 ✓' : '未完成'}</div>
          </div>

          <section>
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] text-slate-400 mb-2">
              <BookOpen size={12} /> 概念
            </div>
            <div className="space-y-3">
              {lesson.concept.map((p, i) => (
                <p key={i} className="text-[13.5px] leading-[1.85] text-slate-600">{p}</p>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] text-slate-400 mb-2">
              <KeyRound size={12} /> 要点
            </div>
            <ul className="space-y-1.5">
              {lesson.keyPoints.map((k, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] text-slate-600 leading-relaxed">
                  <span className="text-indigo-400 mt-0.5">▸</span>
                  <span className="font-mono">{k}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-[12px] text-slate-500 leading-relaxed">
            建议玩法：先完整播放一遍，再用 ← → 逐帧过一遍指针变化，最后做下面的题。
          </div>

          <QuizCard quiz={lesson.quiz} onPass={() => markDone(lesson.id)} />

          <div className="flex gap-2 pt-1 pb-6">
            {prev ? (
              <button onClick={() => nav(`/lesson/${prev.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-[12.5px] text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition">
                <ArrowLeft size={13} /> {prev.title}
              </button>
            ) : <div className="flex-1" />}
            {next && (
              <button onClick={() => nav(`/lesson/${next.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 py-2 text-[12.5px] text-white hover:bg-indigo-600 transition">
                {next.title} <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 右侧：舞台 */}
      <main className="flex-1 min-w-0">
        <Stage algo={algo} player={player} showCode={showCode} onToggleCode={() => setShowCode((v) => !v)}
          headerExtra={
            <Link to="/learn" className="inline-flex items-center gap-1 text-[12.5px] text-slate-400 hover:text-indigo-600 transition">
              <ArrowLeft size={13} /> 学习路径
            </Link>
          } />
      </main>
    </div>
  )
}
