# PetMon 独立部署指引（不覆盖原项目）

> 原项目 `warmweight-h5` 已**完整恢复**到 main（体重管理 H5, commit `1ffb459`）,
> Vercel 会自动重新部署回原站。游戏放在 **`petmon` 分支**, 等待以独立项目部署。

## 当前状态

| 项 | 状态 |
|---|---|
| main 分支 | ✅ 已恢复原体重 H5（`.env.example / api / src / vite.config.ts` 等）|
| petmon 分支 | ✅ 游戏全量（代码 + 26 张立绘 + vercel.json + 截图）|
| 游戏在线 | ⏳ 需在 Vercel 用 petmon 分支建独立项目（下方 2 分钟步骤）|

## Vercel 部署步骤（网页 2 分钟）

1. 打开 https://vercel.com/new → Import **wangweinwu/warmweight-h5**
2. **必改一项**:
   - **Branch**: 选 `petmon`（不要选 main！main 是体重 H5）
   - Framework Preset: **Other**, Build Command 留空, Output Directory 留空
3. 项目名改成 `petmon` → **Deploy**
4. 上线后即游戏地址: `https://petmon-xxx.vercel.app`

部署后可把该域名的 logo 指到任何地方; 原 warmweight-h5.vercel.app 保持体重 H5 不变。

> 若你的 Vercel 账号下看不到 warmweight-h5 项目, 说明该项目在你另一个 GitHub App 授权里,
> 点 Import 时按提示安装 Vercel GitHub App 授权即可。

## 备选: 一键 CLI 部署

```bash
npm i -g vercel
cd petmon            # 或 git clone -b petmon git@github.com:wangweinwu/warmweight-h5.git
vercel --prod        # 首次询问项目名时填 petmon, 其他全部回车默认
```

## 备选: 独立 GitHub 仓库（需要你在 github.com/new 建一个叫 petmon 的空仓库）

```bash
cd pokemon-game
git remote set-url origin git@github.com:wangweinwu/petmon.git
git push -u origin petmon:main
```
然后 Vercel Import petmon 仓库, 全默认即可。

## 本地运行

```bash
git clone -b petmon git@github.com:wangweinwu/warmweight-h5.git petmon && cd petmon
python3 -m http.server 8000   # http://localhost:8000
```
