// HomePage.tsx —— 首页：产品门面
// Hero 里嵌入的是真实引擎驱动的迷你演示（链表按位插入），不是贴图

import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { ALGO_MAP, ALGOS, CATEGORIES } from '../engine/catalog'
import { CHAPTERS, TOTAL_LESSONS } from '../content/chapters'
import { usePlayer } from '../hooks/usePlayer'
import ListView from '../components/viz/views/ListView'
import { useProgress } from '../hooks/useProgress'

function MiniDemo() {
  const algo = ALGO_MAP['list-insert']
  const events = useMemo(() => algo.run(algo.defaultParams), [algo])
  const player = usePlayer(events)
  useEffect(() => {
    const t = window.setTimeout(() => player.play(), 500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // 播完循环
  useEffect(() => {
    if (!player.playing && player.idx >= player.total - 1) {
      const t = window.setTimeout(() => { player.first(); player.play() }, 2400)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.playing, player.idx])
  return (
    <div className="rounded-2xl border border-slate-200 bg-grid shadow-[0_12px_40px_-12px_rgba(15,23,42,.12)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-white/80">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
        <span className="ml-2 text-[11px] font-mono text-slate-400">ListInsert(L, 2, 6) · 实时演算</span>
      </div>
      <div className="h-[300px]">
        {player.scene && <ListView scene={player.scene} />}
      </div>
      <div className="px-4 py-2.5 border-t border-slate-100 bg-white/80 text-[12px] text-slate-500 truncate font-medium">
        {player.scene?.note}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { done } = useProgress()
  return (
    <div className="page-in">
      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-5 pt-14 pb-10 grid lg:grid-cols-[1fr_1.15fr] gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/60 px-3 py-1 text-[11.5px] font-medium text-indigo-700">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            数据结构与算法 · 可视化学习平台
          </div>
          <h1 className="mt-5 text-[40px] leading-[1.18] font-bold tracking-tight text-slate-900">
            把每一个指针的<br />每一次转向，<span className="text-indigo-600">都画给你看</span>
          </h1>
          <p className="mt-5 text-[14.5px] leading-[1.9] text-slate-500 max-w-[440px]">
            DSAViz 把数据结构与算法翻译成一步步可以逐帧回放的画面：
            链表改接的先后、折半查找的区间收缩、堆顶元素的归位——
            每一步都有旁白、有源码对照、有追问的权利。
          </p>
          <div className="mt-7 flex items-center gap-3">
            <Link to={done.size ? `/lesson/${CHAPTERS.flatMap((c) => c.lessons).find((l) => !done.has(l.id))?.id ?? CHAPTERS[0].lessons[0].id}` : `/lesson/${CHAPTERS[0].lessons[0].id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-indigo-600 transition shadow-sm">
              {done.size ? '继续学习' : '从第一课开始'} <ArrowRight size={15} />
            </Link>
            <Link to="/lab"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-[13.5px] font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition">
              进实验室自由演算
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6 text-[12px] text-slate-400 font-mono">
            <span><b className="text-slate-700 text-[15px]">{ALGOS.length}</b> 个算法</span>
            <span><b className="text-slate-700 text-[15px]">{TOTAL_LESSONS}</b> 节课</span>
            <span><b className="text-slate-700 text-[15px]">{CHAPTERS.length}</b> 章学习路径</span>
          </div>
        </div>
        <MiniDemo />
      </section>

      {/* 算法图鉴预览 */}
      <section className="mx-auto max-w-[1200px] px-5 py-14">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[21px] font-bold text-slate-900 tracking-tight">算法图鉴</h2>
            <p className="text-[13px] text-slate-400 mt-1">覆盖课程主线的 {ALGOS.length} 个算法，全部可自定义输入、逐帧回放</p>
          </div>
          <Link to="/lab" className="text-[12.5px] font-semibold text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1">
            全部演算 <ArrowRight size={13} />
          </Link>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="rounded-2xl border border-slate-200/80 bg-white p-5">
              <div className="text-[13px] font-bold text-slate-800">{cat}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ALGOS.filter((a) => a.category === cat).map((a) => (
                  <Link key={a.id} to={`/lab/${a.id}`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11.5px] text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition">
                    {a.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-8 flex flex-wrap items-center gap-4 text-[11.5px] text-slate-400">
          <span className="font-semibold text-slate-500">DSAViz · 看得见的算法</span>
          <span className="ml-auto font-mono">React + TypeScript · 事件流驱动的教学可视化</span>
        </div>
      </footer>
    </div>
  )
}
