// arrayAlgos.ts —— 排序 / 查找 / 哈希（数组视图：下标、指针、区间一目了然）
// 旁白风格：每一步都讲清"做什么 / 为什么 / 眼睛看哪里"；
// 结尾用本次真实运行的比较/交换次数作佐证，复杂度结论引导到「复杂度怎么来的」推导卡。

import { st, type Step } from '../steps'

// ===================== 排序 =====================

export const CODE_BUBBLE = [
  'void BubbleSort(ElemType a[], int n) {',
  '    for (i = 0; i < n - 1; ++i) {',
  '        flag = 0;                       // 本趟是否发生交换',
  '        for (j = 0; j < n - 1 - i; ++j)',
  '            if (a[j] > a[j + 1]) {      // 相邻比较',
  '                swap(a[j], a[j + 1]);   // 逆序则交换',
  '                flag = 1;',
  '            }',
  '        if (!flag) break;               // 无交换：已有序',
  '    }',
  '}',
]

export function bubbleSortTrace(p: { arr: number[] }): Step[] {
  const a = [...p.arr]
  const n = a.length
  const out: Step[] = []
  let cmp = 0, swp = 0
  out.push(st('view', '冒泡排序：相邻比较，大的往后"冒"', { w: 1 }))
  a.forEach((v, i) => out.push(st('initArray', `放入 a[${i}] = ${v}`, { a: i, w: v, fast: true })))
  out.push(st('message', '思路：每一趟从头开始，相邻两个比一比，逆序就交换——一趟下来，最大值必然"冒"到末尾。若一整趟没交换过，说明已经有序，可以提前收工', { code: 0 }))
  for (let i = 0; i < n - 1; i++) {
    let flag = false
    out.push(st('message', `第 ${i + 1} 趟：只管 [0 .. ${n - 1 - i}]，后面的 ${i ? i + ' 个' : ''}已经归位不用碰`, { code: 1 }))
    out.push(st('range', '涂色的是本趟活动范围', { a: 0, b: n - 1 - i, fast: true }))
    for (let j = 0; j < n - 1 - i; j++) {
      cmp++
      out.push(st('compare', `看相邻的一对：a[${j}]=${a[j]} 和 a[${j + 1}]=${a[j + 1]}，${a[j] > a[j + 1] ? '前面的大——逆序！' : '顺序正常，不动'}`, { a: j, b: j + 1, code: 4 }))
      if (a[j] > a[j + 1]) {
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
        swp++
        out.push(st('swap', `交换：${a[j]} 往后挪一格。它还会继续跟后面比，直到冒不动为止`, { a: j, b: j + 1, code: 5 }))
        flag = true
      }
    }
    out.push(st('mark', `本趟最大值 ${a[n - 1 - i]} 已经冒到末尾，归位！`, { a: n - 1 - i, w: 2, code: 8 }))
    if (!flag) { out.push(st('message', '这一趟一次交换都没发生：说明全都有序了，提前结束——这就是 flag 的作用', { code: 8 })); break }
  }
  out.push(st('range', '区间标记收起', { a: -1, fast: true }))
  out.push(st('message', `完成：共比较 ${cmp} 次、交换 ${swp} 次。为什么最多比较 n(n-1)/2 次？看下方「复杂度怎么来的」`))
  return out
}

export const CODE_SELECT = [
  'void SelectSort(ElemType a[], int n) {',
  '    for (i = 0; i < n - 1; ++i) {',
  '        min = i;                        // 假设 i 最小',
  '        for (j = i + 1; j < n; ++j)',
  '            if (a[j] < a[min]) min = j; // 找到更小的',
  '        if (min != i) swap(a[i], a[min]);',
  '    }',
  '}',
]

export function selectSortTrace(p: { arr: number[] }): Step[] {
  const a = [...p.arr]
  const n = a.length
  const out: Step[] = []
  let cmp = 0, swp = 0
  out.push(st('view', '选择排序：每趟选出最小值，放到最前面', { w: 1 }))
  a.forEach((v, i) => out.push(st('initArray', `放入 a[${i}] = ${v}`, { a: i, w: v, fast: true })))
  out.push(st('message', '思路：每趟把"剩余区间里最小的"揪出来，跟区间头交换。注意它的特点——每趟最多只交换 1 次', { code: 0 }))
  for (let i = 0; i < n - 1; i++) {
    let min = i
    out.push(st('message', `第 ${i + 1} 趟：在 [${i} .. ${n - 1}] 里找最小值。先假设 a[${i}]=${a[i]} 最小`, { code: 2 }))
    out.push(st('range', '涂色的是本趟选择范围', { a: i, b: n - 1, fast: true }))
    out.push(st('ptr', `min → ${i}`, { s: 'min', a: i, code: 2, fast: true }))
    for (let j = i + 1; j < n; j++) {
      cmp++
      out.push(st('compare', `挑战者 a[${j}]=${a[j]} 上台，跟当前最小 a[${min}]=${a[min]} 比`, { a: j, b: min, code: 4 }))
      if (a[j] < a[min]) {
        min = j
        out.push(st('ptr', `挑战成功！min 改指 ${j}（值 ${a[j]}）`, { s: 'min', a: j, code: 4 }))
      }
    }
    if (min !== i) {
      ;[a[i], a[min]] = [a[min], a[i]]
      swp++
      out.push(st('swap', `本趟冠军 ${a[i]} 出炉，跟区间头 a[${i}] 交换——前 ${i + 1} 个从此有序`, { a: i, b: min, code: 5 }))
    } else {
      out.push(st('message', `最小值本来就是 a[${i}]，不用交换`, { code: 5 }))
    }
    out.push(st('ptr', '收起 min，准备下一趟', { s: 'min', a: -1, code: 5, fast: true }))
    out.push(st('mark', `${a[i]} 归位`, { a: i, w: 2, code: 5, fast: true }))
  }
  out.push(st('mark', '最后一个元素自然归位', { a: n - 1, w: 2, fast: true }))
  out.push(st('range', '区间标记收起', { a: -1, fast: true }))
  out.push(st('message', `完成：共比较 ${cmp} 次、交换仅 ${swp} 次。比较次数恒为 n(n-1)/2（不信数一数），交换最多 n-1 次——"比较贵、交换省"是它的标签，推导见下方卡片`))
  return out
}

export const CODE_INSERT_SORT = [
  'void InsertSort(ElemType a[], int n) {',
  '    for (i = 1; i < n; ++i) {',
  '        key = a[i];                     // 待插入元素',
  '        for (j = i - 1; j >= 0 && a[j] > key; --j)',
  '            a[j + 1] = a[j];            // 大于 key 的后移',
  '        a[j + 1] = key;                 // 插入到空出的位置',
  '    }',
  '}',
]

export function insertSortTrace(p: { arr: number[] }): Step[] {
  const a = [...p.arr]
  const n = a.length
  const out: Step[] = []
  let cmp = 0, mov = 0
  out.push(st('view', '直接插入排序：像整理扑克牌，把新牌插入已排好的部分', { w: 1 }))
  a.forEach((v, i) => out.push(st('initArray', `放入 a[${i}] = ${v}`, { a: i, w: v, fast: true })))
  out.push(st('message', '思路：左边始终保持一个有序区，每次拿右边第一张牌，插进有序区的正确位置。打扑克时你就是这么干的', { code: 0 }))
  out.push(st('mark', 'a[0] 一个人就是天然的有序区', { a: 0, w: 2 }))
  for (let i = 1; i < n; i++) {
    const key = a[i]
    out.push(st('highlight', `摸起新牌 key = a[${i}] = ${key}，要在有序区 [0 .. ${i - 1}] 里找它的位置`, { a: i, code: 2 }))
    out.push(st('ptr', `key=${key} 捏在手里`, { s: 'key', a: i, code: 2, fast: true }))
    let j = i - 1
    while (j >= 0 && a[j] > key) {
      cmp++
      out.push(st('compare', `从右往左扫：a[${j}]=${a[j]} 比 key=${key} 大`, { a: j, b: -1, w: key, code: 3 }))
      a[j + 1] = a[j]
      mov++
      out.push(st('setValue', `比 key 大就得让位：${a[j]} 后移一格，把坑腾出来`, { a: j + 1, w: a[j], code: 4 }))
      j--
    }
    if (j >= 0) {
      cmp++
      out.push(st('compare', `a[${j}]=${a[j]} ≤ key=${key}：停了，插入点就在它右边`, { a: j, b: -1, w: key, code: 3 }))
    } else {
      out.push(st('message', `一路扫到头：key=${key} 比有序区所有人都小，插到最前面`, { code: 3 }))
    }
    a[j + 1] = key
    out.push(st('setValue', `key=${key} 落进腾出的坑 a[${j + 1}]`, { a: j + 1, w: key, code: 5 }))
    out.push(st('ptr', '收起 key', { s: 'key', a: -1, fast: true }))
    out.push(st('mark', `前 ${i + 1} 个元素已有序`, { a: j + 1, w: 2, code: 5, fast: true }))
  }
  out.push(st('message', `完成：共比较 ${cmp} 次、后移 ${mov} 次。数组越接近有序，后移越少——所以它对"基本有序"的数组特别快，推导见下方卡片`))
  return out
}

export const CODE_QUICK = [
  'int Partition(ElemType a[], int lo, int hi) {',
  '    pivot = a[hi];              // 取最后一个为基准',
  '    i = lo - 1;                 // i：小于基准区的右边界',
  '    for (j = lo; j < hi; ++j)',
  '        if (a[j] < pivot) { ++i; swap(a[i], a[j]); }',
  '    swap(a[i + 1], a[hi]);      // 基准归位',
  '    return i + 1;',
  '}',
  'void QuickSort(a, lo, hi) {',
  '    if (lo < hi) { p = Partition(a, lo, hi);',
  '        QuickSort(a, lo, p-1); QuickSort(a, p+1, hi); }',
  '}',
]

export function quickSortTrace(p: { arr: number[] }): Step[] {
  const a = [...p.arr]
  const out: Step[] = []
  let cmp = 0, swp = 0
  out.push(st('view', '快速排序：基准归位 + 分治左右两段', { w: 1 }))
  a.forEach((v, i) => out.push(st('initArray', `放入 a[${i}] = ${v}`, { a: i, w: v, fast: true })))
  out.push(st('message', '核心动作叫"划分"：选一个基准 pivot，把比它小的全搁左边、大的全搁右边——基准落下的位置，就是它的最终位置。然后左右两段各自递归', { code: 8 }))
  const qs = (lo: number, hi: number) => {
    if (lo > hi) return
    if (lo === hi) { out.push(st('mark', `只剩 a[${lo}]=${a[lo]} 一个，自然归位`, { a: lo, w: 2, fast: true })); return }
    out.push(st('range', `处理子段 [${lo} .. ${hi}]`, { a: lo, b: hi, code: 9 }))
    const pivot = a[hi]
    out.push(st('highlight', `取最后一个元素 a[${hi}]=${pivot} 当基准 pivot`, { a: hi, code: 1 }))
    out.push(st('ptr', `pivot=${pivot}`, { s: 'pivot', a: hi, code: 1, fast: true }))
    out.push(st('message', `目标：扫完一遍后，pivot 左边全是小于它的，右边全是大于等于它的。i 是"小于区"的右边界，一开始是空的（i=${lo - 1}）`, { code: 2, fast: lo - 1 < 0 }))
    let i = lo - 1
    for (let j = lo; j < hi; j++) {
      out.push(st('ptr', `j 扫到 ${j}`, { s: 'j', a: j, code: 3, fast: true }))
      cmp++
      out.push(st('compare', `a[${j}]=${a[j]} 跟 pivot=${pivot} 比：${a[j] < pivot ? '更小！该进左边' : '不小，留在右边'}`, { a: j, b: hi, code: 4 }))
      if (a[j] < pivot) {
        i++
        if (i !== j) {
          ;[a[i], a[j]] = [a[j], a[i]]
          swp++
          out.push(st('swap', `小于区扩一格（i=${i}）：a[${i}] 与 a[${j}] 交换，${a[i]} 归入左边`, { a: i, b: j, code: 4 }))
        } else {
          out.push(st('message', `它本来就在小于区的下一个位置，i 扩到 ${i} 即可，不用交换`, { code: 4, fast: true }))
        }
      }
    }
    ;[a[i + 1], a[hi]] = [a[hi], a[i + 1]]
    swp++
    out.push(st('swap', `最后一步：基准 ${a[i + 1]} 换到小于区的右边（下标 ${i + 1}）——它的最终位置定了！`, { a: i + 1, b: hi, code: 5 }))
    out.push(st('ptr', '收起 pivot', { s: 'pivot', a: -1, fast: true }))
    out.push(st('ptr', '收起 j', { s: 'j', a: -1, fast: true }))
    out.push(st('mark', `盯住 a[${i + 1}]=${a[i + 1]}：左边都比它小，右边都比它大——这辈子不用再动了`, { a: i + 1, w: 2, code: 6 }))
    out.push(st('range', '区间标记收起', { a: -1, fast: true }))
    qs(lo, i)
    qs(i + 2, hi)
  }
  qs(0, a.length - 1)
  out.push(st('message', `完成：共比较 ${cmp} 次、交换 ${swp} 次。快不快全看基准选得均不均——为什么平均比冒泡快得多？推导见下方卡片`))
  return out
}

export const CODE_MERGE = [
  'void MergeSort(ElemType a[], int lo, int hi) {',
  '    if (lo >= hi) return;',
  '    mid = (lo + hi) / 2;',
  '    MergeSort(a, lo, mid);      // 左半归并',
  '    MergeSort(a, mid + 1, hi);  // 右半归并',
  '    Merge(a, lo, mid, hi);      // 合并两个有序段',
  '}',
]

export function mergeSortTrace(p: { arr: number[] }): Step[] {
  const a = [...p.arr]
  const out: Step[] = []
  let cmp = 0
  out.push(st('view', '归并排序：先递归分半，再合并两个有序段', { w: 1 }))
  a.forEach((v, i) => out.push(st('initArray', `放入 a[${i}] = ${v}`, { a: i, w: v, fast: true })))
  out.push(st('message', '分治两步走：① 从中间切开，左右各自排好（切到只剩 1 个元素必然有序）；② 把两段有序合并成一段。合并不是瞎合——用双指针，谁小谁先进辅助数组 tmp', { code: 0 }))
  const merge = (lo: number, mid: number, hi: number) => {
    out.push(st('range', `合并 [${lo} .. ${mid}] 与 [${mid + 1} .. ${hi}]：这两段各自已经有序，看下面怎么合成一段`, { a: lo, b: hi, code: 5 }))
    out.push(st('outClear', '请出辅助数组 tmp：合并结果先放 tmp，排好再整体写回——"归并需要额外空间"说的就是它'))
    const tmp: number[] = []
    let i = lo, j = mid + 1
    out.push(st('ptr', `左指针 i 从左段开头 a[${lo}] 出发`, { s: 'i', a: lo, code: 5 }))
    out.push(st('ptr', `右指针 j 从右段开头 a[${mid + 1}] 出发`, { s: 'j', a: mid + 1, code: 5 }))
    while (i <= mid && j <= hi) {
      cmp++
      out.push(st('compare', `盯住两个指针：a[i]=${a[i]} vs a[j]=${a[j]}，谁小谁进 tmp`, { a: i, b: j, code: 5 }))
      if (a[i] <= a[j]) {
        tmp.push(a[i])
        out.push(st('output', `${a[i]} ≤ ${a[j]}：${a[i]} 进 tmp[${tmp.length - 1}]，i 右移`, { w: a[i], code: 5 }))
        i++
        if (i <= mid) out.push(st('ptr', `i → ${i}`, { s: 'i', a: i, fast: true }))
      } else {
        tmp.push(a[j])
        out.push(st('output', `${a[j]} < ${a[i]}：${a[j]} 进 tmp[${tmp.length - 1}]，j 右移`, { w: a[j], code: 5 }))
        j++
        if (j <= hi) out.push(st('ptr', `j → ${j}`, { s: 'j', a: j, fast: true }))
      }
    }
    if (i <= mid || j <= hi) {
      const leftGone = i > mid
      out.push(st('message', `${leftGone ? '左' : '右'}段先用完。${leftGone ? '右' : '左'}段剩下的本来就有序，直接依次抄进 tmp`))
    }
    while (i <= mid) { tmp.push(a[i]); out.push(st('output', `抄入 ${a[i]}`, { w: a[i], fast: true })); i++ }
    while (j <= hi) { tmp.push(a[j]); out.push(st('output', `抄入 ${a[j]}`, { w: a[j], fast: true })); j++ }
    out.push(st('message', `tmp 排好了：[${tmp.join('，')}]。现在逐格写回原数组的 [${lo} .. ${hi}]，盯着上面`))
    tmp.forEach((v, k) => {
      a[lo + k] = v
      out.push(st('setValue', `tmp[${k}] = ${v} 写回 a[${lo + k}]`, { a: lo + k, w: v, code: 5 }))
    })
    out.push(st('outClear', '本次合并完成，tmp 清空', { fast: true }))
    out.push(st('ptr', '收起 i', { s: 'i', a: -1, fast: true }))
    out.push(st('ptr', '收起 j', { s: 'j', a: -1, fast: true }))
  }
  const ms = (lo: number, hi: number) => {
    if (lo >= hi) return
    const mid = (lo + hi) >> 1
    out.push(st('range', `拆分 [${lo} .. ${hi}]：从正中间 mid=${mid} 切开，先把左半排好，再排右半`, { a: lo, b: hi, code: 2 }))
    ms(lo, mid)
    ms(mid + 1, hi)
    merge(lo, mid, hi)
  }
  ms(0, a.length - 1)
  out.push(st('range', '区间标记收起', { a: -1, fast: true }))
  out.push(st('markAll', '全部归位：数组已有序', { w: 2 }))
  out.push(st('message', `完成：共比较 ${cmp} 次。无论数组初态如何，比较次数都差不多——"稳"是归并最大的底气，代价就是那个 tmp。推导见下方卡片`))
  return out
}

// ===================== 查找 =====================

export const CODE_SEQ_SEARCH = [
  'int SeqSearch(ElemType a[], int n, ElemType k) {',
  '    for (i = 0; i < n; ++i)',
  '        if (a[i] == k) return i;',
  '    return -1;',
  '}',
]

export function seqSearchTrace(p: { arr: number[]; key: number }): Step[] {
  const a = p.arr
  const k = p.key
  const out: Step[] = []
  out.push(st('view', `顺序查找：从头到尾逐个比对，找 ${k}`, { w: 1 }))
  a.forEach((v, i) => out.push(st('initArray', `放入 a[${i}] = ${v}`, { a: i, w: v, fast: true })))
  out.push(st('message', `最朴素的办法：从下标 0 开始，一个一个跟 ${k} 对。它不要求数组有序，这是它最大的优点`, { code: 0 }))
  for (let i = 0; i < a.length; i++) {
    out.push(st('ptr', `i → ${i}`, { s: 'i', a: i, fast: true }))
    out.push(st('compare', `a[${i}]=${a[i]} 跟 ${k} 对一下：${a[i] === k ? '相等！' : '不等，下一个'}`, { a: i, b: -1, w: k, code: 2 }))
    if (a[i] === k) {
      out.push(st('mark', `找到！返回下标 ${i}。这次一共比较了 ${i + 1} 次`, { a: i, w: 2, code: 2 }))
      out.push(st('message', `平均要比较 (n+1)/2 次——这个数怎么来的？看下方「复杂度怎么来的」`))
      return out
    }
  }
  out.push(st('message', `扫完了也没见到 ${k}：返回 -1。查找失败时比较次数固定是 n 次`))
  return out
}

export const CODE_BIN_SEARCH = [
  'int BinSearch(ElemType a[], int n, ElemType k) {',
  '    low = 0;  high = n - 1;',
  '    while (low <= high) {',
  '        mid = (low + high) / 2;',
  '        if (k == a[mid]) return mid;',
  '        if (k <  a[mid]) high = mid - 1;  // 去左半',
  '        else             low  = mid + 1;  // 去右半',
  '    }',
  '    return -1;                  // low > high：区间为空',
  '}',
]

export function binSearchTrace(p: { arr: number[]; key: number }): Step[] {
  const a = [...p.arr].sort((x, y) => x - y)
  const k = p.key
  const out: Step[] = []
  let rounds = 0
  out.push(st('view', `折半查找（二分）：前提是有序！在有序数组中找 ${k}`, { w: 1 }))
  a.forEach((v, i) => out.push(st('initArray', `有序表：a[${i}] = ${v}`, { a: i, w: v, fast: true })))
  let lo = 0, hi = a.length - 1
  out.push(st('message', `初始搜索区间 [low=${lo}, high=${hi}]。因为数组有序，每跟中点比一次，就能排除一半——这是它快的根本原因`, { code: 1 }))
  while (lo <= hi) {
    rounds++
    const mid = (lo + hi) >> 1
    out.push(st('range', `当前区间 [${lo} .. ${hi}]，共 ${hi - lo + 1} 个嫌疑`, { a: lo, b: hi, code: 2 }))
    out.push(st('ptr', `low=${lo}`, { s: 'low', a: lo, code: 2, fast: true }))
    out.push(st('ptr', `high=${hi}`, { s: 'high', a: hi, code: 2, fast: true }))
    out.push(st('ptr', `中点 mid = (${lo}+${hi})/2 = ${mid}`, { s: 'mid', a: mid, code: 3 }))
    out.push(st('compare', `先看中点：k=${k} vs a[mid]=${a[mid]}`, { a: mid, b: -1, w: k, code: 4 }))
    if (k === a[mid]) {
      out.push(st('mark', `相等，命中！返回 mid=${mid}`, { a: mid, w: 2, code: 4 }))
      out.push(st('message', `只比较了 ${rounds} 次。每轮排除一半，n 个元素最多几轮？推导见下方卡片——n=10⁶ 时也只要约 20 次`))
      return out
    }
    if (k < a[mid]) {
      out.push(st('message', `${k} < ${a[mid]}：数组有序，所以右半段 [${mid} .. ${hi}] 整段都不可能——直接排除！high 收到 mid-1=${mid - 1}`, { code: 5 }))
      hi = mid - 1
    } else {
      out.push(st('message', `${k} > ${a[mid]}：左半段 [${lo} .. ${mid}] 整段排除！low 提到 mid+1=${mid + 1}`, { code: 6 }))
      lo = mid + 1
    }
  }
  out.push(st('range', '区间标记收起', { a: -1, fast: true }))
  out.push(st('message', `low=${lo} 超过 high=${hi}：区间空了，${k} 不存在，返回 -1。比较了 ${rounds} 轮就敢下结论`, { code: 8 }))
  return out
}

// ===================== 哈希 =====================

export const CODE_HASH = [
  '// 哈希函数：除留余数法；冲突处理：线性探测',
  'h = k % m;',
  'while (HT[h] != NULLKEY)      // 槽位被占：冲突',
  '    h = (h + 1) % m;          // 线性探测下一格',
  'HT[h] = k;                    // 放入空槽',
]

export function hashInsertTrace(p: { m: number; keys: number[] }): Step[] {
  const m = p.m
  const out: Step[] = []
  const tab: (number | null)[] = Array(m).fill(null)
  let probeTotal = 0
  out.push(st('view', `哈希表：h(k) = k % ${m}，线性探测处理冲突`, { w: 7 }))
  for (let i = 0; i < m; i++) out.push(st('initArray', `槽位 ${i} 置空`, { a: i, w: -1, fast: true }))
  out.push(st('message', `表长 m=${m}，要插入 ${p.keys.join('、')}。每个关键字先算 h(k) 看"家"在哪；家被占了就顺次敲下一家的门——这叫线性探测`, { code: 0 }))
  for (const k of p.keys) {
    let h = k % m
    let probes = 0
    out.push(st('highlight', `插入 ${k}：h = ${k} % ${m} = ${h}，先看槽位 ${h}`, { a: h, code: 1 }))
    out.push(st('range', '涂色的是这次探测走过的路径', { a: h, b: h, fast: true }))
    while (tab[h] !== null) {
      probes++
      probeTotal++
      out.push(st('compare', `槽位 ${h} 已经被 ${tab[h]} 住了：冲突！`, { a: h, b: -1, w: k, code: 2 }))
      h = (h + 1) % m
      out.push(st('highlight', `敲下一家的门：h = ${h}`, { a: h, code: 3 }))
      out.push(st('range', '探测路径跟着延长', { a: k % m, b: h, fast: true }))
    }
    tab[h] = k
    out.push(st('setValue', `槽位 ${h} 空着：${k} 入住${probes ? `（敲了 ${probes + 1} 次门才住下）` : '（一次命中，直奔家门）'}`, { a: h, w: k, code: 4 }))
    out.push(st('range', '区间标记收起', { a: -1, fast: true }))
  }
  out.push(st('message', `全部入住：装填因子 α = ${p.keys.length}/${m} ≈ ${(p.keys.length / m).toFixed(2)}，本次共多敲了 ${probeTotal} 次门。α 越接近 1 冲突越频繁——查找走同样的敲门路线，推导见下方卡片`))
  return out
}
