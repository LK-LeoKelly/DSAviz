// chapters.ts —— 学习路径：章节 → 课 →（概念 + 演示 + 要点 + 小测）
// 结构对齐高校《数据结构》课程主线：线性表 → 栈队列 → 树 → 堆 → 查找 → 排序

export interface Quiz {
  q: string
  options: string[]
  answer: number
  explain: string
}

export interface Lesson {
  id: string
  title: string
  algoId: string
  params?: Record<string, unknown>
  minutes: number
  concept: string[]
  keyPoints: string[]
  quiz: Quiz[]
}

export interface Chapter {
  id: string
  title: string
  desc: string
  lessons: Lesson[]
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'ch-list', title: '线性表与链表', desc: '从"连续存储"到"指针链接"：理解带头结点单链表的每一句 C 代码',
    lessons: [
      {
        id: 'l-list-build-head', title: '头插法建表', algoId: 'list-build-head', minutes: 6,
        concept: [
          '单链表由一个个结点串成：每个结点 = 数据域 + 指针域。头结点是表头的一个"空结点"，不存数据，只为让所有位置的操作统一。',
          '头插法：每读入一个新元素，就让它插到头结点之后、原首元之前。于是先输入的元素反而在表的后面。',
        ],
        keyPoints: ['核心两句：s->next = L->next;  L->next = s;', '表序与输入相反', '时间复杂度 O(n)'],
        quiz: [{
          q: '用头插法依次读入 1、2、3，建成的链表（从头结点后开始）是？',
          options: ['1 → 2 → 3', '3 → 2 → 1', '2 → 1 → 3', '取决于内存分配'],
          answer: 1,
          explain: '每个新结点都抢在首元之前：1 进来后 2 插到 1 前面，3 再插到 2 前面，所以是 3 → 2 → 1。',
        }],
      },
      {
        id: 'l-list-build-tail', title: '尾插法建表', algoId: 'list-build-tail', minutes: 6,
        concept: [
          '尾插法用多一个指针 r 始终指向表尾：新结点接在 r 之后，然后 r 后移。',
          '对比头插法：表序与输入一致，代价是多维护一个尾指针。',
        ],
        keyPoints: ['r->next = s;  r = s;', '表序与输入一致', '尾指针是"用空间换便利"的典型'],
        quiz: [{
          q: '尾插法中，指针 r 的作用是？',
          options: ['指向头结点', '始终指向表尾，避免每次从头找尾', '记录链表长度', '指向新结点'],
          answer: 1,
          explain: '没有 r 的话每次插入都要从头遍历到表尾 O(n)；有了 r，每次接入 O(1)。',
        }],
      },
      {
        id: 'l-list-insert', title: '按位插入：两条指针的顺序', algoId: 'list-insert', minutes: 8,
        concept: [
          '在第 i 个位置之前插入，先要找到第 i-1 个结点 p（前驱）。带头结点的好处：i=1 时前驱就是头结点，无需特判。',
          '插入只有两句：s->next = p->next; p->next = s。但顺序绝对不能反——先让 s 接住后继，再让 p 指向 s。反了，p 之后的整条链就永远丢了。',
        ],
        keyPoints: ['找前驱：p 从 L 出发走 i-1 步', '① s->next = p->next  ② p->next = s', '带头结点：表头/表中/表尾同一段代码'],
        quiz: [{
          q: '若把两句写成 p->next = s; s->next = p->next; 会发生什么？',
          options: ['正常插入', 's->next 指向自己，链表在此处成环，后继结点全部丢失', '编译报错', '只是顺序显示不同'],
          answer: 1,
          explain: 'p->next 先被改成 s 后，p->next 再也不是原来的后继了——s->next = p->next 变成 s 指向自己，链断裂成环。',
        }],
      },
      {
        id: 'l-list-delete', title: '按值删除与 free', algoId: 'list-delete', minutes: 8,
        concept: [
          '删除需要两个指针配合：p 停在待删结点的前驱，q 指向待删结点。',
          '三步：q = p->next; p->next = q->next; free(q)。先断链、再释放——C 语言没有垃圾回收，漏掉 free 就是内存泄漏。',
        ],
        keyPoints: ['p 是前驱，q 是待删', '先 p->next = q->next，再 free(q)', '删除是 O(1)，找到它是 O(n)'],
        quiz: [{
          q: '删除结点时为什么必须 free(q)？',
          options: ['为了让指针失效', 'C 语言需要手动释放堆内存，否则内存泄漏', '为了让链表长度正确', 'free 会自动接好指针'],
          answer: 1,
          explain: '结点由 malloc 在堆上分配，断链后它仍存在但已无法访问——不 free 就永远占用内存。',
        }],
      },
      {
        id: 'l-list-get', title: '按位查找：链表的代价', algoId: 'list-get', minutes: 5,
        concept: [
          '顺序表按下标 O(1) 直达，链表却只能从首元结点开始顺链扫描——指针结构换来了插入删除的灵活，付出了随机存取的代价。',
        ],
        keyPoints: ['p = L->next; j = 1', 'while (p && j < i) 后移', '平均时间 O(n)'],
        quiz: [{
          q: '单链表取第 i 个元素的时间复杂度是？',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
          answer: 2,
          explain: '链表没有随机存取，只能顺链扫描，平均要走过一半结点。',
        }],
      },
    ],
  },
  {
    id: 'ch-stack-queue', title: '栈与队列', desc: '两种"受限"的线性表：一个后进先出，一个先进先出',
    lessons: [
      {
        id: 'l-stack-ops', title: '栈：后进先出', algoId: 'stack-ops', minutes: 5,
        concept: ['栈只能在一端（栈顶）插入和删除。top 指针指向栈顶元素：Push 先加后压，Pop 先取后减。'],
        keyPoints: ['LIFO：Last In First Out', 'top 指向栈顶', 'Push/Pop 均 O(1)'],
        quiz: [{
          q: '依次 Push 1、2、3，再 Pop 一次，出栈的是？',
          options: ['1', '2', '3', '都有可能'],
          answer: 2,
          explain: '后进先出：最后进来的 3 最先出栈。',
        }],
      },
      {
        id: 'l-stack-brackets', title: '应用：括号匹配', algoId: 'stack-brackets', minutes: 7,
        concept: [
          '编译器检查括号配对用的就是栈：左括号入栈，右括号来了就与栈顶比较——配对则出栈，否则报错。',
          '栈顶天然就是"最近一个还没配对的左括号"，这正是匹配所需要的。',
        ],
        keyPoints: ['左括号入栈', '右括号与栈顶配对', '扫描结束时栈必须为空'],
        quiz: [{
          q: '表达式 "{[()]}" 扫描到第一个 "]" 时，栈顶是？',
          options: ['{', '[', '(', ')'],
          answer: 1,
          explain: '"(" 在 "]" 之前已经与 ")" 配对出栈，此时栈里剩 { 和 [，栈顶是 [，与 ] 配对成功。',
        }],
      },
      {
        id: 'l-stack-base', title: '应用：进制转换', algoId: 'stack-base', minutes: 6,
        concept: ['除基取余法先算出的是低位、后算出的是高位，而输出要先高位——栈的反序天性正好解决这个矛盾。'],
        keyPoints: ['余数入栈', '出栈即得高位在前的结果', '1348 转八进制 = 2504'],
        quiz: [{
          q: '把 10 转成二进制，出栈序列是？',
          options: ['0101', '1010', '1100', '0011'],
          answer: 1,
          explain: '10÷2=5 余 0，5÷2=2 余 1，2÷2=1 余 0，1÷2=0 余 1；出栈顺序 1、0、1、0，即 1010。',
        }],
      },
      {
        id: 'l-queue-ops', title: '队列：先进先出', algoId: 'queue-ops', minutes: 5,
        concept: ['队列在一端（队尾）插入，另一端（队头）删除。front 指队头、rear 指队尾的下一个位置。顺序队列反复出队会有"假溢出"。'],
        keyPoints: ['FIFO：First In First Out', 'front/rear 双指针', '假溢出 → 循环队列'],
        quiz: [{
          q: '顺序队列的"假溢出"是指？',
          options: ['数组真的满了', '数组前面有空位却因 rear 到顶而无法入队', 'front 越过 rear', '元素被覆盖'],
          answer: 1,
          explain: '出队后 front 前面空出的单元无法再利用，rear 到顶就"假装"满了——循环队列用取模解决。',
        }],
      },
      {
        id: 'l-cqueue', title: '循环队列', algoId: 'cqueue', minutes: 7,
        concept: [
          '把数组首尾相接：指针按模 MAXSIZE 环绕，假溢出消失。',
          '难点是判满：front == rear 时分不清空和满。教材方案：牺牲一个单元，(rear+1)%MAXSIZE == front 即满。',
        ],
        keyPoints: ['取模环绕', '牺牲一个单元判满', '元素个数 = (rear − front + MAX) % MAX'],
        quiz: [{
          q: '循环队列为什么要牺牲一个存储单元？',
          options: ['为了存放哨兵', '否则 front==rear 无法区分队空与队满', '为了提高速度', '为了对齐内存'],
          answer: 1,
          explain: '空和满时 front 都等于 rear。少用一个单元后，"差一格追平"就是满，"正好相等"就是空。',
        }],
      },
    ],
  },
  {
    id: 'ch-tree', title: '树与二叉树', desc: '从递归定义到递归遍历：看懂每个结点被"经过三次"',
    lessons: [
      {
        id: 'l-tree-pre', title: '先序遍历', algoId: 'tree-pre', minutes: 7,
        concept: [
          '递归遍历的实质：每个结点都会被经过三次——到达时、从左子树回来时、从右子树回来时。',
          '先序 = 第 1 次经过就输出：根 → 左 → 右。',
        ],
        keyPoints: ['口诀：根左右', '递归 = 系统栈在帮你记住来路', '每个结点恰好输出一次'],
        quiz: [{
          q: '对根为 1、左孩子 2、右孩子 3 的树做先序遍历，输出是？',
          options: ['2 1 3', '1 2 3', '2 3 1', '3 2 1'],
          answer: 1,
          explain: '根 → 左 → 右：先输出 1，再左子树的 2，最后右子树的 3。',
        }],
      },
      {
        id: 'l-tree-in', title: '中序遍历', algoId: 'tree-in', minutes: 7,
        concept: ['中序 = 第 2 次经过（左子树回来）时输出：左 → 根 → 右。对二叉排序树做中序遍历，恰好得到有序序列。'],
        keyPoints: ['口诀：左根右', 'BST 中序 = 有序序列'],
        quiz: [{
          q: '中序遍历在"第几次经过"结点时输出？',
          options: ['第 1 次', '第 2 次', '第 3 次', '随机'],
          answer: 1,
          explain: '中序在左子树返回后、进入右子树前输出，即第 2 次经过。',
        }],
      },
      {
        id: 'l-tree-post', title: '后序遍历', algoId: 'tree-post', minutes: 6,
        concept: ['后序 = 第 3 次经过（右子树回来）时输出：左 → 右 → 根。适合"先处理子结点再处理父结点"的场景，如释放整棵树。'],
        keyPoints: ['口诀：左右根', '销毁树必须用后序'],
        quiz: [{
          q: '要 free 掉整棵二叉树的所有结点，应该用哪种遍历？',
          options: ['先序', '中序', '后序', '层序'],
          answer: 2,
          explain: '必须先释放左右子树，再释放根——否则根的子指针先没了，子树就再也找不到了。',
        }],
      },
      {
        id: 'l-bst-build', title: '二叉排序树：建树', algoId: 'bst-build', minutes: 8,
        concept: [
          'BST 的递归规则：比当前结点小走左子树，大走右子树，相等不插入。',
          '同一组关键字，插入顺序不同，树的形状不同——这决定了查找效率。',
        ],
        keyPoints: ['小左大右，相等不插', '新结点一定是叶子', '形状取决于插入顺序'],
        quiz: [{
          q: '依次插入 45、24、53、12，12 最终是 ____ 的左孩子。',
          options: ['45', '24', '53', '12 是根'],
          answer: 1,
          explain: '12 < 45 走左，12 < 24 再走左，24 的左指针为空，12 挂上去。',
        }],
      },
      {
        id: 'l-bst-search', title: 'BST 查找', algoId: 'bst-search', minutes: 6,
        concept: ['查找路径就是从根到目标的一条链：每比较一次，排除一整棵子树。查找长度 = 目标结点所在的层数。'],
        keyPoints: ['每比较一次排除一棵子树', '平均 O(log n)，退化成链时 O(n)'],
        quiz: [{
          q: '在 BST 中查找的最大比较次数等于？',
          options: ['结点数 n', '树的高度', '叶子结点数', 'log₂n 向上取整（任何形状）'],
          answer: 1,
          explain: '最坏沿最深的链走到底，比较次数 = 树高。树越平衡，高度越接近 log₂n。',
        }],
      },
    ],
  },
  {
    id: 'ch-heap', title: '堆与优先队列', desc: '数组里的完全二叉树：父比子大，堆顶即最大',
    lessons: [
      {
        id: 'l-heap-build', title: '堆的插入：向上调整', algoId: 'heap-build', minutes: 7,
        concept: [
          '大顶堆：每个父结点 ≥ 孩子。用数组存完全二叉树：下标 i 的父结点是 (i-1)/2。',
          '插入 = 放末尾 + 向上调整：比父结点大就交换，一路浮到合适位置。',
        ],
        keyPoints: ['父下标 = (i-1)/2', '上浮直到不大于父结点', '单次插入 O(log n)'],
        quiz: [{
          q: '大顶堆中，下标 5 的结点的父结点下标是？',
          options: ['2', '3', '10', '11'],
          answer: 0,
          explain: '(5-1)/2 = 2。完全二叉树的数组表示：父 (i-1)/2，左孩子 2i+1，右孩子 2i+2。',
        }],
      },
      {
        id: 'l-heap-sort', title: '堆排序', algoId: 'heap-sort', minutes: 9,
        concept: [
          '两步：先把数组向下调整成大顶堆；然后反复"堆顶与末尾交换（最大值归位）+ 剩余重新调整"。',
          '向下调整 SiftDown：与孩子中较大者交换，一路沉到底。',
        ],
        keyPoints: ['从最后一个非叶子开始调整', '堆顶 = 最大值', 'O(n log n)，原地，不稳定'],
        quiz: [{
          q: '堆排序每一轮交换后，哪个元素被放到最终位置？',
          options: ['最小值', '当前堆顶（最大值）', '中间值', '最后一个插入的'],
          answer: 1,
          explain: '大顶堆堆顶必是当前最大值，与末尾交换后即归位，有序区从后向前扩大。',
        }],
      },
    ],
  },
  {
    id: 'ch-search', title: '查找', desc: '从 O(n) 到 O(log n) 再到 O(1)：三种查找的思想跃迁',
    lessons: [
      {
        id: 'l-search-seq', title: '顺序查找', algoId: 'search-seq', minutes: 4,
        concept: ['最朴素的查找：从头扫到尾。不要求表有序，代价是平均比较 (n+1)/2 次。'],
        keyPoints: ['无需有序', 'ASL = (n+1)/2'],
        quiz: [{
          q: '顺序查找成功的平均查找长度 ASL 是？',
          options: ['n', '(n+1)/2', 'log₂n', '1'],
          answer: 1,
          explain: '等概率下平均要扫过一半元素：(1+2+…+n)/n = (n+1)/2。',
        }],
      },
      {
        id: 'l-search-bin', title: '折半查找', algoId: 'search-bin', minutes: 7,
        concept: [
          '前提：表有序。每次与区间中点比较，不相等就扔掉一半——区间对半缩减。',
          '盯住 low、high、mid 三个指针：查找区间永远在 [low, high] 内。',
        ],
        keyPoints: ['前提：有序', 'mid = (low+high)/2', 'O(log n)'],
        quiz: [{
          q: '在 1000 个元素的有序表中折半查找，最多比较几次？',
          options: ['约 10 次', '约 50 次', '约 500 次', '1000 次'],
          answer: 0,
          explain: '每比较一次区间减半：2¹⁰ = 1024 ≥ 1000，所以最多约 10 次。',
        }],
      },
      {
        id: 'l-hash', title: '哈希表：用位置换速度', algoId: 'hash-insert', minutes: 8,
        concept: [
          '哈希 = 用函数 h(k) 直接算出存储位置，理想情况下一次到位。',
          '冲突不可避免：两个关键字算到同一格。线性探测：被占就顺次看下一格。',
        ],
        keyPoints: ['h(k) = k % m', '线性探测处理冲突', '装填因子 α 决定冲突概率'],
        quiz: [{
          q: 'm=7，依次插入 14、21，21 会被放到哪个槽位？',
          options: ['0', '1', '2', '冲突无法插入'],
          answer: 1,
          explain: '14%7=0，占槽位 0；21%7=0 冲突，线性探测到槽位 1。',
        }],
      },
    ],
  },
  {
    id: 'ch-sort', title: '内部排序', desc: '五种经典排序同场对比：比较次数、交换次数、稳定性',
    lessons: [
      {
        id: 'l-sort-bubble', title: '冒泡排序', algoId: 'sort-bubble', minutes: 6,
        concept: ['相邻比较、逆序交换：每趟把最大值"冒"到末尾。一整趟无交换说明已有序，可提前结束。'],
        keyPoints: ['相邻交换 ⇒ 稳定', '最好 O(n)（已有序）', '平均 O(n²)'],
        quiz: [{
          q: '冒泡排序是稳定排序，因为它？',
          options: ['交换次数少', '只交换相邻元素，相等元素不会跨过彼此', '每趟只动一个元素', '用到了额外空间'],
          answer: 1,
          explain: '稳定性 = 相等元素相对次序不变。相邻交换让相等元素永远不会交换位置。',
        }],
      },
      {
        id: 'l-sort-select', title: '选择排序', algoId: 'sort-select', minutes: 6,
        concept: ['每趟从无序区选出最小值，与无序区第一个交换。比较次数固定 n(n-1)/2，但交换最多 n-1 次。'],
        keyPoints: ['交换次数 ≤ n-1', '不稳定', '比较 O(n²) 不可省'],
        quiz: [{
          q: '选择排序最多交换多少次？',
          options: ['n(n-1)/2', 'n-1', 'n²', 'log n'],
          answer: 1,
          explain: '每趟最多交换一次（min≠i 时），共 n-1 趟。',
        }],
      },
      {
        id: 'l-sort-insert', title: '直接插入排序', algoId: 'sort-insert', minutes: 6,
        concept: ['像整理扑克牌：把新元素取出为 key，有序区中比它大的依次后移，空出位置插入。基本有序时接近 O(n)。'],
        keyPoints: ['稳定', '基本有序时近 O(n)', '平均 O(n²)'],
        quiz: [{
          q: '直接插入排序最适合哪种输入？',
          options: ['完全逆序', '基本有序', '完全随机', '元素全相同'],
          answer: 1,
          explain: '基本有序时每个元素只需比较、移动极少次数，总开销接近 O(n)。',
        }],
      },
      {
        id: 'l-sort-quick', title: '快速排序', algoId: 'sort-quick', minutes: 9,
        concept: [
          '分治：选基准 pivot，一趟把小的放左、大的放右，基准落到最终位置；再递归左右两段。',
          '盯住分区过程：i 是"小于基准区"的右边界，j 负责扫描。',
        ],
        keyPoints: ['一趟 = 基准归位', '平均 O(n log n)', '原地但不稳定'],
        quiz: [{
          q: '快排一趟 Partition 结束后，基准元素？',
          options: ['到了数组开头', '已在最终有序位置', '还需再移动', '被复制了一份'],
          answer: 1,
          explain: '基准左边都比它小、右边都比它大——这正是它在有序数组中的最终位置。',
        }],
      },
      {
        id: 'l-sort-merge', title: '归并排序', algoId: 'sort-merge', minutes: 8,
        concept: ['先递归分半到底（单元素必有序），再两两合并：双指针各指一段，取小者写回。严格 O(n log n)，代价是 O(n) 辅助空间。'],
        keyPoints: ['稳定', '严格 O(n log n)', '需要 O(n) 辅助空间'],
        quiz: [{
          q: '归并排序"合并"两个有序段时，核心操作是？',
          options: ['逐对交换', '双指针取较小者依次写回', '随机选择', '重新排序'],
          answer: 1,
          explain: '两个有序段各设一个指针，谁小谁进结果并前移——每元素恰好被处理一次。',
        }],
      },
    ],
  },
]

export const LESSON_MAP: Record<string, Lesson & { chapterId: string }> = Object.fromEntries(
  CHAPTERS.flatMap((c) => c.lessons.map((l) => [l.id, { ...l, chapterId: c.id }]))
)

export const TOTAL_LESSONS = CHAPTERS.reduce((s, c) => s + c.lessons.length, 0)
