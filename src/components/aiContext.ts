// aiContext.ts —— 极简全局状态：让 AI 助教知道"学生正在看什么"

let current = { place: '首页', algo: '', note: '' }

export function setAiContext(c: Partial<typeof current>) {
  current = { ...current, ...c }
}
export function getAiContext() {
  return current
}
