// api/health.ts —— 线上环境健康检查：告诉前端"助教接口是否已配置"

export const config = { runtime: 'nodejs' }

export default async function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json')
  res.status(200).end(JSON.stringify({ llm: !!process.env.LLM_API_KEY }))
}
