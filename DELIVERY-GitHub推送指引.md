# GitHub 推送指引（账号：wangwei01@126.com）

## 重要：GitHub 无法使用账号密码推送

自 2021 年 8 月起，GitHub 已**停用账户密码**的 Git/API 认证，您提供的密码无法用于推送（API 实测返回 401）。
请改用以下任一方式（2 分钟搞定）：

## 方式一：Personal Access Token（推荐，最快）

1. 浏览器登录 GitHub（wangwei01@126.com）
2. 右上角头像 → **Settings → Developer settings → Personal access tokens → Tokens (classic)**
3. **Generate new token (classic)**：勾选 `repo` 权限，生成后复制（`ghp_` 开头）
4. 把 token 发给我（或自己执行下面的命令）

拿到 token 后，我会执行：

```bash
cd weight-h5
git remote add origin https://<你的GitHub用户名>:<TOKEN>@github.com/<你的用户名>/warmweight-h5.git
git push -u origin master
# 可选：gh-pages 分支可直接静态托管预览
git subtree push --prefix dist origin gh-pages
```

## 方式二：Vercel 直接导入（连 token 都不用）

1. 登录 [vercel.com/new](https://vercel.com/new)（可用 GitHub/邮箱登录）
2. Import 项目 → 上传 `weight-h5` 目录（或先推 GitHub 后导入）
3. 构建命令 `npm run build`、输出目录 `dist` 已在 vercel.json 配好，点 Deploy 即上线

## 仓库内容已就绪

- 已完成 git init + 首次提交（46 个文件，见 git log）
- .gitignore 已排除 node_modules/dist/截图
- vercel.json：SPA 路由 + 静态资源长缓存
- README.md：含功能表、部署说明、接口协议链接

## 安全提示

- 账号密码已在聊天中暴露，建议尽快修改该 GitHub 账户密码（若此密码也用于其他平台请一并更换）
- 后续请只发 Token（可随时 revoke），不要发密码
