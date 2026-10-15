// steps.ts —— 步骤事件协议：算法与渲染之间的"通用语言"（本系统核心设计）
// 算法不直接画图，只播报自己每一步做了什么；播放器只负责忠实回放事件流。
// 事件流可暂停、可回退、可逐帧审计 —— 每一步都对应算法的真实一步。

export type Op =
  | 'view'      // 场景元信息：w = ViewKind 序号，note 为标题
  | 'message'   // 纯旁白讲解
  | 'input'     // 待扫描输入串：s 为全文（如括号匹配表达式）
  | 'scan'      // 扫描位置移动到 a
  | 'initArray' // 数组下标 a 的元素值为 w
  | 'setValue'  // 下标 a 的元素变为 w
  | 'compare'   // 比较 a 与 b（b=-1 时与 w 给出的关键字比较）
  | 'swap'      // 交换下标/槽位 a 与 b
  | 'highlight' // 高亮 a（引起注意）
  | 'mark'      // 给 a 打标记 w：1=处理中 2=已完成/归位/找到 3=已摘除
  | 'range'     // 标记当前活跃区间 [a, b]（折半查找/快排分区）
  | 'push'      // 栈：w 入栈
  | 'pop'       // 栈：栈顶出栈，w 为出栈值
  | 'enqueue'   // 队列：w 入队
  | 'dequeue'   // 队列：队头出队，w 为出队值
  | 'newNode'   // 新结点：id=a，值=w，s 为别名（如 "s"）
  | 'link'      // 链表：a.next=b（b=-1 即 NULL）；树：a 挂到父 b 下，w=0 左 / 1 右，b=-1 表示成为根
  | 'ptr'       // 指针变量 s 指向结点/下标 a（a=-1 表示置空 NULL）
  | 'float'     // 结点 a 保持悬停展示（已接入指针但暂不并入水平链）
  | 'unfloat'   // 结点 a 结束悬停，归位到水平链
  | 'free'      // free(a)：释放结点 a 占用的堆内存
  | 'visit'     // 第 w 次经过结点 a（遍历教学：三次经过理论）
  | 'output'    // 输出序列追加 w（遍历/出栈结果）
  | 'incoming'  // 预告：w 即将入栈/入队（w=null 清除预告）
  | 'markAll'   // 给数组全部下标打标记 w（一次性归位，避免逐格刷屏）
  | 'outClear'  // 清空输出/辅助序列（归并的 tmp、遍历输出等）

export interface Step {
  op: Op
  a?: number
  b?: number
  w?: number | string
  s?: string
  note: string      // 中文教学旁白
  code?: number     // 该事件对应的 C 源码行号（0-based，代码对照面板高亮用）
  fast?: boolean    // 搭建阶段事件：自动播放时加快节奏
}

// 构造便捷函数
export function st(op: Op, note: string, extra: Partial<Step> = {}): Step {
  return { op, note, ...extra }
}

export type ViewKind = 'list' | 'array' | 'stack' | 'queue' | 'cqueue' | 'tree' | 'heap' | 'hash'

export const VIEW_ORDER: ViewKind[] = ['list', 'array', 'stack', 'queue', 'cqueue', 'tree', 'heap', 'hash']

// 每种事件的基准节奏（毫秒，1× 速度下）——按事件语义分配时长：连边比旁白久，指针移动最短
// 整体按"讲清楚"的节奏标定：宁可慢半拍，不让学习者跟丢（1× 是"听课节奏"，赶时间请用倍速档）
export const PACE: Record<Op, number> = {
  view: 650, message: 2300, input: 1300, scan: 850,
  initArray: 440, setValue: 1400, compare: 1800, swap: 2100, highlight: 1400, mark: 1200, range: 1300,
  push: 1600, pop: 1600, enqueue: 1600, dequeue: 1600,
  newNode: 1800, link: 2700, ptr: 1200, float: 1600, unfloat: 1900, free: 2300, visit: 1450, output: 1100,
  incoming: 1500, markAll: 1200, outClear: 400,
}
