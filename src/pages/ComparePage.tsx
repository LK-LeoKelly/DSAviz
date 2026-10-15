// ComparePage.tsx —— 对比赛跑：同一份数据，两个排序算法同步开跑
// 用实测的比较/交换次数把 O(n²) 与 O(n log n) 的差距摆在台面上 —— 复杂度不再靠背诵

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Play, Pause, RotateCcw, Shuffle, Trophy, Swords } from 'lucide-react'
import { ALGO_MAP } from '../engine/catalog'
import { usePlayer } from '../hooks/usePlayer'
import ArrayView from '../components/viz/views/ArrayView'

const RACE_IDS = ['sort-bubble', 'sort-select', 'sort-insert', 'sort-quick', 'sort-merge']
const BIG_O: Record<string, { label: string; order: number }> = {
  'sort-bubble': { label: 'O(n²)', order: 2 },
  'sort-select': { label: 'O(n²)', order: 2 },
  'sort-insert': { label: 'O(n²)', order: 2 },
  'sort-quick': { label: 'O(n log n)', order: 1.5 },
  'sort-merge': { label: 'O(n log n)', order: 1.5 },
}

function randArr(n: number, max = 49): number[] {
  const s = new Set<number>()
  while (s.size < n) s.add(1 + Math.floor(Math.random() * max))
  return [...s]
}

function parseArray(text: string, fallback: number[]): number[] {
  const nums = text.split(/[,，\s]+/).map((s) => Number(s)).filter((n) => Number.isFinite(n))
  return nums.length ? nums.slice(0, 10) : fallback
}

export default function ComparePage() {
  const { left: pl, right: pr } = useParams()
  const nav = useNavigate()
  const leftId = pl && RACE_IDS.includes(pl) ? pl : 'sort-bubble'
  const rightId = pr && RACE_IDS.includes(pr) ? pr : 'sort-quick'
  const algoL = ALGO_MAP[leftId]!
  const algoR = ALGO_MAP[rightId]!

  const [arrText, setArrText] = useState('')
  const arr = useMemo(() => (arrText ? parseArray(arrText, [6, 2, 8, 1, 9, 4, 3]) : [6, 2, 8, 1, 9, 4, 3]), [arrText])

  const eventsL = useMemo(() => algoL.run({ arr }), [algoL, arr])
  const eventsR = useMemo(() => algoR.run({ arr }), [algoR, arr])
  const playerL = usePlayer(eventsL)
  const playerR = usePlayer(eventsR)

  const [speed, setSpeed] = useState(1)
  useEffect(() => { playerL.setSpeed(speed); playerR.setSpeed(speed) }, [speed, playerL, playerR])

  // 完赛顺序登记
  const [finishOrder, setFinishOrder] = useState<string[]>([])
  const doneL = playerL.total > 0 && playerL.idx >= playerL.total - 1
  const doneR = playerR.total > 0 && playerR.idx >= playerR.total - 1
  useEffect(() => {
    if (doneL && !finishOrder.includes(leftId)) setFinishOrder((o) => [...o, leftId])
  }, [doneL, leftId, finishOrder])
  useEffect(() => {
    if (doneR && !finishOrder.includes(rightId)) setFinishOrder((o) => [...o, rightId])
  }, [doneR, rightId, finishOrder])
  const resetRace = () => {
    playerL.first(); playerR.first(); setFinishOrder([])
  }
  useEffect(resetRace, [leftId, rightId, arr]) // 换选手/换数据自动复位

  const racing = playerL.playing || playerR.playing
  const bothDone = doneL && doneR
  const toggle = () => {
    if (bothDone) { resetRace(); return }
    if (racing) { playerL.pause(); playerR.pause() } else { playerL.play(); playerR.play() }
  }

  const scL = playerL.scene, scR = playerR.scene

  const panel = (algo: typeof algoL, player: typeof playerL, sc: typeof scL) => {
    const rank = finishOrder.indexOf(algo.id)
    const done = player.total > 0 && player.idx >= player.total - 1
    return (
      <div className={`rounded-2xl border bg-white overflow-hidden transition ${done ? 'border-emerald-300 shadow-lg shadow-emerald-100' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
          {rank === 0 && <Trophy size={14} className="text-amber-500" />}
          <span className="text-[13.5px] font-bold text-slate-800">{algo.title}</span>
          <span className="text-[10.5px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{BIG_O[algo.id]!.label}</span>
          <span className="flex-1" />
          <span className="text-[11px] font-mono text-slate-400">{player.total ? `${player.idx + 1}/${player.total} 步` : ''}</span>
        </div>
        {/* 进度条 */}
        <div className="h-1 bg-slate-100">
          <div className={`h-full transition-[width] duration-200 ${done ? 'bg-emerald-500' : 'bg-indigo-500'}`}
            style={{ width: `${player.total ? ((player.idx + 1) / player.total) * 100 : 0}%` }} />
        </div>
        <div className="px-3 pt-4 pb-1 bg-grid min-h-[220px]">
          {sc && <ArrayView scene={sc} />}
        </div>
        <div className="px-4 py-2.5 flex items-center gap-2 text-[11.5px] font-mono">
          <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-100 text-orange-600">比较 {sc?.compares ?? 0}</span>
          <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-100 text-sky-600">交换/写入 {sc?.swaps ?? 0}</span>
          {done && <span className="text-emerald-600 font-bold">✓ 完赛{rank >= 0 ? ` · 第 ${rank + 1} 名` : ''}</span>}
        </div>
        <div className="px-4 pb-3 text-[11.5px] text-slate-400 leading-relaxed min-h-[34px] line-clamp-2">
          {sc?.note || '待命'}
        </div>
      </div>
    )
  }

  // 实测结论
  const verdict = () => {
    if (!bothDone || !scL || !scR) return null
    const cmpL = scL.compares, cmpR = scR.compares
    const swpL = scL.swaps, swpR = scR.swaps
    const fasterCmp = cmpL === cmpR ? null : cmpL < cmpR ? algoL : algoR
    const oL = BIG_O[leftId]!.order, oR = BIG_O[rightId]!.order
    return (
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-white px-5 py-4">
        <div className="flex items-center gap-2 text-[13px] font-bold text-slate-800 mb-1.5">
          <Trophy size={15} className="text-amber-500" /> 实测战报（n = {arr.length}）
        </div>
        <p className="text-[13px] leading-[1.9] text-slate-600">
          {algoL.title}：比较 <b className="font-mono text-orange-600">{cmpL}</b> 次，交换/写入 <b className="font-mono text-sky-600">{swpL}</b> 次；
          {algoR.title}：比较 <b className="font-mono text-orange-600">{cmpR}</b> 次，交换/写入 <b className="font-mono text-sky-600">{swpR}</b> 次。
          {fasterCmp && <> 论比较次数，<b>{fasterCmp.title}</b> 更少。</>}
          {oL !== oR && (
            <> 这不是运气——{oL < oR ? algoL.title : algoR.title} 是 O(n log n) 量级，对手是 O(n²)：
              每个元素都要"过一遍所有嫌疑人"和"二分/分层地处理"，差距随 n 越拉越大。把数组加长再跑一遍，你会看到倍数暴涨。</>
          )}
          {oL === oR && <> 两者同为 {BIG_O[leftId]!.label} 量级，差距在常数项与策略细节——这正是"同量级也要比优劣"的实证。</>}
        </p>
      </div>
    )
  }

  const sel = 'rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12.5px] outline-none focus:border-indigo-400 focus:bg-white transition'

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-6 page-in">
      <div className="flex items-center gap-2.5 mb-1">
        <span className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center"><Swords size={17} /></span>
        <h1 className="text-[20px] font-bold text-slate-900">对比赛跑</h1>
        <span className="text-[12px] text-slate-400 mt-1">同一份数据，两种算法同步开跑——复杂度是数出来的，不是背出来的</span>
      </div>

      {/* 控制台 */}
      <div className="flex items-end gap-3 flex-wrap rounded-2xl border border-slate-200 bg-white px-4 py-3 mt-4 mb-4">
        <label className="block">
          <span className="block text-[11px] text-slate-400 mb-1">选手 A</span>
          <select className={sel} value={leftId} onChange={(e) => nav(`/compare/${e.target.value}/${rightId}`)}>
            {RACE_IDS.map((id) => <option key={id} value={id}>{ALGO_MAP[id]!.title}</option>)}
          </select>
        </label>
        <span className="pb-2 text-slate-300 font-bold">VS</span>
        <label className="block">
          <span className="block text-[11px] text-slate-400 mb-1">选手 B</span>
          <select className={sel} value={rightId} onChange={(e) => nav(`/compare/${leftId}/${e.target.value}`)}>
            {RACE_IDS.map((id) => <option key={id} value={id}>{ALGO_MAP[id]!.title}</option>)}
          </select>
        </label>
        <label className="block flex-1 min-w-[220px]">
          <span className="block text-[11px] text-slate-400 mb-1">同一份输入（逗号分隔，最多 10 个）</span>
          <input className={`${sel} w-full font-mono`} placeholder="6, 2, 8, 1, 9, 4, 3" value={arrText} onChange={(e) => setArrText(e.target.value)} />
        </label>
        <button onClick={() => setArrText(randArr(8).join(','))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition">
          <Shuffle size={13} /> 随机数据
        </button>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {[0.5, 1, 2].map((v) => (
            <button key={v} onClick={() => setSpeed(v)}
              className={`px-2.5 py-1.5 text-[11.5px] font-mono transition ${speed === v ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
              {v}×
            </button>
          ))}
        </div>
        <button onClick={toggle}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-indigo-500 transition shadow-sm shadow-indigo-200">
          {racing ? <><Pause size={14} /> 暂停</> : bothDone ? <><RotateCcw size={14} /> 再跑一次</> : <><Play size={14} /> 开跑</>}
        </button>
      </div>

      {/* 双舞台 */}
      <div className="grid md:grid-cols-2 gap-4">
        {panel(algoL, playerL, scL)}
        {panel(algoR, playerR, scR)}
      </div>

      <div className="mt-4">{verdict()}</div>

      <p className="text-[11.5px] text-slate-400 mt-4 leading-relaxed">
        玩法建议：先默认数据看一遍"O(n²) vs O(n log n)"的身位差；再点「随机数据」换 8 个元素重跑，观察比较次数的倍数变化；
        最后试试插入排序 vs 冒泡排序——同量级算法的常数之争，结果可能出乎你的意料。
      </p>
    </div>
  )
}
