// api/chat.ts —— 线上环境的助教接口（Vercel 云函数）
// 与本地 vite.config.ts 里的 /api/chat 代理完全等价：浏览器 -> /api/chat -> OpenAI 兼容接口
// 密钥放在 Vercel 环境变量（LLM_API_KEY），不会进入前端产物，也不会进 Git 仓库

export const config = { runtime: 'nodejs' }

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') { res.status(405).end('{}'); return }

  const apiKey = process.env.LLM_API_KEY
  const baseUrl = (process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, '')
  const model = process.env.LLM_MODEL || 'deepseek-chat'
  if (!apiKey) { res.status(503).end(JSON.stringify({ error: '服务端未配置 LLM_API_KEY' })); return }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
    const upstream = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: body.messages, temperature: body.temperature ?? 0.6 }),
    })
    const data: any = await upstream.json()
    if (!upstream.ok) { res.status(upstream.status).end(JSON.stringify({ error: data?.error?.message || 'LLM 调用失败' })); return }
    res.status(200).end(JSON.stringify({ content: data.choices?.[0]?.message?.content ?? '' }))
  } catch (e: any) {
    res.status(500).end(JSON.stringify({ error: String(e?.message || e) }))
  }
}
