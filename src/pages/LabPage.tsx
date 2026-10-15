// LabPage.tsx —— 实验室：任选算法、自定义输入、立即演算
// "想学什么就能生动体验"的自由模式；排序算法支持挑战模式（猜下一步，即时揭晓）

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { FlaskConical, Play, Shuffle, Swords, Check, X, ChevronRight } from 'lucide-react'
import { ALGOS, ALGO_MAP, CATEGORIES, type ParamSpec } from '../engine/catalog'
import { makeQuestion, CHALLENGE_ALGOS, type ChallengeQ } from '../engine/challenge'
import { usePlayer } from '../hooks/usePlayer'
import Stage from '../components/viz/Stage'

function parseArray(text: string, fallback: number[]): number[] {
  const nums = text.split(/[,，\s]+/).map((s) => Number(s)).filter((n) => Number.isFinite(n))
  return nums.length ? nums.slice(0, 12) : fallback
}

function randArr(n: number, max = 49): number[] {
  const s = new Set<number>()
  while (s.size < n) s.add(1 + Math.floor(Math.random() * max))
  return [...s]
}

export default function LabPage() {
  const { algoId } = useParams()
  const nav = useNavigate()
  const algo = (algoId && ALGO_MAP[algoId]) || ALGO_MAP['list-insert']
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [nonce, setNonce] = useState(0)
  const [showCode, setShowCode] = useState(true)

  // 由表单文本解析出参数
  const params = useMemo(() => {
    const p: Record<string, unknown> = { ...algo.defaultParams }
    for (const spec of algo.paramsSpec) {
      const t = texts[spec.key]
      if (t === undefined || t === '') continue
      if (spec.kind === 'array') p[spec.key] = parseArray(t, spec.def as number[])
      else if (spec.kind === 'number') {
        const v = Number(t)
        if (Number.isFinite(v)) p[spec.key] = Math.max(spec.min ?? -1e9, Math.min(spec.max ?? 1e9, Math.floor(v)))
      } else p[spec.key] = t
    }
    return p
  }, [algo, texts])

  const events = useMemo(() => {
    try { return algo.run(params) } catch { return algo.run(algo.defaultParams) }
    // nonce 让用户点"重新演算"时强制重放
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo, params, nonce])

  const player = usePlayer(events)

  const pickAlgo = (id: string) => {
    setTexts({})
    nav(`/lab/${id}`)
  }

  // ---------------- 挑战模式：猜下一步 ----------------
  const canChallenge = CHALLENGE_ALGOS.includes(algo.id)
  const [challenge, setChallenge] = useState(false)
  const [q, setQ] = useState<(ChallengeQ & { stepIdx: number }) | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState({ asked: 0, correct: 0 })
  const askedRef = useRef<Set<number>>(new Set())

  useEffect(() => { // 换题/换数据/开关时清场
    askedRef.current.clear(); setQ(null); setPicked(null)
  }, [events, challenge])

  useEffect(() => {
    if (!challenge || !events || !player.playing) return
    const ev = events[player.idx]
    if (!ev || ev.op !== 'compare' || ev.fast) return
    if (askedRef.current.has(player.idx)) return
    const question = makeQuestion(algo.id, events, player.idx, player.scene)
    if (!question) return
    askedRef.current.add(player.idx)
    player.pause()
    setQ({ ...question, stepIdx: player.idx })
    setPicked(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.idx, player.playing, challenge, events, algo.id])

  const answer = (i: number) => {
    if (!q || picked !== null) return
    setPicked(i)
    setScore((s) => ({ asked: s.asked + 1, correct: s.correct + (i === q.answer ? 1 : 0) }))
  }
  const resume = () => { setQ(null); setPicked(null); player.play() }

  return (
    <div className="flex-1 flex min-h-0 page-in" style={{ height: 'calc(100vh - 56px)' }}>
      {/* 算法选择 */}
      <aside className="w-[290px] shrink-0 border-r border-slate-200/80 bg-white overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold tracking-[0.16em] text-slate-400 mb-3">
            <FlaskConical size={12} /> 算法图鉴 · 自由演算
          </div>
          {CATEGORIES.map((cat) => (
            <div key={cat} className="mb-4">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">{cat}</div>
              {ALGOS.filter((a) => a.category === cat).map((a) => (
                <button key={a.id} onClick={() => pickAlgo(a.id)}
                  className={`w-full text-left rounded-xl px-3 py-2 mb-1 transition border ${
                    a.id === algo.id ? 'border-indigo-300 bg-indigo-50' : 'border-transparent hover:bg-slate-50'
                  }`}>
                  <div className={`text-[13px] font-semibold ${a.id === algo.id ? 'text-indigo-700' : 'text-slate-700'}`}>{a.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{a.summary}</div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* 主区 */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* 参数栏 */}
        <div className="border-b border-slate-200/80 bg-white px-5 py-3 flex items-end gap-4 flex-wrap">
          {algo.paramsSpec.map((spec: ParamSpec) => (
            <label key={spec.key} className="block">
              <span className="block text-[11px] text-slate-400 mb-1">{spec.label}</span>
              <input
                className="w-52 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12.5px] font-mono outline-none focus:border-indigo-400 focus:bg-white transition"
                placeholder={String(Array.isArray(spec.def) ? (spec.def as number[]).join(', ') : spec.def)}
                value={texts[spec.key] ?? ''}
                onChange={(e) => setTexts((t) => ({ ...t, [spec.key]: e.target.value }))}
              />
              {spec.hint && <span className="block text-[10px] text-slate-300 mt-0.5">{spec.hint}</span>}
            </label>
          ))}
          {algo.paramsSpec.some((s) => s.kind === 'array') && (
            <button
              onClick={() => {
                const t: Record<string, string> = { ...texts }
                for (const s of algo.paramsSpec) if (s.kind === 'array') t[s.key] = randArr(6).join(',')
                setTexts(t)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition">
              <Shuffle size={13} /> 随机数据
            </button>
          )}
          <button onClick={() => setNonce((v) => v + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-indigo-500 transition shadow-sm shadow-indigo-200">
            <Play size={13} /> 重新演算
          </button>
          {canChallenge && (
            <button onClick={() => setChallenge((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12.5px] font-semibold transition border ${
                challenge
                  ? 'bg-amber-500 border-amber-500 text-white hover:bg-amber-400 shadow-sm shadow-amber-200'
                  : 'border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-600'
              }`}>
              <Swords size={13} /> 挑战模式{challenge ? ' · 开' : ''}
            </button>
          )}
          {challenge && (
            <span className="text-[11.5px] font-mono text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
              得分 {score.correct} / {score.asked}
            </span>
          )}
          <Link to={`/compare/${algo.category === '排序' ? algo.id : 'sort-bubble'}/sort-quick`}
            className="text-[12px] text-slate-400 hover:text-indigo-600 transition ml-auto">
            去对比赛跑 →
          </Link>
        </div>
        <div className="flex-1 min-h-0 relative">
          <Stage algo={algo} player={player} showCode={showCode} onToggleCode={() => setShowCode((v) => !v)} />

          {/* 挑战题卡：暂停在决策点，猜中再揭晓 */}
          {q && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-20 w-[min(480px,92%)]">
              <div className="rounded-2xl border border-amber-200 bg-white/97 shadow-2xl shadow-amber-100/60 backdrop-blur p-4 caption-in">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10.5px] font-bold tracking-widest text-white bg-amber-500 rounded px-1.5 py-0.5">挑战</span>
                  <span className="text-[12px] font-semibold text-slate-700">猜一猜，再往下走</span>
                  <span className="ml-auto text-[11px] font-mono text-slate-400">得分 {score.correct}/{score.asked}</span>
                </div>
                <p className="text-[13.5px] leading-relaxed text-slate-800 mb-3">{q.prompt}</p>
                <div className="space-y-1.5">
                  {q.choices.map((c, i) => {
                    const state = picked === null ? 'idle' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'dim'
                    return (
                      <button key={i} onClick={() => answer(i)} disabled={picked !== null}
                        className={`w-full flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px] text-left transition ${
                          state === 'right' ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-semibold'
                            : state === 'wrong' ? 'border-rose-300 bg-rose-50 text-rose-600'
                              : state === 'dim' ? 'border-slate-100 text-slate-300'
                                : 'border-slate-200 text-slate-600 hover:border-amber-400 hover:bg-amber-50/50'
                        }`}>
                        {state === 'right' ? <Check size={14} /> : state === 'wrong' ? <X size={14} /> : null}
                        {c}
                      </button>
                    )
                  })}
                </div>
                {picked !== null && (
                  <div className="mt-3 pt-3 border-t border-slate-100 caption-in">
                    <p className="text-[12px] leading-relaxed text-slate-500 mb-2.5">{q.why}</p>
                    <button onClick={resume}
                      className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 py-2 text-[12.5px] font-semibold text-white hover:bg-indigo-600 transition">
                      继续播放 <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
