# DSAViz · 看得见的算法

数据结构与算法可视化学习平台：事件流驱动的逐帧演示、源码逐行对照、AI 助教（可读课件、给演示）、对比赛跑、演算沙盒、挑战模式。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:3000
```

AI 助教（可选）：在项目根目录新建 `config.json`（已被 .gitignore 忽略，不会提交）：

```json
{
  "apiKey": "你的 DeepSeek 密钥",
  "baseUrl": "https://api.deepseek.com/v1",
  "model": "deepseek-chat"
}
```

不配密钥时全站功能照常，仅助教对话不可用。

## 部署（公开访问）

推荐 Vercel（免费额度足够，无需买服务器；每次 push 到 GitHub 自动重新部署）：

1. 把本仓库 push 到 GitHub
2. vercel.com 用 GitHub 登录 → Add New Project → 导入本仓库（自动识别 Vite，不用改任何设置）
3. 项目 Settings → Environment Variables 添加：
   - `LLM_API_KEY` = 你的 DeepSeek 密钥（想让线上也能用 AI 助教就加，不加则其余功能全部正常）
4. Deploy，得到一个 `xxx.vercel.app` 网址，任何人都能打开

详细图文步骤见 `DEPLOY.md`。
