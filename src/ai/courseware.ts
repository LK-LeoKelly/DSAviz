// courseware.ts —— 课件解析：把老师发的 pptx / docx / pdf / txt / md 读成纯文本
// 全部在浏览器本地完成，文件不上传到任何服务器（隐私安全，演示时也更快）
// 健壮性原则：单个文件失败不影响其他文件；读不到内容时给出明确、可操作的原因

import JSZip from 'jszip'

export interface Courseware {
  name: string
  kind: 'pptx' | 'docx' | 'pdf' | 'text'
  chars: number      // 提取到的字符数
  text: string       // 已按上限截断的正文
  truncated: boolean // 是否因超长被截断
  pageCount: number  // 页/幻灯片数（txt 为 1）
}

const MAX_FILE_MB = 20
const MAX_CHARS = 9000 // 喂给模型的上限：再多会挤占对话上下文，且课件重点通常在前半

const EXT_OK: Record<string, Courseware['kind']> = {
  pptx: 'pptx', docx: 'docx', pdf: 'pdf', txt: 'text', md: 'text',
}

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&')
}

function finish(name: string, kind: Courseware['kind'], pageCount: number, raw: string): Courseware {
  // 压缩空白、去过碎的短行噪声，保留段落结构
  const text = raw.replace(/\r/g, '').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (text.length < 8) {
    throw new Error(kind === 'pptx'
      ? '这份 PPT 里几乎读不到文字——可能是纯图片型课件（扫描件或截图拼的），这类文件需要人工摘录要点后再提问'
      : '文件里几乎没有可读取的文字内容')
  }
  return {
    name, kind, pageCount,
    chars: Math.min(text.length, MAX_CHARS),
    truncated: text.length > MAX_CHARS,
    text: text.slice(0, MAX_CHARS),
  }
}

/** pptx/docx 都是 zip 包；zip 打不开的统一转成友好提示 */
async function loadZip(buf: ArrayBuffer, ext: string): Promise<JSZip> {
  try {
    return await JSZip.loadAsync(buf)
  } catch {
    throw new Error(`文件打不开——可能已损坏，或只是改了扩展名的假 .${ext}（请用 PowerPoint/WPS 重新另存）`)
  }
}

/** pptx 本质是 zip：ppt/slides/slideN.xml 里的 <a:t> 是文字 */
async function parsePptx(name: string, buf: ArrayBuffer): Promise<Courseware> {
  const zip = await loadZip(buf, 'pptx')
  const slideNames = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
  if (!slideNames.length) throw new Error('不是标准的 .pptx 结构（如果是 .ppt 老格式，请先在 PowerPoint/WPS 里另存为 .pptx）')
  const parts: string[] = []
  for (const p of slideNames) {
    const xml = await zip.file(p)!.async('string')
    const runs = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => unescapeXml(m[1]!))
    const page = runs.join(' ').replace(/\s{2,}/g, ' ').trim()
    if (page) parts.push(`【第${parts.length + 1}页】${page}`)
  }
  return finish(name, 'pptx', slideNames.length, parts.join('\n'))
}

/** docx 同理：word/document.xml 里的 <w:t> 是文字，</w:p> 分段 */
async function parseDocx(name: string, buf: ArrayBuffer): Promise<Courseware> {
  const zip = await loadZip(buf, 'docx')
  const doc = zip.file('word/document.xml')
  if (!doc) throw new Error('不是标准的 .docx 结构（如果是 .doc 老格式，请先另存为 .docx）')
  const xml = await doc.async('string')
  const paras = xml.split(/<\/w:p>/).map((seg) =>
    [...seg.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => unescapeXml(m[1]!)).join('').trim(),
  ).filter(Boolean)
  return finish(name, 'docx', paras.length, paras.join('\n'))
}

/** pdf 用 pdfjs，按需懒加载（不拖慢主包） */
async function parsePdf(name: string, buf: ArrayBuffer): Promise<Courseware> {
  const pdfjs = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  let doc
  try {
    doc = await pdfjs.getDocument({ data: buf }).promise
  } catch (e: any) {
    if (String(e?.name).includes('Password')) throw new Error('这份 PDF 有密码保护，请先解除加密再上传')
    throw new Error('PDF 解析失败（文件可能损坏或格式特殊）')
  }
  const parts: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const tc = await page.getTextContent()
    const line = tc.items.map((it: any) => ('str' in it ? it.str : '')).join(' ').replace(/\s{2,}/g, ' ').trim()
    if (line) parts.push(`【第${i}页】${line}`)
    if (parts.join('\n').length > MAX_CHARS * 1.5) break // 页数很多的课件，读到上限附近就停
  }
  return finish(name, 'pdf', doc.numPages, parts.join('\n'))
}

export async function parseCourseware(file: File): Promise<Courseware> {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  const kind = EXT_OK[ext]
  if (!kind) throw new Error(`暂不支持的格式 .${ext}——请使用 pptx / docx / pdf / txt / md`)
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`文件超过 ${MAX_FILE_MB}MB，课件太大建议拆分后分次上传`)
  const buf = await file.arrayBuffer()
  if (kind === 'pptx') return parsePptx(file.name, buf)
  if (kind === 'docx') return parseDocx(file.name, buf)
  if (kind === 'pdf') return parsePdf(file.name, buf)
  return finish(file.name, 'text', 1, new TextDecoder('utf-8').decode(buf))
}
