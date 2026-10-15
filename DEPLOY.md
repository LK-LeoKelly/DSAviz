# 部署指南

目标：把本站部署为公开可访问的网址。方案：GitHub（托管代码）→ Vercel（免费托管 + 自动部署）。无需购买服务器。

---

## 1. 推送代码到 GitHub

```bash
git remote add origin https://github.com/<用户名>/DSAviz.git
git push -u origin main
```

`config.json`（本地密钥）已在 .gitignore 中，不会被提交。

## 2. Vercel 部署

1. vercel.com 使用 GitHub 登录 → Add New → Project → 导入本仓库
2. 框架会被自动识别为 Vite，保持默认设置，点击 Deploy
3. 部署完成得到 `https://<项目名>.vercel.app`

## 3. 配置 AI 助教（可选）

项目 → Settings → Environment Variables，添加：

| Name | Value |
|---|---|
| `LLM_API_KEY` | DeepSeek 接口密钥（sk- 开头） |

保存后到 Deployments 对最新一条执行 Redeploy，使变量生效。未配置时网站其余功能全部正常，仅助教对话显示离线。

## 4. 绑定自有域名（国内访问必需）

`*.vercel.app` 默认域名在中国大陆无法稳定访问，需要绑定自有域名：

1. 在腾讯云/阿里云注册域名（如 `.top` / `.cn`，首年约 9~30 元），完成实名认证
2. Vercel 项目 → Settings → Domains → 添加该域名
3. 在域名服务商的 DNS 解析中添加 CNAME 记录：
   - 主机记录：`@` 与 `www`
   - 记录值：`cname-china.vercel-dns.com`（Vercel 的中国大陆优化线路，勿用默认的 `cname.vercel-dns.com`）
4. 等待解析生效（约 10 分钟至数小时）。服务器位于境外，无需 ICP 备案

## 5. 持续更新

push 到 GitHub 的 main 分支后，Vercel 自动重新构建并发布，约 1~2 分钟生效。Deployments 列表保留历史版本，可一键回滚。

## 费用

| 项目 | 费用 |
|---|---|
| GitHub 仓库 | 免费 |
| Vercel 托管 + 云函数 | 免费额度 |
| 自有域名 | 约 9~30 元首年 |
| DeepSeek API | 按量计费，答疑场景单次约几分钱 |
