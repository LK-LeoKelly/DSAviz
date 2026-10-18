// TourDriver.tsx —— 录制用自动导览：访问 /tour 激活，虚拟光标自动走完全部演示场景
// 普通用户不会进入 /tour；导览叠加层 pointer-events:none，不影响页面交互
// 按键：空格=跳过当前等待/继续，S=跳过当前场景，H=隐藏字幕条，Esc=中止导览

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { LESSON_MAP } from '../content/chapters'

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function elCenter(el: Element) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/** React 受控输入框赋值：走原生 setter + input 事件 */
function reactFill(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
  setter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

/** 按文本找可见元素（优先 button/a，其次任意元素） */
function findByText(text: string, exact = false): HTMLElement | null {
  const all = [...document.querySelectorAll<HTMLElement>('button, a, [role="button"], h1, h2, h3, span, div')]
  const vis = all.filter((e) => e.offsetParent !== null && (e.children.length === 0 || /BUTTON|A/.test(e.tagName)))
  const hit = vis.find((e) => (exact ? e.textContent?.trim() === text : e.textContent?.includes(text)))
  return hit ?? null
}

async function waitFor(pred: () => boolean, timeout = 12000, step = 200) {
  const t0 = performance.now()
  while (performance.now() - t0 < timeout) {
    if (pred()) return true
    await wait(step)
  }
  return false
}

type Scene = { name: string; run: (ctx: Ctx) => Promise<void> }

interface Ctx {
  nav: (to: string) => void
  caption: (t: string) => void
  moveCursor: (x: number, y: number, fast?: boolean) => Promise<void>
  click: (el: HTMLElement) => Promise<void>
  fill: (el: HTMLInputElement, v: string) => Promise<void>
  aborted: () => boolean
  skipWait: () => boolean
  sleep: (ms: number) => Promise<void>
}

export default function TourDriver() {
  const loc = useLocation()
  const nav = useNavigate()
  const [cursor, setCursor] = useState({ x: -100, y: -100, show: false, ripple: 0 })
  const [caption, setCaption] = useState('')
  const [hideCap, setHideCap] = useState(false)
  const [sceneName, setSceneName] = useState('')
  const ctl = useRef({ abort: false, skipWaitFlag: false, skipScene: false })

  // touring 一旦激活就锁定：导览中路由会离开 /tour，叠加层必须全程可见
  const [touring, setTouring] = useState(false)
  const started = useRef(false)
  useEffect(() => {
    if (loc.pathname === '/tour') setTouring(true)
  }, [loc.pathname])

  useEffect(() => {
    if (!touring || started.current) return
    started.current = true
    ctl.current = { abort: false, skipWaitFlag: false, skipScene: false }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); ctl.current.skipWaitFlag = true }
      else if (e.key.toLowerCase() === 's') ctl.current.skipScene = true
      else if (e.key.toLowerCase() === 'h') setHideCap((v) => !v)
      else if (e.key === 'Escape') { ctl.current.abort = true; setTouring(false); started.current = false }
    }
    window.addEventListener('keydown', onKey)

    const ctx: Ctx = {
      nav: (to) => nav(to),
      caption: (t) => setCaption(t),
      aborted: () => ctl.current.abort,
      skipWait: () => {
        if (ctl.current.skipWaitFlag) { ctl.current.skipWaitFlag = false; return true }
        return false
      },
      sleep: async (ms) => {
        const t0 = performance.now()
        while (performance.now() - t0 < ms) {
          if (ctl.current.abort || ctl.current.skipScene || ctl.current.skipWaitFlag) { ctl.current.skipWaitFlag = false; return }
          await wait(80)
        }
      },
      moveCursor: async (x, y, fast) => {
        setCursor((c) => ({ ...c, x, y, show: true }))
        await wait(fast ? 220 : 520)
      },
      click: async (el) => {
        el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
        await wait(280)
        const { x, y } = elCenter(el)
        await ctx.moveCursor(x, y)
        setCursor((c) => ({ ...c, ripple: c.ripple + 1 }))
        await wait(220)
        el.click()
        await wait(350)
      },
      fill: async (el, v) => {
        el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior })
        await wait(250)
        const { x, y } = elCenter(el)
        await ctx.moveCursor(x, y)
        el.focus()
        // 逐字输入，更像真人
        for (let i = 1; i <= v.length; i++) {
          reactFill(el, v.slice(0, i))
          await wait(55)
        }
        await wait(300)
      },
    }

    const clickText = async (text: string, exact = false) => {
      const el = findByText(text, exact)
      if (!el) return false
      await ctx.click(el)
      return true
    }

    const scenes: Scene[] = [
      {
        name: 'M4 首页定位',
        run: async (c) => {
          c.caption('首页：一句话定位 + 三个关键词')
          await waitFor(() => !!findByText('把每一个指针'))
          await c.sleep(2600)
          for (const t of ['学习路径', '实验室', '对比赛跑', '演算沙盒']) {
            const el = findByText(t, true)
            if (el) { const { x, y } = elCenter(el); await c.moveCursor(x, y) }
            await c.sleep(650)
            if (c.aborted()) return
          }
          await c.sleep(1200)
        },
      },
      {
        name: 'M5 一节课完整流程（单链表按位插入）',
        run: async (c) => {
          c.caption('学习路径 → 按位插入：讲解 → 演示 → 小测')
          c.nav('/learn')
          await waitFor(() => !!findByText('按位插入'))
          await c.sleep(900)
          await clickText('按位插入')
          await waitFor(() => !!document.querySelector('button[title="播放 / 暂停（空格）"]'))
          await c.sleep(2200) // 左侧概念区展示
          // 播放演示
          const play = document.querySelector<HTMLElement>('button[title="播放 / 暂停（空格）"]')
          if (play) await c.click(play)
          await c.sleep(14000) // 让动画完整跑一段
          if (c.aborted()) return
          // 暂停，做小测：先故意答错（展示解析），再答对
          const pause = document.querySelector<HTMLElement>('button[title="播放 / 暂停（空格）"]')
          if (pause) await c.click(pause)
          const quizBox = findByText('随堂小测')
          if (quizBox) quizBox.scrollIntoView({ block: 'center' })
          await c.sleep(1200)
          const lesson = LESSON_MAP['l-list-insert']
          const q = lesson?.quiz?.[0]
          if (q) {
            const optionBtns = [...document.querySelectorAll<HTMLElement>('button')].filter(
              (b) => b.offsetParent && q.options.some((op) => b.textContent?.trim() === op),
            )
            const wrongIdx = (q.answer + 1) % q.options.length
            if (optionBtns[wrongIdx]) await c.click(optionBtns[wrongIdx])
            await c.sleep(2600) // “再想想：”解析展示
            if (optionBtns[q.answer]) await c.click(optionBtns[q.answer])
            await c.sleep(1800) // “答对了：”展示
          }
        },
      },
      {
        name: 'M6 实验室：自定义数据 + 挑战模式 + 复杂度推导 + 代码行联动',
        run: async (c) => {
          c.caption('实验室（快速排序）：换数据 → 挑战模式 → 复杂度推导 → 代码行联动')
          c.nav('/lab/sort-quick')
          await waitFor(() => !!findByText('重新演算'))
          await c.sleep(900)
          const input = document.querySelector<HTMLInputElement>('main input')
          if (input) await c.fill(input, '12, 5, 23, 8, 17, 3, 29')
          await clickText('重新演算')
          await clickText('挑战模式')
          const play = document.querySelector<HTMLElement>('button[title="播放 / 暂停（空格）"]')
          if (play) await c.click(play)
          // 等挑战题卡自动弹出（播放到 compare 决策点会自动暂停）
          await waitFor(() => !!findByText('猜一猜'), 20000)
          await c.sleep(1200)
          // 选一个选项（第一个）
          const card = findByText('猜一猜')
          const choiceBtns = card
            ? [...(card.closest('div')!.parentElement!.querySelectorAll<HTMLElement>('button'))].filter(
                (b) => b.offsetParent && !/继续播放/.test(b.textContent ?? ''),
              )
            : []
          if (choiceBtns[0]) await c.click(choiceBtns[0])
          await c.sleep(2400) // 揭晓 + why 解析
          await clickText('继续播放')
          await c.sleep(3000)
          const pause2 = document.querySelector<HTMLElement>('button[title="播放 / 暂停（空格）"]')
          if (pause2) await c.click(pause2)
          // 关闭挑战模式，展示复杂度推导
          await clickText('挑战模式')
          await clickText('推导复杂度')
          await c.sleep(3600)
          await clickText('推导复杂度') // 再点一次收起
          // 代码行联动：点一行 while，动画跳到对应步骤
          const line = [...document.querySelectorAll<HTMLElement>('div, span, code')].find(
            (e) => e.offsetParent && e.children.length === 0 && /while/.test(e.textContent ?? ''),
          )
          if (line) await c.click(line)
          await c.sleep(1800)
        },
      },
      {
        name: 'M7 对比赛跑 + 演算沙盒',
        run: async (c) => {
          c.caption('对比赛跑：同一组数据，冒泡 vs 快排')
          c.nav('/compare/sort-bubble/sort-quick')
          await waitFor(() => !!document.querySelector('button[title="播放 / 暂停（空格）"]'))
          await c.sleep(900)
          const play = document.querySelector<HTMLElement>('button[title="播放 / 暂停（空格）"]')
          if (play) await c.click(play)
          await c.sleep(8000)
          if (c.aborted()) return
          c.caption('演算沙盒：结构你做主')
          c.nav('/playground')
          await waitFor(() => !!findByText('BST 沙盘') || !!findByText('插入值'))
          await c.sleep(800)
          await clickText('BST 沙盘')
          await c.sleep(600)
          // 依次插入若干值
          const insertInput = () => {
            const label = [...document.querySelectorAll<HTMLElement>('span')].find((s) => s.offsetParent && s.textContent?.trim() === '插入值')
            return label?.parentElement?.querySelector<HTMLInputElement>('input') ?? null
          }
          for (const v of ['8', '3', '10', '6']) {
            const inp = insertInput()
            if (!inp) break
            await c.fill(inp, v)
            const btns = [...document.querySelectorAll<HTMLElement>('button')].filter((b) => b.offsetParent && b.textContent?.trim() === '插入')
            if (btns[0]) await c.click(btns[0])
            await c.sleep(1400)
            if (c.aborted()) return
          }
          // 查找一个值
          const flabel = [...document.querySelectorAll<HTMLElement>('span')].find((s) => s.offsetParent && s.textContent?.trim() === '查找目标')
          const finp = flabel?.parentElement?.querySelector<HTMLInputElement>('input')
          if (finp) {
            await c.fill(finp, '6')
            const fbtns = [...document.querySelectorAll<HTMLElement>('button')].filter((b) => b.offsetParent && b.textContent?.trim() === '查找')
            if (fbtns[0]) await c.click(fbtns[0])
            await c.sleep(2200)
          }
        },
      },
      {
        name: 'M8 AI 助教（手动录制段）',
        run: async (c) => {
          c.caption('M8：请手动操作 AI 助教（拖入你的课件）—— 按空格继续')
          // 打开助教面板
          const tutorBtn = [...document.querySelectorAll<HTMLElement>('button')].find((b) => b.offsetParent && /AI 助教/.test(b.textContent ?? ''))
          if (tutorBtn) await c.click(tutorBtn)
          // 等待用户手动操作，按空格继续
          await new Promise<void>((resolve) => {
            const t = setInterval(() => {
              if (ctl.current.skipWaitFlag || ctl.current.abort) { ctl.current.skipWaitFlag = false; clearInterval(t); resolve() }
            }, 150)
          })
        },
      },
      {
        name: 'M10 收尾：回到首页',
        run: async (c) => {
          c.caption('收尾：已上线的真实平台')
          c.nav('/')
          await c.sleep(1600)
          window.scrollTo({ top: 420, behavior: 'smooth' })
          await c.sleep(1800)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          await c.sleep(1600)
          c.caption('导览结束 · 按 Esc 退出')
        },
      },
    ]

    ;(async () => {
      await wait(600)
      setCursor((c) => ({ ...c, show: true, x: innerWidth / 2, y: innerHeight / 2 }))
      for (const s of scenes) {
        if (ctl.current.abort) break
        ctl.current.skipScene = false
        setSceneName(s.name)
        try { await s.run(ctx) } catch { /* 单场景失败不中断全程 */ }
      }
      setSceneName('完成')
      setCaption('导览结束 · 按 Esc 退出')
    })()

    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touring])

  if (!touring) return null

  return (
    <>
      {/* 虚拟光标 */}
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{
          left: 0, top: 0,
          transform: `translate(${cursor.x - 12}px, ${cursor.y - 12}px)`,
          transition: 'transform .45s cubic-bezier(.22,.9,.28,1)',
          opacity: cursor.show ? 1 : 0,
        }}
      >
        <div className="w-6 h-6 rounded-full bg-indigo-500/90 ring-4 ring-indigo-300/50 shadow-lg shadow-indigo-500/40" />
        {cursor.ripple > 0 && (
          <div key={cursor.ripple} className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping" />
        )}
      </div>
      {/* 字幕条（对齐旁白用，可按 H 隐藏） */}
      {!hideCap && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[9998] pointer-events-none max-w-[80%]">
          <div className="px-5 py-2.5 rounded-xl bg-slate-900/85 text-white text-[14px] tracking-wide shadow-xl backdrop-blur">
            <span className="text-indigo-300 font-mono text-[12px] mr-3">{sceneName}</span>
            {caption}
          </div>
        </div>
      )}
    </>
  )
}
