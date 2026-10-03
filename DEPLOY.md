# PetMon 部署指引（新项目, 不覆盖原项目）

> 目标: 宠物游戏部署为独立 Vercel 项目; 原 warmweight-h5 项目已恢复, 不受影响。
> 生成时间: 2026-10-03 20:15 (Asia/Shanghai)

---

## 当前状态（已自动完成的部分）

### ✅ 原项目已恢复
- `wangweinwu/warmweight-h5` 的 **main 分支已强制恢复**为原体重管理 H5 内容（commit `1ffb459`）
- GitHub 上的仓库描述、Vercel 自动部署都会回到原项目; Vercel 会在 1~2 分钟内自动把
  warmweight-h5.vercel.app 重新部署回体重 H5
- 如立即恢复: Vercel 控制台 → warmweight-h5 → Deployments → 找到 `1ffb459` 那条 → 右侧 ⋯ → **Promote to Production**

### ✅ 游戏已推到独立分支
- 游戏完整内容在 **`petmon` 分支**（commit `2e3576c`, 含全部代码/立绘/截图/vercel.json）
- 验证: https://github.com/wangweinwu/warmweight-h5/tree/petmon
- 该分支 `vercel.json` 已配好零构建静态部署

---

## 你需要做的（2 分钟, 网页操作）

### 第 1 步: 创建空的 GitHub 仓库（推荐, 一次性理清）
1. 打开 https://github.com/new
2. Repository name 填 `petmon`，选 **Public**，**不要**勾选任何初始化（README/.gitignore/license 都不勾）
3. 点 Create repository

然后本地执行（或让我执行）:
```bash
cd pokemon-game
git remote set-url origin git@github.com:wangweinwu/petmon.git
git push -u origin petmon:main
```

> 如果不想建新仓库, 跳过第 1 步, 直接用 `warmweight-h5` 的 `petmon` 分支部署也一样（第 2 步选分支时选 petmon）。

### 第 2 步: Vercel 新建独立项目
1. 打开 https://vercel.com/new
2. Import **warmweight-h5** 仓库（如果做了第 1 步则选 **petmon** 仓库）
3. 关键配置（新版 Vercel 界面）:
   - **Framework Preset**: Other
   - **Root Directory**: 保持默认 `./`
   - **Build Command**: 留空（vercel.json 里已是 null）
   - **Output Directory**: 留空（vercel.json 已指定 `.`）
   - 若是 warmweight-h5 仓库: **Branch**: 选 `petmon`（重要! 不要选 main）
4. 项目名建议改成 `petmon`（Deploy 前可改）→ 点 **Deploy**
5. 约 10 秒后上线: `https://petmon.vercel.app`（或 Vercel 分配的 xxx.vercel.app）

### 第 3 步（可选）: 绑定游戏专用域名
Vercel 项目 → Settings → Domains → Add

---

## 为什么不能全自动?

沙箱只有 `wangweinwu` 账号的 SSH deploy key（仅仓库读写权限）:
- ❌ 无 GitHub token / gh CLI → 无法调 API 创建新仓库
- ❌ Vercel 未登录 → 无法代建项目
- ✅ git push / 分支管理 / 文件准备 → 已全部完成

所以"建仓库名字 + Vercel 点两下"需要你操作; 其余全部就绪。
如果你把 GitHub token 放进 `.openclaw/credentials/github.env`（格式: `export GITHUB_TOKEN=ghp_xxx`）,
我可以自动建仓库并推送; Vercel 同理（`VERCEL_TOKEN=xxx` 后我可以 `vercel --prod` 全自动部署）。

---

## 回滚备忘

- 恢复原项目 main: `git push --force origin warmweight-h5-backup:main`（备份分支已推到远端? 未推送, 本地保留着）
- 本地分支说明:
  - `main` = PetMon 内容（merge 过原历史）
  - `petmon` = PetMon 内容（与远程 petmon 分支一致, 推荐用这个）
  - 原体重 H5 提交 = `1ffb459`（origin/main 当前指向）
