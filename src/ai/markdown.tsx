// markdown.tsx —— 极简 Markdown 渲染：把助教回复里的 **加粗**、标题、列表、表格、代码渲染成真正的排版
// 原则：无依赖、无 dangerouslySetInnerHTML（纯 React 节点，天然防注入）；任何畸形输入都降级为普通文本，绝不渲染失败

import React from 'react'

/** 行内：**加粗**、`代码` */
function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)/g
  let last = 0, k = 0
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0
    if (i > last) out.push(text.slice(last, i))
    if (m[2] !== undefined) out.push(<strong key={`${keyBase}-b${k++}`} className="font-semibold text-slate-800">{m[2]}</strong>)
    else out.push(<code key={`${keyBase}-c${k++}`} className="font-mono text-[11.5px] bg-slate-200/70 text-slate-700 px-1 py-0.5 rounded">{m[4]}</code>)
    last = i + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** 表格尝试：连续含 | 的行 + 分隔行 |---|---| */
function tryTable(lines: string[], start: number, keyBase: string): { node: React.ReactNode; next: number } | null {
  const rows: string[][] = []
  let i = start
  while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i]!)) {
    const cells = lines[i]!.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
    rows.push(cells)
    i++
  }
  if (rows.length < 2) return null
  const sepIdx = rows.findIndex((r) => r.every((c) => /^:?-{2,}:?$/.test(c)))
  if (sepIdx !== 1 || rows[0]!.length < 2) return null // 第二行必须是分隔行，才算表格
  const head = rows[0]!
  const body = rows.slice(2)
  return {
    next: i,
    node: (
      <div key={keyBase} className="overflow-x-auto my-1.5">
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr>{head.map((c, j) => <th key={j} className="border border-slate-300/70 bg-slate-200/50 px-2 py-1 text-left font-semibold text-slate-700">{inline(c, `${keyBase}-h${j}`)}</th>)}</tr>
          </thead>
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri}>{head.map((_, j) => <td key={j} className="border border-slate-300/70 px-2 py-1 text-slate-600">{inline(r[j] ?? '', `${keyBase}-r${ri}c${j}`)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  }
}

export default function Md({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n')
  const blocks: React.ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  const flushList = (k: string) => {
    if (!list) return
    const items = list.items.map((it, j) => <li key={j}>{inline(it, `${k}-li${j}`)}</li>)
    blocks.push(list.ordered
      ? <ol key={k} className="list-decimal pl-5 my-1 space-y-0.5">{items}</ol>
      : <ul key={k} className="list-disc pl-5 my-1 space-y-0.5">{items}</ul>)
    list = null
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]!
    const key = `b${i}`
    // 代码围栏
    if (/^```/.test(line.trim())) {
      flushList(key)
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i]!.trim())) { buf.push(lines[i]!); i++ }
      i++ // 跳过收尾 ```
      blocks.push(<pre key={key} className="my-1.5 rounded-lg bg-slate-800 text-slate-100 text-[11.5px] font-mono px-3 py-2 overflow-x-auto whitespace-pre">{buf.join('\n')}</pre>)
      continue
    }
    // 表格
    if (/^\s*\|/.test(line)) {
      flushList(key)
      const t = tryTable(lines, i, key)
      if (t) { blocks.push(t.node); i = t.next; continue }
      // 不是表格就按普通段落走
    }
    // 标题
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      flushList(key)
      const lvl = h[1]!.length
      const cls = lvl <= 2 ? 'text-[13.5px] font-bold text-slate-800 mt-2.5 mb-1' : 'text-[12.5px] font-bold text-slate-800 mt-2 mb-0.5'
      blocks.push(<div key={key} className={cls}>{inline(h[2]!, key)}</div>)
      i++
      continue
    }
    // 列表
    const ul = line.match(/^\s*[-*•]\s+(.*)$/)
    const ol = line.match(/^\s*\d+[.、]\s+(.*)$/)
    if (ul || ol) {
      const ordered = !!ol
      const item = (ul?.[1] ?? ol?.[1])!
      if (!list || list.ordered !== ordered) { flushList(key); list = { ordered, items: [] } }
      list.items.push(item)
      i++
      continue
    }
    flushList(key)
    // 空行 → 间距；普通行 → 段落
    if (line.trim()) blocks.push(<p key={key} className="my-0.5">{inline(line, key)}</p>)
    else blocks.push(<div key={key} className="h-1.5" />)
    i++
  }
  flushList('tail')
  return <>{blocks}</>
}
