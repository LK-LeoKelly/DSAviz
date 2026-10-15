// linkedList.ts —— 带头结点的单链表（严蔚敏教材语义）
// 指针事件（ptr）是一等公民：p / q / s / L / r 的每一次指向变化都有独立事件，
// 渲染层据实画箭头，绝不"脑补"。结点 id 约定：0 = 头结点 L，1..n = 数据结点。

import { st, type Step } from '../steps'

export interface ListParams { list: number[]; pos?: number; val?: number }

const CODE_INSERT = [
  'Status ListInsert(LinkList L, int i, ElemType e) {',
  '    p = L;  j = 0;                    // p 指向头结点',
  '    while (p && j < i - 1) {',
  '        p = p->next;  ++j;            // 后移，寻找第 i-1 个结点',
  '    }',
  '    if (!p || j > i - 1) return ERROR;',
  '    s = (LinkList)malloc(sizeof(LNode));',
  '    s->data = e;',
  '    s->next = p->next;                // ① 新结点接住 p 的后继',
  '    p->next = s;                      // ② p 改指向新结点',
  '    return OK;',
  '}',
]

const CODE_DELETE = [
  'Status ListDelete(LinkList L, ElemType e) {',
  '    p = L;                            // p 指向头结点',
  '    while (p->next && p->next->data != e)',
  '        p = p->next;                  // 后移，q 始终是 p 的后继',
  '    q = p->next;                      // q 指向待删结点',
  '    if (!q) return ERROR;             // 表中不存在 e',
  '    p->next = q->next;                // p 跳过 q，断开连接',
  '    free(q);                          // 释放 q 占用的堆内存',
  '    return OK;',
  '}',
]

const CODE_GET = [
  'Status GetElem(LinkList L, int i, ElemType *e) {',
  '    p = L->next;  j = 1;              // p 指向首元结点',
  '    while (p && j < i) {',
  '        p = p->next;  ++j;            // 顺链扫描',
  '    }',
  '    if (!p || j > i) return ERROR;',
  '    *e = p->data;                     // 取到第 i 个元素',
  '    return OK;',
  '}',
]

const CODE_BUILD_HEAD = [
  'void CreateListF(LinkList L, int n) {',
  '    L->next = NULL;                   // 先建空表',
  '    for (i = 0; i < n; ++i) {',
  '        s = (LinkList)malloc(sizeof(LNode));',
  '        scanf("%d", &s->data);        // 读入新元素',
  '        s->next = L->next;            // ① 接住原首元结点',
  '        L->next = s;                  // ② 头结点改指 s',
  '    }',
  '}',
]

const CODE_BUILD_TAIL = [
  'void CreateListR(LinkList L, int n) {',
  '    L->next = NULL;                   // 先建空表',
  '    r = L;                            // 尾指针 r 指向头结点',
  '    for (i = 0; i < n; ++i) {',
  '        s = (LinkList)malloc(sizeof(LNode));',
  '        scanf("%d", &s->data);',
  '        r->next = s;                  // ① 接到表尾',
  '        r = s;                        // ② r 后移到新表尾',
  '    }',
  '}',
]

const F = { fast: true } as const  // 搭建阶段事件：节奏加快

// 搭建初始链表（头结点 id=0，数据结点 id=1..n）
function stage(list: number[], out: Step[]) {
  out.push(st('newNode', '头结点 L：数据域不使用，只为统一操作', { a: 0, w: 0, s: 'L', ...F }))
  out.push(st('ptr', '头指针 L 指向头结点', { s: 'L', a: 0, ...F }))
  list.forEach((v, i) => {
    out.push(st('newNode', `数据结点：${v}`, { a: i + 1, w: v, ...F }))
    out.push(st('link', i === 0 ? 'L->next 指向首元结点' : `next 指向下一个数据结点`,
      { a: i, b: i + 1, ...F }))
  })
  out.push(st('link', '表尾结点的 next = NULL', { a: list.length, b: -1, ...F }))
}

export function listInsertTrace(p: ListParams): Step[] {
  const { list } = p
  const i = p.pos ?? 2
  const e = p.val ?? 99
  const n = list.length
  const out: Step[] = []
  out.push(st('view', '单链表插入：在带头结点的链表 L 中，第 i 个位置之前插入 e', { w: 0 }))
  stage(list, out)
  if (i < 1 || i > n + 1) {
    out.push(st('message', `插入位序 i=${i} 不合法：带头结点链表合法范围是 1 ≤ i ≤ ${n + 1}（n=${n}），返回 ERROR`, { code: 5 }))
    return out
  }
  out.push(st('message', `任务：在位序 i=${i} 之前插入元素 ${e}（现有 ${n} 个数据结点）。先找第 i-1 个结点 p`, { code: 0 }))
  out.push(st('ptr', 'p = L; j = 0 —— p 从头结点出发', { s: 'p', a: 0, code: 1 }))
  for (let k = 1; k <= i - 1; k++) {
    out.push(st('ptr', `while：j=${k - 1} < i-1=${i - 1} 成立 → p = p->next，p 到达第 ${k} 个数据结点（j=${k}）`, { s: 'p', a: k, code: 3 }))
  }
  out.push(st('message', `循环结束：p 指向第 ${i - 1} 个结点（${i === 1 ? '即头结点 L' : `值为 ${list[i - 2]}`}），正是插入位置的前驱`, { code: 5 }))
  const sid = n + 1
  out.push(st('newNode', `s = malloc(sizeof(LNode))：在堆上申请新结点，地址独立于链表`, { a: sid, w: e, s: 's', code: 6 }))
  out.push(st('ptr', '指针变量 s 记下新结点地址', { s: 's', a: sid, code: 6 }))
  out.push(st('highlight', `s->data = ${e}：数据域赋值`, { a: sid, code: 7 }))
  const succId = i <= n ? i : -1
  out.push(st('link', `① s->next = p->next：新结点先接住 p 的后继${succId === -1 ? '（这里是 NULL）' : `（值为 ${list[i - 1]}）`}。顺序不能反——反了 p 之后的整条链就丢了`,
    { a: sid, b: succId, code: 8 }))
  out.push(st('link', `② p->next = s：前驱改指新结点，s 正式接入链表`, { a: i - 1, b: sid, code: 9 }))
  out.push(st('message', '插入完成：只改两条指针，O(1)。带头结点让表头 / 表中 / 表尾插入共用同一段代码，无需特判', { code: 10 }))
  return out
}

export function listDeleteTrace(p: ListParams): Step[] {
  const { list } = p
  const e = p.val ?? list[1]
  const out: Step[] = []
  out.push(st('view', '单链表删除：删除第一个值为 e 的结点', { w: 0 }))
  stage(list, out)
  out.push(st('message', `任务：删除第一个值为 ${e} 的结点。p 找前驱、q 指待删，三步：q = p->next; p->next = q->next; free(q)`, { code: 0 }))
  out.push(st('ptr', 'p = L：p 指向头结点', { s: 'p', a: 0, code: 1 }))
  let idx = -1
  for (let k = 0; k < list.length; k++) {
    const nodeId = k + 1
    out.push(st('compare', `while：p->next->data = ${list[k]}，与 e=${e} 比较：${list[k] === e ? '相等，停止后移' : '不等，继续'}`, { a: nodeId, b: -1, w: e, code: 2 }))
    if (list[k] === e) { idx = k; break }
    out.push(st('ptr', `p = p->next：p 后移到第 ${k + 1} 个数据结点`, { s: 'p', a: nodeId, code: 3 }))
  }
  if (idx < 0) {
    out.push(st('ptr', 'p->next = NULL：走到表尾仍未找到', { s: 'p', a: list.length, code: 4 }))
    out.push(st('message', `q = p->next = NULL：表中不存在 ${e}，返回 ERROR（删除失败）`, { code: 5 }))
    return out
  }
  const qid = idx + 1
  out.push(st('ptr', `q = p->next：q 指向待删结点（值为 ${e}）`, { s: 'q', a: qid, code: 4 }))
  const afterQ = idx + 2 <= list.length ? idx + 2 : -1
  out.push(st('link', `p->next = q->next：p 的 next 跳过 q，指向 q 的后继${afterQ === -1 ? '（NULL）' : `（值为 ${list[idx + 1]}）`}。此刻 q 已从链上断开`,
    { a: idx, b: afterQ, code: 6 }))
  out.push(st('free', 'free(q)：释放 q 占用的堆内存——C 语言必须手动释放，漏了就是内存泄漏', { a: qid, code: 7 }))
  out.push(st('message', '删除完成：查找 O(n) + 改指针 O(1)。顺序要点：先断开指针，再 free 内存', { code: 8 }))
  return out
}

export function listGetTrace(p: ListParams): Step[] {
  const { list } = p
  const i = p.pos ?? 3
  const out: Step[] = []
  out.push(st('view', '单链表按位查找：取第 i 个数据元素的值', { w: 0 }))
  stage(list, out)
  if (i < 1 || i > list.length) {
    out.push(st('message', `位序 i=${i} 不合法（合法范围 1..${list.length}），返回 ERROR`, { code: 5 }))
    return out
  }
  out.push(st('message', `任务：取第 ${i} 个数据元素。链表只能顺链扫描——没有随机存取`, { code: 0 }))
  out.push(st('ptr', 'p = L->next; j = 1 —— p 指向首元结点', { s: 'p', a: 1, code: 1 }))
  for (let k = 2; k <= i; k++) {
    out.push(st('ptr', `while：j=${k - 1} < i=${i} → p = p->next，p 到达第 ${k} 个结点（值为 ${list[k - 1]}，j=${k}）`, { s: 'p', a: k, code: 3 }))
  }
  out.push(st('mark', `j = i = ${i}，循环结束：p 指向第 ${i} 个结点`, { a: i, w: 2, code: 5 }))
  out.push(st('message', `*e = p->data = ${list[i - 1]}：取元素成功。按位查找平均 O(n)——这正是链式存储的代价`, { code: 6 }))
  return out
}

export function listBuildHeadTrace(p: ListParams): Step[] {
  const { list } = p
  const out: Step[] = []
  out.push(st('view', '头插法建表：每个新结点都插到头结点之后', { w: 0 }))
  out.push(st('newNode', '头结点 L：数据域不使用', { a: 0, w: 0, s: 'L', ...F }))
  out.push(st('ptr', '头指针 L 指向头结点', { s: 'L', a: 0, ...F }))
  out.push(st('link', 'L->next = NULL：先建空表', { a: 0, b: -1, code: 1 }))
  out.push(st('message', '头插法核心两句：s->next = L->next;  L->next = s; —— 每个新结点都抢在首元之前', { code: 2 }))
  list.forEach((v, k) => {
    const id = k + 1
    out.push(st('newNode', `读入 ${v}：malloc 生成新结点 s`, { a: id, w: v, s: 's', code: 3 }))
    out.push(st('ptr', 's 记下新结点地址', { s: 's', a: id, code: 4 }))
    out.push(st('link', `① s->next = L->next：s 接住原首元${k === 0 ? '（空表，即 NULL）' : `（值为 ${list[k - 1]}）`}`,
      { a: id, b: k === 0 ? -1 : id - 1, code: 5 }))
    out.push(st('link', '② L->next = s：头结点改指 s', { a: 0, b: id, code: 6 }))
  })
  out.push(st('message', `头插法完成：输入 ${list.join(',')}，得到 ${[...list].reverse().join(' → ')} —— 表序与输入相反，O(n)`, { code: 8 }))
  return out
}

export function listBuildTailTrace(p: ListParams): Step[] {
  const { list } = p
  const out: Step[] = []
  out.push(st('view', '尾插法建表：尾指针 r 始终指向表尾', { w: 0 }))
  out.push(st('newNode', '头结点 L：数据域不使用', { a: 0, w: 0, s: 'L', ...F }))
  out.push(st('ptr', '头指针 L 指向头结点', { s: 'L', a: 0, ...F }))
  out.push(st('link', 'L->next = NULL：先建空表', { a: 0, b: -1, code: 1 }))
  out.push(st('ptr', 'r = L：尾指针 r 先指向头结点', { s: 'r', a: 0, code: 2 }))
  list.forEach((v, k) => {
    const id = k + 1
    out.push(st('newNode', `读入 ${v}：malloc 生成新结点 s`, { a: id, w: v, s: 's', code: 4 }))
    out.push(st('ptr', 's 记下新结点地址', { s: 's', a: id, code: 4 }))
    out.push(st('link', `① r->next = s：${k === 0 ? '头结点 L' : '表尾结点'} 接上 s`, { a: id - 1, b: id, code: 6 }))
    out.push(st('ptr', '② r = s：尾指针后移到新表尾', { s: 'r', a: id, code: 7 }))
  })
  out.push(st('message', `尾插法完成：表序与输入一致（${list.join(' → ')}）。多维护一个尾指针 r，换来每次 O(1) 的尾部接入`, { code: 8 }))
  return out
}

export const LIST_CODE = {
  insert: CODE_INSERT, delete: CODE_DELETE, get: CODE_GET,
  buildHead: CODE_BUILD_HEAD, buildTail: CODE_BUILD_TAIL,
}
