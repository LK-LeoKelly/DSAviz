// tree.ts —— 二叉树遍历（三次经过理论）与二叉排序树 BST
// 旁白风格：每一步都讲清"做什么 / 为什么 / 眼睛看哪里"，像老师站在旁边指给你看。

import { st, type Step } from '../steps'

const F = { fast: true } as const

// ================= 二叉树遍历 =================
// 每个结点都会被递归过程"经过"三次：第一次到达、左子树回来、右子树回来。
// 先/中/后序 = 选择在第 1/2/3 次经过时输出。

const TRAV_NAME = ['先序', '中序', '后序'] as const
const TRAV_WHEN = ['第 1 次经过（刚到达）', '第 2 次经过（从左孩子回来）', '第 3 次经过（从右孩子回来）'] as const

export const CODE_PRE = [
  'void PreOrder(BiTree T) {',
  '    if (T == NULL) return;',
  '    visit(T);               // 第 1 次经过：输出',
  '    PreOrder(T->lchild);',
  '    PreOrder(T->rchild);',
  '}',
]
export const CODE_IN = [
  'void InOrder(BiTree T) {',
  '    if (T == NULL) return;',
  '    InOrder(T->lchild);',
  '    visit(T);               // 第 2 次经过：输出',
  '    InOrder(T->rchild);',
  '}',
]
export const CODE_POST = [
  'void PostOrder(BiTree T) {',
  '    if (T == NULL) return;',
  '    PostOrder(T->lchild);',
  '    PostOrder(T->rchild);',
  '    visit(T);               // 第 3 次经过：输出',
  '}',
]

function buildCompleteTree(level: (number | null)[], out: Step[]) {
  level.forEach((v, i) => {
    if (v === null) return
    out.push(st('newNode', `结点 ${v}`, { a: i, w: v, ...F }))
  })
  out.push(st('link', `${level[0]} 是根结点`, { a: 0, b: -1, ...F }))
  level.forEach((v, i) => {
    if (v === null) return
    const l = 2 * i + 1, r = 2 * i + 2
    if (l < level.length && level[l] !== null) out.push(st('link', `${level[l]} 是 ${v} 的左孩子`, { a: l, b: i, w: 0, ...F }))
    if (r < level.length && level[r] !== null) out.push(st('link', `${level[r]} 是 ${v} 的右孩子`, { a: r, b: i, w: 1, ...F }))
  })
}

export function treeTraverseTrace(p: { level: (number | null)[]; kind: 0 | 1 | 2 }): Step[] {
  const level = p.level
  const kind = p.kind
  const out: Step[] = []
  out.push(st('view', `二叉树${TRAV_NAME[kind]}遍历：每个结点被经过三次，输出时机不同`, { w: 5 }))
  buildCompleteTree(level, out)
  out.push(st('message', `先懂一件事再谈遍历：递归下去、退回来，每个结点都会被"路过"整整三次——刚到达、从左孩子回来、从右孩子回来。盯住结点旁的 ①②③`, { code: 0 }))
  out.push(st('message', `三种遍历的区别只有一个：选在第几次路过时输出。${TRAV_NAME[kind]}遍历选第 ${kind + 1} 次——口诀"${kind === 0 ? '根左右' : kind === 1 ? '左根右' : '左右根'}"`, { code: 0 }))

  const visit = (u: number, cnt: number) => {
    const v = level[u]!
    const isOutput = cnt === kind + 1
    const lineMap: number[][] = [[2, 3, 4], [3, 2, 4], [4, 2, 3]]
    out.push(st('visit', isOutput
      ? `${TRAV_WHEN[cnt - 1]}结点 ${v}——${TRAV_NAME[kind]}遍历就等这一刻：输出 ${v}！`
      : `${TRAV_WHEN[cnt - 1]}结点 ${v}：先不输出（它要等第 ${kind + 1} 次经过）`, { a: u, w: cnt, code: lineMap[kind][cnt - 1] }))
    if (isOutput) out.push(st('output', `${v} 进入输出序列`, { w: v }))
  }
  const run = (u: number) => {
    if (u >= level.length || level[u] === null) return
    out.push(st('ptr', `p 来到结点 ${level[u]}`, { s: 'p', a: u, ...F }))
    visit(u, 1)
    run(2 * u + 1)
    visit(u, 2)
    run(2 * u + 2)
    visit(u, 3)
  }
  run(0)
  const seq: (number | string)[] = []
  const collect = (u: number) => {
    if (u >= level.length || level[u] === null) return
    if (kind === 0) seq.push(level[u]!)
    collect(2 * u + 1)
    if (kind === 1) seq.push(level[u]!)
    collect(2 * u + 2)
    if (kind === 2) seq.push(level[u]!)
  }
  collect(0)
  out.push(st('message', `${TRAV_NAME[kind]}遍历结果：${seq.join(' → ')}。回头验证一下——每个输出是不是都正好发生在第 ${kind + 1} 次经过？`))
  return out
}

// ================= 二叉排序树 BST =================
export const CODE_BST_INSERT = [
  '// BST 插入：小走左，大走右，相等不插',
  'p = T;                       // 从根开始',
  'while (p) {',
  '    if (k == p->data) return; // 不允许重复',
  '    if (k <  p->data) { fa = p; p = p->lchild; }',
  '    else              { fa = p; p = p->rchild; }',
  '}',
  's = malloc(BiTNode); s->data = k;',
  'if (T 为空)      T = s;',
  'else if (k < fa->data) fa->lchild = s;',
  'else                   fa->rchild = s;',
]

export const CODE_BST_SEARCH = [
  'BiTree SearchBST(BiTree T, int k) {',
  '    p = T;',
  '    while (p) {',
  '        if (k == p->data) return p;   // 命中',
  '        p = k < p->data ? p->lchild : p->rchild;',
  '    }',
  '    return NULL;                      // 走到空指针',
  '}',
]

interface BstNode { val: number; lc: number; rc: number }

export function bstBuildTrace(p: { keys: number[]; fastBefore?: number }): Step[] {
  const keys = p.keys
  const fastBefore = p.fastBefore ?? -1   // 沙盒用：插入序号 < fastBefore 的部分快进（已有树直接搭好）
  const out: Step[] = []
  const nodes: BstNode[] = []
  let root = -1
  out.push(st('view', '二叉排序树（BST）：左子树 < 根 < 右子树', { w: 5 }))
  out.push(st('message', fastBefore > 0
    ? `已有树形（${keys.slice(0, fastBefore).join('、')} 依次插入建成）快速重放；本次主角是新元素 ${keys[fastBefore]}，盯住它的寻路过程`
    : `依次插入 ${keys.join('、')}。就一条家规：比当前结点小走左边，大走右边，相等不插。这条家规保证了"左边永远小、右边永远大"`, { code: 0 }))
  keys.forEach((k, ki) => {
    const FF = ki < fastBefore ? F : {}
    const id = nodes.length
    nodes.push({ val: k, lc: -1, rc: -1 })
    out.push(st('newNode', `插入 ${k}：先在堆区 malloc 一个新结点 s（看顶部暂存区）`, { a: id, w: k, s: 's', code: 7, ...FF }))
    if (root === -1) {
      root = id
      out.push(st('link', `树还是空的：${k} 直接成为根`, { a: id, b: -1, code: 8, ...FF }))
      return
    }
    out.push(st('ptr', `给 ${k} 找位置：p 从根 ${nodes[root].val} 出发，一路比下去`, { s: 'p', a: root, code: 1, ...FF }))
    let cur = root
    let fa = -1
    let side = 0
    while (true) {
      if (k === nodes[cur].val) {
        out.push(st('compare', `${k} 已经在树里了：BST 不允许重复关键字，放弃插入`, { a: cur, b: -1, w: k, code: 3, ...FF }))
        return
      }
      const goLeft = k < nodes[cur].val
      out.push(st('compare', `${k} ${goLeft ? '<' : '>'} ${nodes[cur].val}：${goLeft ? '小的都去左边' : '大的都去右边'}，走${goLeft ? '左' : '右'}子树`, { a: cur, b: -1, w: k, code: goLeft ? 4 : 5, ...FF }))
      fa = cur; side = goLeft ? 0 : 1
      const nxt = goLeft ? nodes[cur].lc : nodes[cur].rc
      if (nxt === -1) break
      cur = nxt
      out.push(st('ptr', `p 后移到 ${nodes[cur].val}`, { s: 'p', a: cur, ...F }))
    }
    if (side === 0) nodes[fa].lc = id; else nodes[fa].rc = id
    out.push(st('link', `p 走不动了：fa（${nodes[fa].val}）的${side === 0 ? '左' : '右'}指针为空——这正是 ${k} 的家！s 挂上去`,
      { a: id, b: fa, w: side, code: side === 0 ? 9 : 10, ...FF }))
  })
  out.push(st('message', '建树完成。留个悬念：对这棵树做中序遍历，得到的序列有什么特别？——点下方"中序遍历验证"亲眼看看'))
  return out
}

// BST 中序遍历验证：先快进建出当前树，再用三次经过模型跑中序——输出必然有序
export function bstInorderTrace(p: { keys: number[] }): Step[] {
  const keys = p.keys
  const out: Step[] = []
  const nodes: BstNode[] = []
  let root = -1
  out.push(st('view', 'BST 中序遍历：验证"左 < 根 < 右"的家规 ⇒ 输出必有序', { w: 5 }))
  keys.forEach((kv) => {
    const id = nodes.length
    nodes.push({ val: kv, lc: -1, rc: -1 })
    out.push(st('newNode', `结点 ${kv}`, { a: id, w: kv, ...F }))
    if (root === -1) { root = id; out.push(st('link', '根', { a: id, b: -1, ...F })); return }
    let cur = root
    while (true) {
      if (kv < nodes[cur].val) {
        if (nodes[cur].lc === -1) { nodes[cur].lc = id; out.push(st('link', '左孩子', { a: id, b: cur, w: 0, ...F })); break }
        cur = nodes[cur].lc
      } else if (kv > nodes[cur].val) {
        if (nodes[cur].rc === -1) { nodes[cur].rc = id; out.push(st('link', '右孩子', { a: id, b: cur, w: 1, ...F })); break }
        cur = nodes[cur].rc
      } else break
    }
  })
  out.push(st('message', `树已建成（插入顺序：${keys.join('、')})。现在中序遍历它——每个结点第 ② 次经过时输出`, { code: 0 }))
  const run = (id: number) => {
    if (id === -1) return
    out.push(st('ptr', `p 来到结点 ${nodes[id]!.val}`, { s: 'p', a: id, ...F }))
    out.push(st('visit', `第 1 次经过（刚到达）结点 ${nodes[id]!.val}：先不输出，左子树还没走完`, { a: id, w: 1, code: 1 }))
    run(nodes[id]!.lc)
    out.push(st('visit', `第 2 次经过（从左孩子回来）结点 ${nodes[id]!.val}——中序就等这一刻：输出 ${nodes[id]!.val}！`, { a: id, w: 2, code: 2 }))
    out.push(st('output', `${nodes[id]!.val} 进入输出序列`, { w: nodes[id]!.val }))
    run(nodes[id]!.rc)
    out.push(st('visit', `第 3 次经过（从右孩子回来）结点 ${nodes[id]!.val}：它的任务完成了`, { a: id, w: 3, code: 3, ...F }))
  }
  run(root)
  const sorted = [...keys].sort((x, y) => x - y)
  out.push(st('message', `输出序列：${sorted.join(' → ')}——从小到大，分毫不差！这就是"二叉排序树"名字的由来：建树的规则决定了中序遍历必有序`))
  return out
}

export function bstSearchTrace(p: { keys: number[]; key: number }): Step[] {
  const keys = p.keys
  const k = p.key
  const out: Step[] = []
  const nodes: BstNode[] = []
  let root = -1
  out.push(st('view', `BST 查找：在树中找 ${k}`, { w: 5 }))
  keys.forEach((kv) => {
    const id = nodes.length
    nodes.push({ val: kv, lc: -1, rc: -1 })
    out.push(st('newNode', `结点 ${kv}`, { a: id, w: kv, ...F }))
    if (root === -1) { root = id; out.push(st('link', '根', { a: id, b: -1, ...F })); return }
    let cur = root
    while (true) {
      if (kv < nodes[cur].val) {
        if (nodes[cur].lc === -1) { nodes[cur].lc = id; out.push(st('link', '左孩子', { a: id, b: cur, w: 0, ...F })); break }
        cur = nodes[cur].lc
      } else if (kv > nodes[cur].val) {
        if (nodes[cur].rc === -1) { nodes[cur].rc = id; out.push(st('link', '右孩子', { a: id, b: cur, w: 1, ...F })); break }
        cur = nodes[cur].rc
      } else break
    }
  })
  out.push(st('message', `在这棵 BST 里找 ${k}。利用家规：每比较一次，就能排除一整棵子树——这就是它比顺序查找快的原因`, { code: 0 }))
  out.push(st('ptr', `p = T（根 ${nodes[root].val}）`, { s: 'p', a: root, code: 1 }))
  let cur = root
  let depth = 1
  while (cur !== -1) {
    const v = nodes[cur].val
    if (k === v) {
      out.push(st('compare', `${k} = ${v}：命中！`, { a: cur, b: -1, w: k, code: 3 }))
      out.push(st('mark', `查找成功，比较了 ${depth} 次。注意：比较次数 = 结点所在的层数`, { a: cur, w: 2, code: 3 }))
      return out
    }
    const goLeft = k < v
    out.push(st('compare', `${k} ${goLeft ? '<' : '>'} ${v}：${goLeft ? '右' : '左'}子树整片排除，走${goLeft ? '左' : '右'}`, { a: cur, b: -1, w: k, code: 4 }))
    cur = goLeft ? nodes[cur].lc : nodes[cur].rc
    depth++
    if (cur !== -1) out.push(st('ptr', `p 后移到 ${nodes[cur].val}`, { s: 'p', a: cur, code: 4 }))
  }
  out.push(st('ptr', 'p = NULL：走到空指针，没找着', { s: 'p', a: -1, code: 5 }))
  out.push(st('message', `${k} 不在这棵树里。最多比较"树高"次就敢下结论——树高和结点数 n 是什么关系？看下方「复杂度怎么来的」`, { code: 6 }))
  return out
}
