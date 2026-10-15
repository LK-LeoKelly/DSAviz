// AboutPage.tsx —— 关于作品：设计思想与技术架构

import { GitBranch, Layers, PlayCircle, MessageSquare, Cpu } from 'lucide-react'

const ARCH = [
  {
    icon: Cpu, title: '算法层（事件生产者）',
    body: '每个算法以教材 C 代码为蓝本实现一遍，但不直接画图——只在关键步骤播报事件：比较、交换、连边、指针移动、free……事件携带对应源码行号与中文旁白。',
  },
  {
    icon: GitBranch, title: '事件流（通用语言）',
    body: 'Step 协议把 23 个算法统一成同一套"教学事件语言"：newNode / link / ptr / compare / swap / mark / range……算法与渲染彻底解耦，新增一个算法无需改动渲染层。',
  },
  {
    icon: Layers, title: '场景层（状态快照）',
    body: '任意时刻的画面 = 前 k 个事件折叠出的状态快照。前进、后退、拖进度条都只是换快照——指针位置永远与算法真实状态一致，从机制上杜绝渲染残影。',
  },
  {
    icon: PlayCircle, title: '渲染层（忠实回放）',
    body: '各视图渲染器只读状态快照：链表的布局由 next 指针图顺链推导，树的位置由真实 left/right 链接算出。看见的就是指针结构本身。',
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[900px] px-5 py-12 page-in">
      <h1 className="text-[26px] font-bold tracking-tight text-slate-900">关于 DSAViz</h1>
      <p className="mt-3 text-[14px] leading-[1.9] text-slate-500 max-w-[680px]">
        DSAViz（看得见的算法）是一个面向计算机专业学生的数据结构与算法可视化学习平台。
        它不满足于"看动画"，而是把每一次指针转向、每一次比较交换都做成可以逐帧审计的教学事件——
        让"像老师板书一样讲清楚链表"这件事在网页上发生。
      </p>

      <h2 className="mt-12 text-[18px] font-bold text-slate-900">技术架构：事件流驱动的四层解耦</h2>
      <div className="mt-5 grid sm:grid-cols-2 gap-4">
        {ARCH.map((a) => (
          <div key={a.title} className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <a.icon size={18} className="text-indigo-500" />
            <h3 className="mt-3 text-[14px] font-bold text-slate-900">{a.title}</h3>
            <p className="mt-1.5 text-[12.5px] leading-[1.8] text-slate-500">{a.body}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-[18px] font-bold text-slate-900">设计取舍</h2>
      <div className="mt-4 space-y-3 text-[13.5px] leading-[1.9] text-slate-600">
        <p>
          <b className="text-slate-800">专业性优先：</b>术语、代码、指针操作顺序全部对齐课程教材——
          插入严格 <code className="font-mono text-[12px] bg-slate-100 px-1.5 py-0.5 rounded">s-&gt;next = p-&gt;next; p-&gt;next = s</code>，
          删除严格 <code className="font-mono text-[12px] bg-slate-100 px-1.5 py-0.5 rounded">q = p-&gt;next; p-&gt;next = q-&gt;next; free(q)</code>；
          链表带头结点，结点带模拟内存地址，NULL 用教材符号 ∧ 表示。
        </p>
        <p>
          <b className="text-slate-800">教学性优先：</b>每课按"概念 → 演示 → 要点 → 小测"组织；播放器支持逐帧进退与变速，
          节奏按事件语义分配（连边比旁白停留更久）；小测答错必须给出解析，通过才计入进度。
        </p>
        <p>
          <b className="text-slate-800">工程性优先：</b>React 19 + TypeScript + Vite 构建；状态快照机制造就零残影的回放；
          AI 助教经本地代理调用，密钥不进入前端产物；纯静态构建产物可部署到任意静态托管。
        </p>
      </div>

      <h2 className="mt-12 text-[18px] font-bold text-slate-900 flex items-center gap-2">
        <MessageSquare size={18} className="text-indigo-500" /> 反馈与迭代
      </h2>
      <p className="mt-3 text-[13.5px] leading-[1.9] text-slate-600">
        路线图：自由白板（任意结构摆拖连改）→ 学习画像与针对性推荐 → 网页版部署与账号体系。
      </p>
    </div>
  )
}
