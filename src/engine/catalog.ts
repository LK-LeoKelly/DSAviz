// catalog.ts —— 算法图鉴：所有可视化算法的注册表
// 每个算法 = 元信息 + 参数说明 + C 源码 + 事件流生成器 + 复杂度推导（derive）
// derive 的原则：不甩结论，用 2~4 句话把"这个复杂度是怎么算出来的"讲清楚。

import type { Step, ViewKind } from './steps'
import {
  listInsertTrace, listDeleteTrace, listGetTrace, listBuildHeadTrace, listBuildTailTrace, LIST_CODE,
} from './algos/linkedList'
import {
  stackOpsTrace, bracketTrace, baseConvertTrace, queueOpsTrace, cqueueTrace,
  CODE_STACK, CODE_BRACKET, CODE_BASE, CODE_QUEUE, CODE_CQUEUE,
} from './algos/stackQueue'
import {
  treeTraverseTrace, bstBuildTrace, bstSearchTrace,
  CODE_PRE, CODE_IN, CODE_POST, CODE_BST_INSERT, CODE_BST_SEARCH,
} from './algos/tree'
import { heapBuildTrace, heapSortTrace, CODE_HEAP_BUILD, CODE_HEAP_SORT } from './algos/heap'
import {
  bubbleSortTrace, selectSortTrace, insertSortTrace, quickSortTrace, mergeSortTrace,
  seqSearchTrace, binSearchTrace, hashInsertTrace,
  CODE_BUBBLE, CODE_SELECT, CODE_INSERT_SORT, CODE_QUICK, CODE_MERGE,
  CODE_SEQ_SEARCH, CODE_BIN_SEARCH, CODE_HASH,
} from './algos/arrayAlgos'

export interface ParamSpec {
  key: string
  label: string
  kind: 'array' | 'number' | 'text' | 'select'
  def: unknown
  min?: number
  max?: number
  hint?: string
}

export interface AlgoDef {
  id: string
  title: string
  category: string
  view: ViewKind
  summary: string
  complexity: string
  derive: string        // 复杂度推导：这个量级是怎么算出来的
  codeTitle: string
  code: string[]
  defaultParams: Record<string, unknown>
  paramsSpec: ParamSpec[]
  run: (p: any) => Step[]
}

const LIST_ARR: ParamSpec = { key: 'list', label: '链表元素', kind: 'array', def: [3, 7, 5, 9, 12], hint: '逗号分隔，2~7 个' }
const SORT_ARR: ParamSpec = { key: 'arr', label: '待排序数组', kind: 'array', def: [6, 2, 8, 1, 9, 4, 7], hint: '逗号分隔，4~9 个' }

const TRAVERSE_DERIVE = '每个结点恰好被"经过"3 次：刚到达、从左孩子回来、从右孩子回来，每次经过只做 O(1) 的事。3n 次 O(1) 加起来还是 O(n)。空间开销看递归栈最深能到多深——最深就是树高 h，所以 O(h)。'
const BST_SEARCH_DERIVE = '每比较一次，就排除掉一整棵子树，所以比较次数 = 目标所在的层数，最多 = 树高 h。树形匀称时 h ≈ log₂n，于是 O(log n)；但如果插入的关键字本身有序，树会退化成一条链，h = n，查找就退回 O(n)。结论：BST 的效率不由算法决定，由树形决定。'

export const ALGOS: AlgoDef[] = [
  // ---------- 线性表 ----------
  {
    id: 'list-build-head', title: '头插法建表', category: '线性表', view: 'list',
    summary: '每个新结点都插到头结点之后，表序与输入相反',
    complexity: '时间 O(n) · 空间 O(1) 辅助',
    derive: '建表要读 n 个元素；每个元素只做"接住首元、头结点改指"两条指针的 O(1) 接入。n 个 O(1) 累加 = O(n)。全程只多用 s 一个指针变量，所以辅助空间 O(1)。',
    codeTitle: 'CreateListF.c', code: LIST_CODE.buildHead,
    defaultParams: { list: [1, 2, 3, 4] }, paramsSpec: [LIST_ARR],
    run: listBuildHeadTrace,
  },
  {
    id: 'list-build-tail', title: '尾插法建表', category: '线性表', view: 'list',
    summary: '尾指针 r 始终指向表尾，表序与输入一致',
    complexity: '时间 O(n) · 空间 O(1) 辅助',
    derive: '多维护一个尾指针 r，换来每个元素"接上、r 后移"两步 O(1) 就完成尾部接入；没有 r 的话每次都要从头走到尾，那就成 O(n²) 了。n 个 O(1) = O(n)，额外空间只有 r 和 s，O(1)。',
    codeTitle: 'CreateListR.c', code: LIST_CODE.buildTail,
    defaultParams: { list: [1, 2, 3, 4] }, paramsSpec: [LIST_ARR],
    run: listBuildTailTrace,
  },
  {
    id: 'list-insert', title: '单链表按位插入', category: '线性表', view: 'list',
    summary: 's->next = p->next; p->next = s —— 两条指针，顺序不能反',
    complexity: '查找 O(n) · 插入 O(1)',
    derive: '拆成两段算账：找到第 i-1 个结点要从头走 i-1 步，i 等概率时平均约 n/2 步，所以"定位"是 O(n)；定位之后的插入只改 2 条指针，固定动作没有循环，O(1)。总账 O(n) + O(1)，大头在查找。',
    codeTitle: 'ListInsert.c', code: LIST_CODE.insert,
    defaultParams: { list: [3, 7, 5, 9], pos: 2, val: 6 },
    paramsSpec: [LIST_ARR,
      { key: 'pos', label: '插入位序 i（1 起）', kind: 'number', def: 2, min: 1, max: 6 },
      { key: 'val', label: '插入值 e', kind: 'number', def: 6, min: 0, max: 99 }],
    run: listInsertTrace,
  },
  {
    id: 'list-delete', title: '单链表按值删除', category: '线性表', view: 'list',
    summary: 'q = p->next; p->next = q->next; free(q) —— 先断链再释放',
    complexity: '查找 O(n) · 删除 O(1)',
    derive: '同样拆两段：按值找前驱要顺链扫描，平均 n/2 步 → O(n)；找到之后断链 + free 都是固定几条语句 → O(1)。合计 O(n)。注意 free 本身也是 O(1)，真正贵的是"找到它"。',
    codeTitle: 'ListDelete.c', code: LIST_CODE.delete,
    defaultParams: { list: [3, 7, 5, 9], val: 5 },
    paramsSpec: [LIST_ARR, { key: 'val', label: '删除值 e', kind: 'number', def: 5, min: 0, max: 99 }],
    run: listDeleteTrace,
  },
  {
    id: 'list-get', title: '单链表按位查找', category: '线性表', view: 'list',
    summary: '链表没有随机存取，只能从首元顺链扫描',
    complexity: '时间 O(n)',
    derive: '取第 i 个元素必须顺链走 i 步：走 1 步到第 1 个，走 2 步到第 2 个……i 在 1..n 等概率时，平均步数 = (1+2+…+n)/n = (n+1)/2，所以 O(n)。对比顺序表的"按下标一步到位"O(1)，这就是链式存储用灵活性换来的代价。',
    codeTitle: 'GetElem.c', code: LIST_CODE.get,
    defaultParams: { list: [3, 7, 5, 9, 12], pos: 3 },
    paramsSpec: [LIST_ARR, { key: 'pos', label: '位序 i（1 起）', kind: 'number', def: 3, min: 1, max: 6 }],
    run: listGetTrace,
  },
  // ---------- 栈与队列 ----------
  {
    id: 'stack-ops', title: '栈的进与出', category: '栈与队列', view: 'stack',
    summary: '后进先出：只能在栈顶一端插入和删除',
    complexity: 'Push / Pop 均 O(1)',
    derive: 'Push 只做"top+1、写入一格"两件事，Pop 只做"读一格、top-1"两件事——没有任何循环，操作数与栈里有多少元素完全无关，所以都是 O(1)。这正是"限定只在栈顶操作"换来的效率。',
    codeTitle: 'SqStack.c', code: CODE_STACK,
    defaultParams: { items: [5, 8, 3] }, paramsSpec: [{ key: 'items', label: '依次入栈的元素', kind: 'array', def: [5, 8, 3], hint: '最多 5 个' }],
    run: stackOpsTrace,
  },
  {
    id: 'stack-brackets', title: '括号匹配', category: '栈与队列', view: 'stack',
    summary: '编译器检查括号的方法：左括号入栈，右括号与栈顶配对',
    complexity: '时间 O(n)',
    derive: '表达式共 n 个字符，每个字符只被扫描一次；每个左括号最多入栈一次、出栈一次，Push/Pop 都是 O(1)。全部操作加起来 ≤ 2n 次 O(1)，所以 O(n)。',
    codeTitle: 'BracketMatch.c', code: CODE_BRACKET,
    defaultParams: { expr: '{[()()]}' }, paramsSpec: [{ key: 'expr', label: '表达式', kind: 'text', def: '{[()()]}', hint: '只含 ()[]{}' }],
    run: bracketTrace,
  },
  {
    id: 'stack-base', title: '进制转换（除基取余）', category: '栈与队列', view: 'stack',
    summary: '余数先入栈、后出栈——栈的反序天性',
    complexity: '时间 O(log n)',
    derive: '每做一轮"除 base 取余"，N 至少缩小 base 倍：N → N/base → N/base² → … 直到 0。能除几轮？恰好 log_base(N) 轮——这就是 b 进制数的位数。出栈轮数与入栈相同，每轮 O(1)，合计 O(log n)。',
    codeTitle: 'Conversion.c', code: CODE_BASE,
    defaultParams: { num: 1348, base: 8 }, paramsSpec: [
      { key: 'num', label: '十进制数 N', kind: 'number', def: 1348, min: 0, max: 65535 },
      { key: 'base', label: '目标进制', kind: 'number', def: 8, min: 2, max: 16 }],
    run: baseConvertTrace,
  },
  {
    id: 'queue-ops', title: '顺序队列', category: '栈与队列', view: 'queue',
    summary: '先进先出：队尾进、队头出，以及"假溢出"问题',
    complexity: '入队 / 出队均 O(1)',
    derive: '入队 = 写 data[rear] + rear 后移一格；出队 = 读 data[front] + front 后移一格。两头都只做固定几步，与队长无关，所以 O(1)。对比一下：如果出队后要把所有人往前挪一格，那就是 O(n) 了——双指针设计正是为了避开这个搬移。',
    codeTitle: 'SqQueue.c', code: CODE_QUEUE,
    defaultParams: { items: [10, 20, 30, 40] }, paramsSpec: [{ key: 'items', label: '依次入队的元素', kind: 'array', def: [10, 20, 30, 40], hint: '最多 5 个' }],
    run: queueOpsTrace,
  },
  {
    id: 'cqueue', title: '循环队列', category: '栈与队列', view: 'cqueue',
    summary: '首尾相接取模环绕，牺牲一个单元判满',
    complexity: '入队 / 出队均 O(1)',
    derive: '"环绕"不靠搬数据，只靠一句 rear = (rear+1) % m——取模是 O(1)，所以出入队依然是 O(1)。空间上付出一个空闲单元，换来 (rear+1)%m == front 这条 O(1) 的判满规则；不牺牲的话，就得另存 count 或标志位，本质都是拿一点信息换区分度。',
    codeTitle: 'SqQueue.circular.c', code: CODE_CQUEUE,
    defaultParams: {}, paramsSpec: [],
    run: () => cqueueTrace(),
  },
  // ---------- 树与二叉树 ----------
  ...([0, 1, 2] as const).map((kind) => ({
    id: ['tree-pre', 'tree-in', 'tree-post'][kind],
    title: `${['先序', '中序', '后序'][kind]}遍历`,
    category: '树与二叉树', view: 'tree' as ViewKind,
    summary: `口诀：${['根→左→右', '左→根→右', '左→右→根'][kind]}；三次经过理论`,
    complexity: '时间 O(n) · 递归栈 O(h)',
    derive: TRAVERSE_DERIVE,
    codeTitle: `${['PreOrder', 'InOrder', 'PostOrder'][kind]}.c`,
    code: [CODE_PRE, CODE_IN, CODE_POST][kind],
    defaultParams: { level: [1, 2, 3, 4, 5, 6, 7], kind },
    paramsSpec: [{ key: 'level', label: '层序序列（完全二叉树）', kind: 'array' as const, def: [1, 2, 3, 4, 5, 6, 7], hint: '最多 7 个' }],
    run: (p: any) => treeTraverseTrace({ level: (p.level as (number | null)[]).slice(0, 7), kind }),
  })),
  {
    id: 'bst-build', title: 'BST 建树', category: '树与二叉树', view: 'tree',
    summary: '小走左、大走右、相等不插；中序遍历即有序',
    complexity: '平均 O(n log n) · 最坏 O(n²)',
    derive: '插入第 k 个结点，比较次数 ≤ 当时的树高。树形匀称时树高 ≈ log₂k，总代价 ≈ Σ_{k=1..n} log₂k ≈ n·log₂n，所以平均 O(n log n)。但如果关键字本身就有序，每次都挂在最右端，树退化成链：1+2+…+n = n(n+1)/2，最坏 O(n²)。',
    codeTitle: 'InsertBST.c', code: CODE_BST_INSERT,
    defaultParams: { keys: [45, 24, 53, 12, 37, 28] }, paramsSpec: [{ key: 'keys', label: '依次插入的关键字', kind: 'array', def: [45, 24, 53, 12, 37, 28], hint: '2~8 个' }],
    run: bstBuildTrace,
  },
  {
    id: 'bst-search', title: 'BST 查找', category: '树与二叉树', view: 'tree',
    summary: '每比较一次排除一棵子树，查找长度 = 结点层数',
    complexity: '平均 O(log n) · 最坏 O(n)',
    derive: BST_SEARCH_DERIVE,
    codeTitle: 'SearchBST.c', code: CODE_BST_SEARCH,
    defaultParams: { keys: [45, 24, 53, 12, 37, 28], key: 37 },
    paramsSpec: [{ key: 'keys', label: '建树关键字', kind: 'array', def: [45, 24, 53, 12, 37, 28] },
      { key: 'key', label: '查找目标', kind: 'number', def: 37, min: 0, max: 99 }],
    run: bstSearchTrace,
  },
  // ---------- 堆 ----------
  {
    id: 'heap-build', title: '堆的插入（向上调整）', category: '堆与优先队列', view: 'heap',
    summary: '新元素放末尾，比父大就交换上浮',
    complexity: '单次插入 O(log n) · 建堆 O(n log n)',
    derive: '第 k 个元素上浮，每层跟父结点比一次，最多浮到根——路径长 = 当时的树高 ≈ log₂k，所以单次插入 O(log n)。n 个元素依次插入的总比较 ≤ Σ_{k=1..n} log₂k ≈ n·log₂n，即插入法建堆 O(n log n)。（彩蛋：堆排序里的"下沉法"建堆只要 O(n)，去那一节看为什么。）',
    codeTitle: 'HeapInsert.c', code: CODE_HEAP_BUILD,
    defaultParams: { keys: [20, 15, 30, 10, 25, 40] }, paramsSpec: [{ key: 'keys', label: '依次插入的元素', kind: 'array', def: [20, 15, 30, 10, 25, 40], hint: '2~7 个' }],
    run: heapBuildTrace,
  },
  {
    id: 'heap-sort', title: '堆排序', category: '堆与优先队列', view: 'heap',
    summary: '建大顶堆 → 堆顶与末尾交换 → 剩余重新调整',
    complexity: 'O(n log n) · 原地 · 不稳定',
    derive: '两笔账。① 下沉法建堆：约一半结点（叶子）下沉 0 层，1/4 的结点最多沉 1 层，1/8 最多 2 层……总代价 ≤ n·(1/4·1 + 1/8·2 + 1/16·3 + …)，错位相减可证这个级数收敛到 O(n)——比逐个插入建堆还快。② 之后 n-1 次取堆顶，每次新堆顶最多下沉 log₂n 层，合计 O(n log n)。交换都在原数组里进行，所以空间 O(1)；但"堆顶换末尾"可能把相等元素的先后翻乱，所以不稳定。',
    codeTitle: 'HeapSort.c', code: CODE_HEAP_SORT,
    defaultParams: { keys: [9, 3, 7, 1, 8, 2, 6] }, paramsSpec: [{ key: 'keys', label: '待排序数组', kind: 'array', def: [9, 3, 7, 1, 8, 2, 6], hint: '4~7 个' }],
    run: heapSortTrace,
  },
  // ---------- 查找 ----------
  {
    id: 'search-seq', title: '顺序查找', category: '查找', view: 'array',
    summary: '从头到尾逐个比对，数组无需有序',
    complexity: 'O(n) · ASL=(n+1)/2',
    derive: '找第 1 个元素比较 1 次，找第 2 个比较 2 次……找第 i 个比较 i 次。目标等概率落在每个位置时，平均比较次数 ASL = (1+2+…+n)/n = (n+1)/2，所以 O(n)。它不要求数据有序，这是用速度换来的通用性。',
    codeTitle: 'SeqSearch.c', code: CODE_SEQ_SEARCH,
    defaultParams: { arr: [6, 2, 8, 1, 9, 4], key: 1 },
    paramsSpec: [{ key: 'arr', label: '查找表', kind: 'array', def: [6, 2, 8, 1, 9, 4] },
      { key: 'key', label: '查找目标', kind: 'number', def: 1, min: 0, max: 99 }],
    run: seqSearchTrace,
  },
  {
    id: 'search-bin', title: '折半查找', category: '查找', view: 'array',
    summary: '前提是有序；每比较一次，区间减半',
    complexity: 'O(log n)',
    derive: '每比较一次，搜索区间长度减半：n → n/2 → n/4 → … → 1。问"要除几次才到 1"，答案就是 log₂n——所以最多约 ⌈log₂(n+1)⌉ 次比较，O(log n)。感受下量级：n=10⁶ 时也只要约 20 次。代价是数组必须事先有序，排序的成本要算在账外。',
    codeTitle: 'BinSearch.c', code: CODE_BIN_SEARCH,
    defaultParams: { arr: [1, 3, 5, 7, 9, 11, 13, 15], key: 9 },
    paramsSpec: [{ key: 'arr', label: '有序数组（会自动排序）', kind: 'array', def: [1, 3, 5, 7, 9, 11, 13, 15] },
      { key: 'key', label: '查找目标', kind: 'number', def: 9, min: 0, max: 99 }],
    run: binSearchTrace,
  },
  {
    id: 'hash-insert', title: '哈希表（线性探测）', category: '查找', view: 'hash',
    summary: 'h(k)=k%m；冲突时顺次探测下一格',
    complexity: '平均 O(1) · 最坏 O(n)',
    derive: '不冲突时算一次 h(k) 直接到位，O(1)。装填因子 α = 已存个数/表长 越大，"家被占"的概率越高：线性探测成功查找平均约 (1 + 1/(1-α))/2 次——α=0.5 时约 1.5 次，α=0.9 时就涨到 5.5 次，α→1 急剧恶化。所以哈希表一定要留余量，这就是为什么负载因子一高就要扩容。',
    codeTitle: 'HashInsert.c', code: CODE_HASH,
    defaultParams: { m: 7, keys: [14, 8, 21, 15, 7] },
    paramsSpec: [{ key: 'm', label: '表长 m', kind: 'number', def: 7, min: 5, max: 11 },
      { key: 'keys', label: '插入关键字', kind: 'array', def: [14, 8, 21, 15, 7], hint: '不超过表长-1 个' }],
    run: hashInsertTrace,
  },
  // ---------- 排序 ----------
  {
    id: 'sort-bubble', title: '冒泡排序', category: '排序', view: 'array',
    summary: '相邻比较交换，每趟最大值冒到末尾；无交换提前结束',
    complexity: 'O(n²) · 稳定 · 最好 O(n)',
    derive: '第 1 趟比较 n-1 次，第 2 趟 n-2 次……最后一趟 1 次，合计 (n-1)+(n-2)+…+1 = n(n-1)/2 次——等差数列求和，平方项说了算，所以 O(n²)。但注意 flag：若一整趟零交换说明已有序，直接收工，所以最好情况（本就有序）只扫一趟 = O(n)。相邻交换不跨元素，相等元素不会被翻乱，所以稳定。',
    codeTitle: 'BubbleSort.c', code: CODE_BUBBLE,
    defaultParams: { arr: [6, 2, 8, 1, 9, 4] }, paramsSpec: [SORT_ARR],
    run: bubbleSortTrace,
  },
  {
    id: 'sort-select', title: '选择排序', category: '排序', view: 'array',
    summary: '每趟选出最小值与前面交换，交换次数最少',
    complexity: 'O(n²) · 不稳定 · 交换 ≤ n-1 次',
    derive: '无论数组初态如何，第 i 趟都要在剩下的 n-i 个元素里把最小值找完，比较次数恒为 (n-1)+(n-2)+…+1 = n(n-1)/2 → O(n²)，连 flag 都没法救它。但交换每趟最多 1 次，总共 ≤ n-1 次——"比较贵、交换省"，适合写入代价高的存储介质。交换是跨位置的，可能把相等元素翻乱，所以不稳定。',
    codeTitle: 'SelectSort.c', code: CODE_SELECT,
    defaultParams: { arr: [6, 2, 8, 1, 9, 4] }, paramsSpec: [SORT_ARR],
    run: selectSortTrace,
  },
  {
    id: 'sort-insert', title: '直接插入排序', category: '排序', view: 'array',
    summary: '像整理扑克牌：新牌插入已排好的部分',
    complexity: 'O(n²) · 稳定 · 基本有序时近 O(n)',
    derive: '第 i 张牌最多要跟有序区比 i 次、后移 i 格。最坏情况（数组逆序）：Σ_{i=1..n-1} i = n(n-1)/2 次比较加同样多的移动 → O(n²)。最好情况（基本有序）：每张牌比 1 次就发现不用动 → O(n)。它跟冒泡同是 O(n²)，但常数更小、对近乎有序的数据极敏感，所以实用排序常拿它处理小段。',
    codeTitle: 'InsertSort.c', code: CODE_INSERT_SORT,
    defaultParams: { arr: [6, 2, 8, 1, 9, 4] }, paramsSpec: [SORT_ARR],
    run: insertSortTrace,
  },
  {
    id: 'sort-quick', title: '快速排序', category: '排序', view: 'array',
    summary: '基准归位 + 分治：左边都更小，右边都更大',
    complexity: '平均 O(n log n) · 最坏 O(n²) · 不稳定',
    derive: '把每次划分想成画一棵递归树：不管怎么分，同一层所有子段的划分加起来恰好扫过 n 个元素 = 每层 O(n)。基准每次都能把数组均分 → 树高 log₂n → O(n log n)，这就是平均情况（随机数据下大概率如此）。但如果数组已有序又总取端点当基准，每次只比出一个元素的位置，树高变 n → O(n²)。工程对策：随机选基准或三数取中。',
    codeTitle: 'QuickSort.c', code: CODE_QUICK,
    defaultParams: { arr: [6, 2, 8, 1, 9, 4, 3] }, paramsSpec: [SORT_ARR],
    run: quickSortTrace,
  },
  {
    id: 'sort-merge', title: '归并排序', category: '排序', view: 'array',
    summary: '递归分半，再合并两个有序段（双指针取小者）',
    complexity: 'O(n log n) · 稳定 · 需 O(n) 辅助空间',
    derive: '递归树每一层的所有合并加起来，每个元素恰好进出一次 tmp = 每层 O(n)；数组对半切，只能切 log₂n 层就到底——总代价 = 每层 O(n) × log₂n 层 = O(n log n)，而且与数组初态完全无关，这就是它的"稳"。代价明摆着：那个始终存在的 tmp 数组，O(n) 辅助空间。合并时相等元素取左边的先放，先后不变，所以稳定。',
    codeTitle: 'MergeSort.c', code: CODE_MERGE,
    defaultParams: { arr: [6, 2, 8, 1, 9, 4, 3] }, paramsSpec: [SORT_ARR],
    run: mergeSortTrace,
  },
]

export const ALGO_MAP: Record<string, AlgoDef> = Object.fromEntries(ALGOS.map((a) => [a.id, a]))

export const CATEGORIES = ['线性表', '栈与队列', '树与二叉树', '堆与优先队列', '查找', '排序']
