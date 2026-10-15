// QuizCard.tsx —— 随堂小测：答错给解析，答对才可"完成本课"

import { useState } from 'react'
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react'
import type { Quiz } from '../content/chapters'

export default function QuizCard({ quiz, onPass }: { quiz: Quiz[]; onPass: () => void }) {
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [passed, setPassed] = useState(false)
  const cur = quiz[qi]
  if (!cur) return null

  const choose = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    if (i === cur.answer) {
      if (qi === quiz.length - 1) {
        setPassed(true)
        onPass()
      }
    }
  }

  const nextQ = () => {
    setQi((v) => v + 1)
    setPicked(null)
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-indigo-500">
        <Lightbulb size={13} /> 随堂小测 · {qi + 1} / {quiz.length}
      </div>
      <h3 className="mt-2 text-[15px] font-semibold leading-relaxed text-slate-900">{cur.q}</h3>
      <div className="mt-3 space-y-2">
        {cur.options.map((op, i) => {
          const isAns = i === cur.answer
          const chosen = picked === i
          let cls = 'border-slate-200 hover:border-indigo-300 text-slate-700'
          if (picked !== null) {
            if (isAns) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800 font-medium'
            else if (chosen) cls = 'border-rose-300 bg-rose-50 text-rose-700'
            else cls = 'border-slate-200 text-slate-400'
          }
          return (
            <button key={i} onClick={() => choose(i)} disabled={picked !== null}
              className={`w-full text-left rounded-xl border px-4 py-2.5 text-[13.5px] transition flex items-center gap-2 ${cls}`}>
              {picked !== null && isAns && <CheckCircle2 size={15} className="shrink-0" />}
              {picked !== null && chosen && !isAns && <XCircle size={15} className="shrink-0" />}
              {op}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div className={`mt-3 rounded-xl px-4 py-3 text-[12.5px] leading-relaxed ${picked === cur.answer ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
          <b>{picked === cur.answer ? '答对了：' : '再想想：'}</b>{cur.explain}
        </div>
      )}
      <div className="mt-3 flex justify-end">
        {picked === cur.answer && qi < quiz.length - 1 && (
          <button onClick={nextQ} className="text-[12.5px] font-semibold text-indigo-600 hover:text-indigo-500">下一题 →</button>
        )}
        {passed && <span className="text-[12.5px] font-semibold text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 size={14} /> 本课已完成</span>}
      </div>
    </div>
  )
}
