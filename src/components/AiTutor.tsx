// AiTutor.tsx —— AI 助教：右下角悬浮对话
// 两条能力线：
// 1) 答疑：携带学生当前画面上下文（看到哪个算法哪一步），调用 /api/chat
// 2) 课件助学：拖入/上传老师的课件（pptx/docx/pdf/txt/md），本地解析出文字，
//    AI 读完后做总结、规划、出题；回复中可嵌入 ```viz 演示指令，
//    前端把它渲染成可点击的演示卡，点开即用真实引擎在白板上演算

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, Loader2, Paperclip, FileText, Trash2, PlayCircle, UploadCloud, History, ChevronLeft } from 'lucide-react'
import { getAiContext } from './aiContext'
import { parseCourseware, type Courseware } from '../ai/courseware'
import { parseAssistant, catalogBrief, type VizAction } from '../ai/vizAction'
import { loadVizHistory, collectViz, removeViz, clearViz, type VizEntry } from '../ai/vizHistory'
import { ALGO_MAP } from '../engine/catalog'
import Md from '../ai/markdown'
import VizWhiteboard, { type WhiteboardReq } from './ai/VizWhiteboard'

interface Msg { role: 'user' | 'assistant'; content: string }
interface Attached {
  id: number
  name: string
  status: 'parsing' | 'ready' | 'error'
  info?: string      // 例：12页 · 4,230 字（已截取）
  error?: string
  cw?: Courseware
}

const SYSTEM = `你是《数据结构与算法》课程的助教，面向计算机专业本科生。
讲课式口吻，先给结论再解释，必要时举具体小例子；术语对齐严蔚敏教材（头结点/首元结点/前驱/位序）；代码用 C 且简短。
默认 150~400 字；若学生要求总结课件或规划学习路线，可到 800 字并分点，结构清晰。
排版用 Markdown：重点用 **加粗**，分点用 - 或 1. 列表，对比用表格，代码用行内代码或代码块。
始终以课程助教身份说话，绝不提及自己是人工智能、语言模型、API 或接口，不说"作为 AI"之类的话。

【演示能力】你可以让学生当场看到某个算法的真实动画演示。在需要演示的位置单独输出一个代码块：
\`\`\`viz
{"algo": "算法id", "params": {"参数名": 值}, "title": "一句话说明这张演示看什么"}
\`\`\`
规则：
- algo 只能取自下方目录的 id；params 可省略（用默认数据）。
- 若课件或题目里出现了具体数据（如一组关键字序列），优先填进 params，让演示贴合学生的材料。
- 每个演示块前用一句引导语衔接；一次回复最多 3 个演示块，挑最值得看的。
- 不要编造目录外的 id，不要输出 viz 以外的代码块标记。

【算法目录】id｜名称｜简介｜参数
` + catalogBrief()

let fileSeq = 1

export default function AiTutor() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: '你好，我是本课程的 AI 助教。看演示时有任何一步没看懂，直接问我——我知道你现在看到哪里了。\n\n也可以把老师的课件（pptx / docx / pdf）拖进来，我读完后帮你总结重点、规划学习路线，还能把课件里的例子直接变成动画演示。' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [files, setFiles] = useState<Attached[]>([])
  const [dragging, setDragging] = useState(false)
  const [board, setBoard] = useState<WhiteboardReq | null>(null)
  const [history, setHistory] = useState<VizEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then((d) => setAvailable(!!d.llm)).catch(() => setAvailable(false))
    setHistory(loadVizHistory())
  }, [])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, open, files, busy])

  const attach = (list: FileList | File[]) => {
    for (const f of Array.from(list)) {
      const id = fileSeq++
      setFiles((fs) => [...fs, { id, name: f.name, status: 'parsing' }])
      parseCourseware(f)
        .then((cw) => setFiles((fs) => fs.map((x) => x.id === id ? {
          ...x, status: 'ready', cw,
          info: `${cw.kind === 'pptx' ? '幻灯片' : cw.kind === 'pdf' ? '页' : '段'} ${cw.pageCount} · ${cw.chars.toLocaleString()} 字${cw.truncated ? '（已截取重点部分）' : ''}`,
        } : x)))
        .catch((e: any) => setFiles((fs) => fs.map((x) => x.id === id ? { ...x, status: 'error', error: e?.message ?? '解析失败' } : x)))
    }
  }

  const readyFiles = files.filter((f) => f.status === 'ready' && f.cw)

  const sendWith = async (q0: string) => {
    const q = q0.trim()
    if (!q || busy) return
    setInput('')
    const nextMsgs: Msg[] = [...msgs, { role: 'user', content: q }]
    setMsgs(nextMsgs)
    setBusy(true)
    try {
      const ctx = getAiContext()
      let sys = SYSTEM + `\n\n【学生当前画面】位置：${ctx.place}${ctx.algo ? `；算法：${ctx.algo}` : ''}${ctx.note ? `；当前步骤旁白：${ctx.note}` : ''}`
      if (readyFiles.length) {
        sys += '\n\n【课件资料】（学生上传的课件，已提取为文字；回答时优先结合它）'
        for (const f of readyFiles) sys += `\n\n——《${f.name}》——\n${f.cw!.text}`
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: sys }, ...nextMsgs.slice(-12)] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '请求失败')
      const reply: string = data.content || '（空回复）'
      // 演示卡自动收进"演示记录"，课后可一键回放
      const actions = parseAssistant(reply).filter((s) => s.type === 'viz').map((s) => (s as { type: 'viz'; action: VizAction }).action)
      if (actions.length) setHistory((h) => collectViz(actions, readyFiles[0]?.name, h))
      setMsgs([...nextMsgs, { role: 'assistant', content: reply }])
    } catch (e: any) {
      console.error('[AiTutor]', e)
      setMsgs([...nextMsgs, { role: 'assistant', content: '助教暂时连不上了，请稍后再试。' }])
    } finally {
      setBusy(false)
    }
  }

  const SUGGESTIONS = [
    '总结这份课件的重点，按考试频率排序',
    '按课件给我排一条学习路线，重点知识配上演示',
    '根据课件内容出 3 道题考考我',
  ]

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed right-5 bottom-5 z-50 inline-flex items-center gap-2 rounded-full bg-slate-900 pl-4 pr-5 py-3 text-[13px] font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-indigo-600 transition">
          <MessageCircle size={16} /> AI 助教
        </button>
      )}
      {open && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) attach(e.dataTransfer.files) }}
          className="fixed right-5 bottom-5 z-50 w-[400px] max-w-[calc(100vw-40px)] h-[560px] max-h-[76vh] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 flex flex-col overflow-hidden">
          {dragging && (
            <div className="absolute inset-0 z-10 bg-indigo-50/95 border-2 border-dashed border-indigo-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-indigo-600 pointer-events-none">
              <UploadCloud size={30} />
              <div className="text-[13px] font-semibold">松开，把课件交给我</div>
              <div className="text-[11px] text-indigo-400">pptx / docx / pdf / txt / md · 本地解析不上传</div>
            </div>
          )}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center"><MessageCircle size={14} /></span>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-slate-900">{showHistory ? '演示记录' : 'AI 助教'}</div>
              <div className="text-[10.5px] text-slate-400">
                {showHistory ? `${history.length} 张演示卡，点开即回放` : available === null ? '检测中…' : available ? '在线 · 知道你正在看哪一步' : '暂时离线'}
              </div>
            </div>
            <button onClick={() => setShowHistory((v) => !v)} title="演示记录"
              className={`relative p-1.5 rounded-lg transition ${showHistory ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
              {showHistory ? <ChevronLeft size={16} /> : <History size={15} />}
              {!showHistory && history.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center px-0.5">{history.length}</span>
              )}
            </button>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 transition"><X size={16} /></button>
          </div>

          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {showHistory ? (
              <HistoryList
                history={history}
                onReplay={(e) => { setBoard({ algoId: e.algoId, params: e.params, title: e.title }); setShowHistory(false) }}
                onRemove={(ts) => setHistory((h) => removeViz(ts, h))}
                onClear={() => setHistory(clearViz())}
              />
            ) : (
            <>
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[88%] ${m.role === 'user' ? 'ml-auto' : ''}`}>
                {m.role === 'user' ? (
                  <div className="rounded-2xl rounded-br-md bg-indigo-600 text-white px-3.5 py-2.5 text-[13px] leading-[1.75] whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <AssistantBubble content={m.content} onViz={(a) => setBoard({ algoId: a.algoId, params: a.params, title: a.title })} />
                )}
              </div>
            ))}
            {busy && (
              <div className="inline-flex items-center gap-2 bg-slate-100/80 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[12.5px] text-slate-400">
                <Loader2 size={13} className="animate-spin" /> {readyFiles.length ? '正在结合课件思考…' : '思考中…'}
              </div>
            )}
            {files.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {files.map((f) => (
                  <div key={f.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11.5px] ${
                    f.status === 'error' ? 'border-rose-200 bg-rose-50/60 text-rose-600' : 'border-slate-200 bg-slate-50/80 text-slate-600'}`}>
                    {f.status === 'parsing'
                      ? <Loader2 size={12} className="animate-spin shrink-0 text-indigo-500" />
                      : <FileText size={12} className={`shrink-0 ${f.status === 'error' ? 'text-rose-400' : 'text-indigo-500'}`} />}
                    <span className="font-medium truncate max-w-[150px]">{f.name}</span>
                    <span className="text-[10.5px] text-slate-400 truncate">
                      {f.status === 'parsing' ? '解析中…' : f.status === 'ready' ? f.info : f.error}
                    </span>
                    <button onClick={() => setFiles((fs) => fs.filter((x) => x.id !== f.id))}
                      className="ml-auto text-slate-300 hover:text-rose-500 transition shrink-0" title="移除">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {readyFiles.length > 0 && !busy && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} onClick={() => sendWith(s)}
                        className="rounded-full border border-indigo-200 bg-indigo-50/60 px-2.5 py-1 text-[11px] text-indigo-600 hover:bg-indigo-100 transition">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>

          <div className="border-t border-slate-100 p-3 flex gap-2">
            <input ref={fileInputRef} type="file" multiple accept=".pptx,.docx,.pdf,.txt,.md" className="hidden"
              onChange={(e) => { if (e.target.files?.length) attach(e.target.files); e.target.value = '' }} />
            <button onClick={() => fileInputRef.current?.click()} title="上传课件（也可以直接拖进来）"
              className="rounded-xl border border-slate-200 px-3 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition">
              <Paperclip size={15} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendWith(input)}
              placeholder={readyFiles.length ? '想让我怎么用这份课件？例如：总结重点+演示快排' : '例如：这一步为什么要先改 s->next？'}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] outline-none focus:border-indigo-400 focus:bg-white transition"
            />
            <button onClick={() => sendWith(input)} disabled={busy || !input.trim()}
              className="rounded-xl bg-indigo-600 text-white px-3.5 hover:bg-indigo-500 transition disabled:opacity-40">
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
      {board && <VizWhiteboard req={board} onClose={() => setBoard(null)} />}
    </>
  )
}

/** 助教气泡：文本段（Markdown 排版）+ 演示卡（viz 指令渲染成可点击卡片） */
function AssistantBubble({ content, onViz }: { content: string; onViz: (a: VizAction) => void }) {
  const segs = parseAssistant(content)
  return (
    <div className="space-y-2">
      {segs.map((s, i) => s.type === 'text' ? (
        <div key={i} className="rounded-2xl rounded-bl-md bg-slate-100/80 text-slate-700 px-3.5 py-2.5 text-[13px] leading-[1.75]"><Md text={s.text} /></div>
      ) : (
        <button key={i} onClick={() => onViz(s.action)}
          className="w-full text-left rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-white px-3.5 py-2.5 hover:border-indigo-400 hover:shadow-[0_6px_20px_-8px_rgba(79,70,229,.35)] transition group">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <PlayCircle size={13} />
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-slate-800 truncate">{s.action.title}</div>
              <div className="text-[10.5px] text-indigo-500 font-medium">点开白板，看真实演算 →</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

/** 演示记录列表：助教给过的演示卡按时间倒序收在这里 */
function HistoryList({ history, onReplay, onRemove, onClear }: {
  history: VizEntry[]
  onReplay: (e: VizEntry) => void
  onRemove: (ts: number) => void
  onClear: () => void
}) {
  if (!history.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-16">
        <History size={26} className="text-slate-200" />
        <div className="text-[12.5px] text-slate-400">还没有演示记录</div>
        <div className="text-[11px] text-slate-300 leading-relaxed">助教在回复里给出的演示卡，<br />会自动收在这里，方便课后回放复习</div>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {history.map((e) => (
        <div key={e.ts} className="group flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 hover:border-indigo-300 hover:bg-indigo-50/40 transition">
          <button onClick={() => onReplay(e)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0"><PlayCircle size={14} /></span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-slate-800 truncate">{e.title}</span>
              <span className="block text-[10.5px] text-slate-400 truncate">
                {ALGO_MAP[e.algoId]?.title ?? e.algoId}{e.from ? ` · 来自《${e.from}》` : ''} · {new Date(e.ts).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
          </button>
          <button onClick={() => onRemove(e.ts)} className="text-slate-300 hover:text-rose-500 transition opacity-0 group-hover:opacity-100 shrink-0" title="删除这条记录">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <div className="pt-1 text-center">
        <button onClick={onClear} className="text-[11px] text-slate-300 hover:text-rose-500 transition">清空全部记录</button>
      </div>
    </div>
  )
}
