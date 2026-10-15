// stackQueue.ts —— 栈与队列（教材语义：top 指向栈顶；循环队列牺牲一个单元判满）
// 旁白风格：每一步都讲清"做什么 / 为什么 / 眼睛看哪里"，像老师站在旁边指给你看。

import { st, type Step } from '../steps'

const F = { fast: true } as const

// ================= 顺序栈：基本操作 =================
export const CODE_STACK = [
  '#define MAXSIZE 100',
  'typedef struct {',
  '    ElemType data[MAXSIZE];',
  '    int top;                  // top 指向栈顶元素',
  '} SqStack;',
  '// InitStack:  S.top = -1;',
  '// Push:  S.data[++S.top] = e;   // 先加后压',
  '// Pop:   e = S.data[S.top--];   // 先取后减',
]

export function stackOpsTrace(p: { items: number[] }): Step[] {
  const items = p.items.slice(0, 5)
  const out: Step[] = []
  out.push(st('view', '顺序栈：后进先出（LIFO），只能在栈顶操作', { w: 2 }))
  out.push(st('message', '把栈想成一摞盘子：放盘子、取盘子都只能在最上面进行。空栈时 top = -1，表示"下面什么都没有"', { code: 5 }))
  items.forEach((v, k) => {
    out.push(st('incoming', `看左边：${v} 已经来到栈边，等着进去。Push 只做一件事——把它摞到最顶上`, { w: v, code: 6 }))
    out.push(st('push', `top 先加一（${k - 1} → ${k}）腾出新位置，${v} 再落进去。"先加后压"这个顺序不能反`, { w: v, code: 6 }))
    out.push(st('ptr', `现在 top = ${k}。盯住 top：它永远指着最新进来的那个元素`, { s: 'top', a: k, ...F }))
  })
  const n = items.length
  for (let k = 0; k < Math.min(2, n); k++) {
    const topVal = items[n - 1 - k]
    out.push(st('pop', `Pop：先把栈顶的 ${topVal} 取出来交给 e，top 再减一——"先取后减"。${k === 0 ? `注意：${topVal} 是最后进来的，却第一个出去，这就是后进先出` : `这次轮到 ${topVal} 离开`}`, { w: topVal, code: 7 }))
    out.push(st('ptr', `top 退到 ${n - 2 - k}`, { s: 'top', a: n - 2 - k, ...F }))
  }
  out.push(st('message', `现在栈底到栈顶是：${items.slice(0, n - 2).join('、') || '（空）'}。考你一下：若把剩下的依次 Pop 完，输出序列是什么？`))
  return out
}

// ================= 栈应用：括号匹配 =================
export const CODE_BRACKET = [
  'for (扫描表达式中的每个字符 c) {',
  '    if (c 是左括号)  Push(S, c);',
  '    if (c 是右括号) {',
  '        if (StackEmpty(S)) return FALSE;',
  '        Pop(S, top);              // 取出最近的左括号',
  '        if (top 与 c 不配对) return FALSE;',
  '    }',
  '}',
  'return StackEmpty(S);             // 栈空才完全匹配',
]

export function bracketTrace(p: { expr: string }): Step[] {
  const expr = p.expr || '{[()()]}'
  const out: Step[] = []
  const stack: string[] = []
  out.push(st('view', '括号匹配：用栈记住"最近未配对的左括号"', { w: 2 }))
  out.push(st('input', `待检测表达式：${expr}`, { s: expr }))
  out.push(st('message', '规则一句话：左括号入栈等着；右括号来了，必须跟栈顶那位配对，配不上就是代码写错了', { code: 0 }))
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i]
    if (!'()[]{}'.includes(c)) continue
    if ('([{'.includes(c)) {
      stack.push(c)
      out.push(st('scan', `光标扫到 '${c}'——是左括号`, { a: i }))
      out.push(st('incoming', `'${c}' 来到栈边：它要入栈，等自己的另一半出现`, { w: c, code: 1 }))
      out.push(st('push', `'${c}' 落进栈里成为新栈顶`, { w: c, code: 1 }))
      out.push(st('ptr', `top → 栈顶 '${c}'`, { s: 'top', a: stack.length - 1, ...F }))
    } else {
      const want = c === ')' ? '(' : c === ']' ? '[' : '{'
      out.push(st('scan', `光标扫到 '${c}'——是右括号，它要找"最近的"左括号配对`, { a: i }))
      if (stack.length === 0) {
        out.push(st('message', `可栈里已经空了：这个 '${c}' 等不到它的左括号，匹配失败！`, { code: 3 }))
        return out
      }
      const top = stack[stack.length - 1]
      out.push(st('compare', `为什么看栈顶？因为最近的未配对左括号一定在栈顶。拿 '${c}' 跟 '${top}' 对一下${top === want ? '：正好一对！' : `：'${c}' 想要的是 '${want}'，栈顶却是 '${top}'`}`, { a: stack.length - 1, b: -1, w: c.charCodeAt(0), code: 4 }))
      if (top === want) {
        stack.pop()
        out.push(st('pop', `配对成功，'${top}' 使命完成，出栈`, { w: top, code: 4 }))
        out.push(st('ptr', stack.length ? `top → '${stack[stack.length - 1]}'` : '栈空，top = -1', { s: 'top', a: stack.length - 1, ...F }))
      } else {
        out.push(st('message', `嵌套顺序错了：'${top}' 还没配对，'${c}' 不能插队——匹配失败！`, { code: 5 }))
        return out
      }
    }
  }
  if (stack.length === 0) out.push(st('message', '扫描结束，栈也空了：每个左括号都等到了另一半，完全匹配 ✓ 编译器检查你的代码用的就是这个办法', { code: 8 }))
  else out.push(st('message', `扫描结束，栈里还剩 ${stack.length} 个左括号：有左括号没等到右括号，匹配失败`, { code: 8 }))
  return out
}

// ================= 栈应用：进制转换（除基取余） =================
export const CODE_BASE = [
  'void Conversion(int N, int base) {',
  '    while (N) {',
  '        Push(S, N % base);        // 余数入栈',
  '        N = N / base;             // 商继续除',
  '    }',
  '    while (!StackEmpty(S)) {',
  '        Pop(S, e);                // 后算出的余数先输出',
  '        printf(e);',
  '    }',
  '}',
]

export function baseConvertTrace(p: { num: number; base: number }): Step[] {
  const N = Math.max(0, Math.floor(p.num ?? 1348))
  const base = Math.min(16, Math.max(2, Math.floor(p.base ?? 8)))
  const out: Step[] = []
  out.push(st('view', `进制转换：把 ${N} 转成 ${base} 进制（除基取余 + 栈反序输出）`, { w: 2 }))
  out.push(st('message', `办法：反复「除以 ${base}，余数入栈」。关键点——先算出的余数是结果的低位，后算出的才是高位，正好需要栈来"倒个儿"`, { code: 0 }))
  const digits = '0123456789ABCDEF'
  let m = N
  const stack: number[] = []
  if (m === 0) {
    stack.push(0)
    out.push(st('incoming', 'N = 0：特例，结果就是 0', { w: 0, code: 2 }))
    out.push(st('push', '0 入栈', { w: 0, code: 2 }))
  }
  while (m > 0) {
    const r = m % base
    out.push(st('incoming', `${m} ÷ ${base} = ${Math.floor(m / base)} …… 余 ${r}。盯住余数 ${r}：它要入栈`, { w: r, code: 2 }))
    out.push(st('push', `余数 ${r} 入栈。先算出来的压在下面，说明它是低位`, { w: r, code: 2 }))
    stack.push(r)
    m = Math.floor(m / base)
    out.push(st('ptr', `top → 余数 ${r}`, { s: 'top', a: stack.length - 1, ...F }))
  }
  out.push(st('message', '商变成 0，除法结束。现在依次出栈：后入栈的高位先出来，顺序天然就对了', { code: 5 }))
  let res = ''
  while (stack.length) {
    const d = stack.pop()!
    res += digits[d]
    out.push(st('pop', `出栈 ${d}（${d > 9 ? '写成 ' + digits[d] + '，' : ''}这是当前最高位）`, { w: d, code: 6 }))
    out.push(st('output', `输出 ${digits[d]}`, { w: d as number, code: 7 }))
    out.push(st('ptr', stack.length ? 'top 下移一格' : '栈空', { s: 'top', a: stack.length - 1, ...F }))
  }
  out.push(st('message', `结果：${N}（十进制）= ${res}（${base} 进制）。栈"后进先出"的天性，恰好解决了余数要逆序输出的问题`, { code: 9 }))
  return out
}

// ================= 顺序队列：基本操作 =================
export const CODE_QUEUE = [
  'typedef struct {',
  '    ElemType data[MAXSIZE];',
  '    int front, rear;          // front 指队头，rear 指队尾的下一个位置',
  '} SqQueue;',
  '// EnQueue:  Q.data[Q.rear++] = e;',
  '// DeQueue:  e = Q.data[Q.front++];',
]

export function queueOpsTrace(p: { items: number[] }): Step[] {
  const items = p.items.slice(0, 5)
  const out: Step[] = []
  out.push(st('view', '顺序队列：先进先出（FIFO）——队尾进，队头出', { w: 3 }))
  out.push(st('message', '队列就是排队买票：新来的人站到队尾，服务窗口从队头叫人。空队列时 front = rear = 0'))
  items.forEach((v) => {
    out.push(st('incoming', `看队尾那个虚线框：${v} 来排队了，它只能站在队伍最后`, { w: v, code: 4 }))
    out.push(st('enqueue', `${v} 从队尾入队，排到队伍最后面`, { w: v, code: 4 }))
  })
  out.push(st('ptr', 'front → 队头：下一个要被服务的元素', { s: 'front', a: 0, ...F }))
  out.push(st('ptr', `rear → 队尾之后的位置：新元素来了就写在这里`, { s: 'rear', a: items.length - 1, ...F }))
  for (let k = 0; k < 2 && items.length; k++) {
    const v = items[k]
    out.push(st('dequeue', `DeQueue：队头的 ${v} 接受完服务离开，front 后移一格。${k === 0 ? '最先进队的最先被服务——这就是 FIFO' : ''}`, { w: v, code: 5 }))
    out.push(st('ptr', `front 现在指向 ${items[k + 1] ?? '（空）'}`, { s: 'front', a: 0, ...F }))
  }
  out.push(st('message', '想一想：不断出队后，front 前面空出来的格子还能用吗？——用不了，这就是顺序队列的"假溢出"，下一节的循环队列专门治它'))
  return out
}

// ================= 循环队列 =================
export const CODE_CQUEUE = [
  '#define MAXSIZE 6               // 牺牲一个单元区分队满/队空',
  '// EnQueue:',
  'if ((Q.rear + 1) % MAXSIZE == Q.front) return ERROR;  // 队满',
  'Q.data[Q.rear] = e;',
  'Q.rear = (Q.rear + 1) % MAXSIZE;',
  '// DeQueue:',
  'if (Q.front == Q.rear) return ERROR;                  // 队空',
  'e = Q.data[Q.front];',
  'Q.front = (Q.front + 1) % MAXSIZE;',
]

export function cqueueTrace(): Step[] {
  const CAP = 6
  const out: Step[] = []
  let front = 0, rear = 0
  const slots: (number | null)[] = Array(CAP).fill(null)
  out.push(st('view', `循环队列：把数组首尾相接成环，front/rear 按模 ${CAP} 环绕`, { w: 4, a: CAP }))
  for (let i = 0; i < CAP; i++) out.push(st('initArray', `槽位 ${i}`, { a: i, w: -1, ...F }))
  out.push(st('message', `容量 ${CAP}，但故意牺牲一个单元不用：最多同时存 ${CAP - 1} 个。为什么？看完队满那一步你就明白了。现在 front=${front}、rear=${rear}，rear 指向下一个可写槽位`))
  out.push(st('ptr', 'front → 0', { s: 'front', a: 0, ...F }))
  out.push(st('ptr', 'rear → 0', { s: 'rear', a: 0, ...F }))
  const enq = (v: number) => {
    if ((rear + 1) % CAP === front) {
      out.push(st('message', `EnQueue(${v})：先判满——(rear+1)%${CAP} 等于 front 了！若再进，front==rear 就没法跟"队空"区分，所以拒绝入队。牺牲的那一个单元，换来的就是这条 O(1) 的判满规则`, { code: 2 }))
      return
    }
    out.push(st('incoming', `EnQueue(${v})：先判满，(rear+1)%${CAP}=${(rear + 1) % CAP} ≠ front=${front}，放行`, { w: v, code: 2 }))
    slots[rear] = v
    out.push(st('setValue', `${v} 写入 rear 指的槽位 data[${rear}]`, { a: rear, w: v, code: 3 }))
    rear = (rear + 1) % CAP
    out.push(st('ptr', `rear 顺时针走一格：rear = ${rear}`, { s: 'rear', a: rear, code: 4 }))
  }
  const deq = () => {
    if (front === rear) {
      out.push(st('message', 'DeQueue：front == rear → 队空，无元素可出', { code: 6 }))
      return
    }
    const v = slots[front]
    slots[front] = null
    out.push(st('setValue', `DeQueue：队头的 ${v} 离开，data[${front}] 清空`, { a: front, w: -1, code: 7 }))
    front = (front + 1) % CAP
    out.push(st('ptr', `front 顺时针追一格：front = ${front}`, { s: 'front', a: front, code: 8 }))
  }
  ;[11, 22, 33, 44].forEach(enq)
  out.push(st('message', '连续出队 2 个：盯住 front——它会朝着 rear 的方向追'))
  deq(); deq()
  out.push(st('message', '继续入队：rear 绕回数组开头接着写——"循环"的意义就在这，假溢出消失了'))
  ;[55, 66, 77].forEach(enq)
  out.push(st('mark', `数一数：front=${front}、rear=${rear}，元素个数 = (rear - front + ${CAP}) % ${CAP} = ${(rear - front + CAP) % CAP}。这个取模公式建议记住`, { a: front, w: 1 }))
  enq(88)  // 触发队满
  out.push(st('message', '循环队列三句话：取模让指针绕环走；牺牲一个单元换 O(1) 判满；front 追 rear，永不假溢出'))
  return out
}
