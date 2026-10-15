import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// AI 导师代理：浏览器 -> /api/chat -> config.json 里配置的 OpenAI 兼容接口（默认 DeepSeek）
// 密钥只存在于本机 config.json（已 gitignore），不会打包进前端
function readLlmConfig() {
  try {
    const p = path.resolve(__dirname, "config.json")
    const cfg = JSON.parse(fs.readFileSync(p, "utf-8"))
    if (!cfg.apiKey) return null
    return { apiKey: cfg.apiKey, baseUrl: (cfg.baseUrl || "https://api.deepseek.com/v1").replace(/\/$/, ""), model: cfg.model || "deepseek-chat" }
  } catch { return null }
}

function aiTutorPlugin(): Plugin {
  return {
    name: "dsaviz-ai-tutor",
    configureServer(server) {
      server.middlewares.use("/api/health", (_req, res) => {
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify({ llm: !!readLlmConfig() }))
      })
      server.middlewares.use("/api/chat", (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; res.end(); return }
        let body = ""
        req.on("data", (c) => (body += c))
        req.on("end", async () => {
          res.setHeader("Content-Type", "application/json")
          const cfg = readLlmConfig()
          if (!cfg) { res.statusCode = 503; res.end(JSON.stringify({ error: "未配置 LLM（项目根目录 config.json）" })); return }
          try {
            const { messages, temperature } = JSON.parse(body || "{}")
            const upstream = await fetch(cfg.baseUrl + "/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
              body: JSON.stringify({ model: cfg.model, messages, temperature: temperature ?? 0.6 }),
            })
            const data: any = await upstream.json()
            if (!upstream.ok) { res.statusCode = upstream.status; res.end(JSON.stringify({ error: data?.error?.message || "LLM 调用失败" })); return }
            res.end(JSON.stringify({ content: data.choices?.[0]?.message?.content ?? "" }))
          } catch (e: any) {
            res.statusCode = 500; res.end(JSON.stringify({ error: String(e?.message || e) }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react(), aiTutorPlugin()],
  server: {
    port: 3000,
    strictPort: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
