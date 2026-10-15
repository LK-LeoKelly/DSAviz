// challenge.ts —— 挑战模式出题引擎：猜下一步，立刻揭晓
// 题目不从题库来，而是从当前事件流"lookahead"出来 —— 答案永远与算法的真实行为一致。

import type { Step } from './steps'
import type { Scene } from './scene'

export interface ChallengeQ {
  prompt: string
  choices: string[]
  answer: number      // 正确选项下标
  why: string         // 揭晓后的一句话解释（取下一帧的真实旁白）
}

// 仅排序类算法出题（决策点最密）；其余返回 null 不出题
export function makeQuestion(algoId: string, events: Step[], idx: number, scene: Scene | null): ChallengeQ | null {
  if (!scene) return null
  const ev = events[idx]
  if (!ev || ev.op !== 'compare' || ev.fast) return null
  const next = events[idx + 1]
  if (!next) return null
  const arr = scene.arr
  const [a, b] = scene.cmp ?? [-1, -1]
  const va = a >= 0 ? arr[a] : null
  const vb = b >= 0 ? arr[b] : null
  const why = `下一步真实发生的是：「${next.note}」`

  switch (algoId) {
    case 'sort-bubble': {
      if (va === null || vb === null) return null
      return {
        prompt: `刚才比较了相邻的一对 a[${a}]=${va} 和 a[${b}]=${vb}。接下来会交换它们吗？`,
        choices: ['交换 —— 逆序了', '不交换 —— 顺序正常'],
        answer: next.op === 'swap' ? 0 : 1,
        why,
      }
    }
    case 'sort-select': {
      if (va === null || vb === null) return null
      // min 换人 ⇔ 下一步是 min 指针移动
      const minMoves = next.op === 'ptr' && next.s === 'min'
      return {
        prompt: `挑战者 a[${a}]=${va} 上台，挑战当前最小 a[${b}]=${vb}。min 会换人吗？`,
        choices: ['换人 —— 挑战者更小', '不换 —— 最小值守住了'],
        answer: minMoves ? 0 : 1,
        why,
      }
    }
    case 'sort-insert': {
      if (va === null) return null
      const key = scene.cmpKey
      return {
        prompt: `从右往左扫：a[${a}]=${va} 跟手里的 key=${key} 比过了。它会后移一格给 key 腾位置吗？`,
        choices: ['会后移 —— 它比 key 大', '不后移 —— 插入点找到了'],
        answer: next.note.includes('后移') ? 0 : 1,
        why,
      }
    }
    case 'sort-quick': {
      if (va === null) return null
      const pivot = scene.cmpKey
      const j = a   // 快排的 compare 里，cmp[0] 是扫描指针 j 所指元素
      // 下一步的交换是否"涉及" j——区分"它换进小于区"与"基准归位"两种 swap
      const swapInvolvesJ = next.op === 'swap' && (next.a === j || next.b === j)
      const noSwapEdge = next.op === 'message' && next.note.includes('不用交换')
      const answer = swapInvolvesJ ? 0 : noSwapEdge ? 2 : 1
      return {
        prompt: `a[${j}]=${va} 跟 pivot=${pivot} 比过了。它接下来会去哪？`,
        choices: ['换到"小于区"（发生交换）', '原地不动（它比 pivot 大，留在右边）', '不动——它就在小于区边缘（i+1==j，无需交换）'],
        answer, why,
      }
    }
    case 'sort-merge': {
      if (va === null || vb === null || va === vb) return null
      if (next.op !== 'output') return null
      return {
        prompt: `双指针对决：左指针 a[${a}]=${va} vs 右指针 a[${b}]=${vb}。谁先进辅助数组 tmp？`,
        choices: [`${va}（左边）`, `${vb}（右边）`],
        answer: next.w === va ? 0 : 1,
        why,
      }
    }
    default:
      return null
  }
}

export const CHALLENGE_ALGOS = ['sort-bubble', 'sort-select', 'sort-insert', 'sort-quick', 'sort-merge']
