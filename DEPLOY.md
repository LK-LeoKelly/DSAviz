# 部署指南（给 kk 的图文步骤）

目标：让任何人通过一个网址打开 DSAViz，而不是只能在你电脑的 localhost 看。
方案：**GitHub（存代码）→ Vercel（免费托管 + 自动更新）**。不需要买服务器，域名可买可不买。

---

## 第一步：注册 / 登录 GitHub

github.com 注册一个账号（免费的）。这是代码的"云端仓库"，也是你和 Vercel 之间的桥梁。

## 第二步：把代码放上 GitHub

1. 在 GitHub 右上角 **+** → **New repository**：
   - 名字填 `dsaviz`，选 **Public**（私有也行，Vercel 都支持），**不要**勾任何初始化文件
   - 创建后页面会显示几行命令，不用管它，往下看
2. 在你电脑的项目文件夹里运行（我可以帮你跑，你只需要把 GitHub 用户名和仓库地址给我）：

```bash
git remote add origin https://github.com/你的用户名/dsaviz.git
git push -u origin main
```

第一次 push 会弹出登录窗口，按提示登录一次即可。

> 密钥安全：项目里的 `config.json` 已经在 .gitignore 里，**永远不会被上传**。

## 第三步：Vercel 一键部署

1. 打开 vercel.com → **Sign up with GitHub**（用刚注册好的 GitHub 登录，免费）
2. **Add New → Project**，列表里选 `dsaviz`，点 **Import**
3. 它自动识别出 Vite 项目，**所有设置保持默认**，直接点 **Deploy**
4. 等 1~2 分钟，得到网址 `https://dsaviz-xxx.vercel.app` —— 这就是公开地址，发给谁都能打开

## 第四步（可选）：让线上也能用 AI 助教

Vercel 项目页 → **Settings → Environment Variables**，添加一条：

| Name | Value |
|---|---|
| `LLM_API_KEY` | 你的 DeepSeek 密钥（sk- 开头那串） |

添加后点 **Deployments → 最新一条 → Redeploy**，助教就上线了。
不配的话：全站所有功能正常，只是助教显示"暂时离线"。

## 之后怎么继续改？

**部署不是终点，开发完全照旧：**

- 你随时让我改任何功能，我改完本地验证后执行 `git push`，**Vercel 检测到推送会自动重新构建上线**，1~2 分钟后网址里就是新版
- 本地 `npm run dev` 继续用，和线上互不影响
- 想看某个历史版本：Vercel 的 Deployments 列表里每次部署都在，可一键回滚

## 域名（方案一：国内稳定访问的关键）

**注意：`xxx.vercel.app` 默认域名在中国大陆基本打不开（DNS 污染），必须绑自有域名才能给评委/同学访问。**

1. **买域名**：腾讯云（dnspod.cloud.tencent.com）或阿里云，搜 `dsaviz` / 你喜欢的名字，挑 `.top` / `.cn`（首年 9~30 元）。购买时要实名认证（上传身份证，几小时内通过，这是国家规定，所有域名商都要）
2. **Vercel 里绑定**：项目 → **Settings → Domains** → 输入你的域名（如 `dsaviz.top`）→ Add
3. **域名商那里加解析**（最关键的一步，决定国内能不能打开）：
   - 到域名商的"域名解析"页面，添加一条记录：
     - 主机记录：`@`（或 `www`，两个都加更好）
     - 记录类型：**CNAME**
     - 记录值：**`cname-china.vercel-dns.com`** ← 这是 Vercel 官方的中国大陆优化线路，不要填它默认推荐的 `cname.vercel-dns.com`
   - 等 10 分钟~几小时生效，国内各地就能稳定打开了
4. **不需要 ICP 备案**：服务器在境外，政策上不强制

## 费用总结

| 项目 | 费用 |
|---|---|
| GitHub 仓库 | 免费 |
| Vercel 托管 + 云函数 | 免费额度（个人项目用不完） |
| 自有域名 | 约 9~30 元首年（.top/.cn），续费 30~70 元/年 |
| DeepSeek API | 按用量计费，答疑场景一次对话约几分钱，充值 10 元能用很久 |
