// heap.ts —— 堆：向上调整建堆（插入法）与堆排序
// 视图约定：复用数组事件（initArray/compare/swap/mark），渲染层把下标画成完全二叉树 + 数组双视图。
// 旁白风格：每一步都讲清"做什么 / 为什么 / 眼睛看哪里"；结尾用真实统计数佐证，而不是甩复杂度结论。

import { st, type Step } from '../steps'

export const CODE_HEAP_BUILD = [
  '// 大顶堆：每个父结点 >= 它的孩子',
  'void HeapInsert(Heap &H, int k) {',
  '    H.data[++H.n] = k;        // 新元素放到末尾',
  '    u = H.n;',
  '    while (u > 1 && H.data[u] > H.data[u/2]) {',
  '        swap(H.data[u], H.data[u/2]);  // 比父大：上浮',
  '        u = u / 2;',
  '    }',
  '}',
]

export const CODE_HEAP_SORT = [
  'void HeapSort(ElemType a[], int n) {',
  '    for (i = n/2 - 1; i >= 0; --i) SiftDown(a, i, n);   // 建大顶堆',
  '    for (end = n - 1; end > 0; --end) {',
  '        swap(a[0], a[end]);    // 堆顶（最大值）归位',
  '        SiftDown(a, 0, end);   // 剩余元素重新调整',
  '    }',
  '}',
  'void SiftDown(ElemType a[], int u, int n) {',
  '    while (2*u+1 < n) {',
  '        big = 左右孩子中较大者;',
  '        if (a[u] >= a[big]) break;',
  '        swap(a[u], a[big]);  u = big;   // 下沉',
  '    }',
  '}',
]

export function heapBuildTrace(p: { keys: number[] }): Step[] {
  const out: Step[] = []
  const h: number[] = []
  let cmpCnt = 0, swapCnt = 0
  out.push(st('view', '堆的插入：放末尾，再与父结点比较上浮（向上调整）', { w: 6 }))
  out.push(st('message', '大顶堆只有一条家规：每个父结点 ≥ 它的孩子。完全二叉树存在数组里——下标 i 的父结点在 (i-1)/2，记住这个公式，上浮全靠它找爸爸', { code: 0 }))
  p.keys.forEach((x, ki) => {
    h.push(x)
    let u = h.length - 1
    out.push(st('initArray', u === 0
      ? `插入 ${x}：堆还是空的，它直接坐上下标 0，成为堆顶`
      : `插入 ${x}：先放到末尾下标 ${u}。别急着管合不合法，放进来再调整`, { a: u, w: x, code: 2 }))
    while (u > 0) {
      const fa = (u - 1) >> 1
      cmpCnt++
      out.push(st('compare', `查家规：${h[u]} 和父结点 ${h[fa]} 比一比（${u} 的爸爸是 (${u}-1)/2 = ${fa}）`, { a: u, b: fa, code: 4 }))
      if (h[u] > h[fa]) {
        ;[h[u], h[fa]] = [h[fa], h[u]]
        swapCnt++
        out.push(st('swap', `${h[fa]} 比父结点大，坏了规矩！交换——${h[fa]} 上浮一层，继续向上查`, { a: u, b: fa, code: 5 }))
        u = fa
      } else {
        out.push(st('message', `${h[u]} ≤ 父结点 ${h[fa]}：家规满足，停。上面的祖先们只会更大，不用查了`, { code: 7 }))
        break
      }
    }
    out.push(st('mark', `${h[u]} 在下标 ${u} 安顿下来${u === 0 && h.length > 1 ? '，成了新堆顶' : ''}`, { a: u, w: 1, code: 7 }))
    if (ki < p.keys.length - 1) out.push(st('mark', '好，迎接下一个元素', { a: u, w: 0, fast: true }))
  })
  out.push(st('message', `建堆完成：堆顶 ${h[0]} 就是最大值。回顾一下——共插入 ${h.length} 个元素，比较 ${cmpCnt} 次、上浮交换 ${swapCnt} 次。每个元素最多上浮"树高"层，这就是为什么建堆很省`))
  return out
}

function siftDown(a: number[], n: number, u: number, out: Step[], cnt: { cmp: number; swap: number }) {
  while (true) {
    const l = 2 * u + 1, r = 2 * u + 2
    let big = u
    if (l < n) {
      cnt.cmp++
      out.push(st('compare', `左孩子 ${a[l]} 跟 ${a[big]} 比`, { a: l, b: big, code: 9 }))
      if (a[l] > a[big]) big = l
    }
    if (r < n) {
      cnt.cmp++
      out.push(st('compare', `右孩子 ${a[r]} 跟目前较大的 ${a[big]} 比`, { a: r, b: big, code: 9 }))
      if (a[r] > a[big]) big = r
    }
    if (big === u) {
      out.push(st('message', `${a[u]} ≥ 两个孩子：位置合法，下沉结束`, { code: 10, fast: true }))
      break
    }
    ;[a[u], a[big]] = [a[big], a[u]]
    cnt.swap++
    out.push(st('swap', `${a[big]} 比孩子中的较大者 ${a[u]} 小：交换，${a[big]} 沉下去一层`, { a: u, b: big, code: 11 }))
    u = big
  }
}

export function heapSortTrace(p: { keys: number[] }): Step[] {
  const a = [...p.keys]
  const n = a.length
  const out: Step[] = []
  const cnt = { cmp: 0, swap: 0 }
  out.push(st('view', '堆排序：先建大顶堆，再逐个取出堆顶', { w: 6 }))
  a.forEach((v, i) => out.push(st('initArray', `放入 a[${i}] = ${v}`, { a: i, w: v, fast: true })))
  out.push(st('message', `分两步走：① 把数组调整成大顶堆；② 每次把堆顶（最大值）换到末尾归位。先想一个问题：调堆该从哪个结点开始？`, { code: 1 }))
  out.push(st('message', `答案：从最后一个非叶子（下标 n/2-1 = ${(n >> 1) - 1}）倒着往前调。叶子没有孩子，天然合法，不用管`, { code: 1 }))
  for (let i = (n >> 1) - 1; i >= 0; i--) {
    out.push(st('highlight', `轮到下标 ${i}（值 ${a[i]}）：让它"下沉"到合法位置。看它和两个孩子谁最大`, { a: i, code: 1 }))
    siftDown(a, n, i, out, cnt)
  }
  out.push(st('message', `建堆完成：堆顶 ${a[0]} 是最大值。注意这种"下沉法"建堆比逐个插入还快，原因见下方复杂度推导卡`, { code: 1 }))
  out.push(st('message', '第 ② 步开始：堆顶与末尾交换，最大值归位；堆规模减一，新堆顶重新下沉', { code: 2 }))
  for (let end = n - 1; end > 0; end--) {
    ;[a[0], a[end]] = [a[end], a[0]]
    cnt.swap++
    out.push(st('swap', `堆顶 ${a[end]}（当前最大）与末尾交换：${a[end]} 到达最终位置`, { a: 0, b: end, code: 3 }))
    out.push(st('mark', `下标 ${end} 归位，后面是有序区。剩余 ${end} 个元素重新调堆`, { a: end, w: 2, code: 3 }))
    siftDown(a, end, 0, out, cnt)
  }
  out.push(st('mark', '最后一个元素自然归位', { a: 0, w: 2 }))
  out.push(st('message', `堆排序完成：共比较 ${cnt.cmp} 次、交换 ${cnt.swap} 次。每个元素归位最多下沉"树高"层——这就是为什么它和归并一样快，而且还不用额外数组`))
  return out
}
