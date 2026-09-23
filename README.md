# 暖轻 WarmWeight · 个人体重管理 H5

> 暖色调（珊瑚橙 `#FF7F50` · 焦糖 `#C68E17` · 暖米 `#F5F5DC`）· 本地优先 + 云端同步 · 核心操作路径 ≤ 3 步

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-name/warmweight-h5)

## 功能总览

| 模块 | 路径 | 3 步路径 |
|---|---|---|
| 用户系统 | `/auth` `/profile-setup` | 注册（免验证码）→ 补全资料 → 开始使用；密码找回与修改 |
| 减重计划 | `/plan` | 目标体重 → 周期 → 确认（自动算每日目标 −kg/天 与剩余进度） |
| BMI + 体重追踪 | `/track` | 日历（月/周切换）+ 可缩放曲线（双指/滚轮缩放、拖动平移、点看数值）|
| 拍照记录 | `/gallery` | 拍摄/相册 → 时间轴归档 → 前后滑动对比 |
| 食物热量 & GI | `/foods` | 搜索 → 分类筛选 → 展开 100g 营养 + 份量换算 |
| 运动消耗 | `/sports` | 选运动 → 调时长 → 实时按体重算消耗（MET 公式）|

## 技术栈

- **React 18 + TypeScript + Vite 5**，路由 `react-router-dom`（Hash 模式，静态托管免配置）
- **zustand** 状态管理；**零图表依赖**——体重曲线为自研 SVG 组件（缩放/平移/tooltip）
- 数据层：localStorage 优先 → 网络可用自动云同步（内置本地云模拟，一行配置切真实后端）
- 多端一致性：数据级 `updatedAt` 时间戳合并（新者胜），storage 事件跨标签页实时回灌

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产物 dist/（gzip 后 JS ~86KB + CSS ~4.4KB）
npm run preview
```

## 部署

### Vercel 一键部署
仓库导入 [vercel.com/new](https://vercel.com/new) 即可，`vercel.json` 已配好构建与 SPA 路由；或点上方 Deploy 按钮。

### 其他静态托管
`dist/` 目录可直接托管到 Netlify / GitHub Pages / 任意静态服务器（Hash 路由无需 rewrite）。

## 项目结构

```
weight-h5/
├── index.html                  # 入口（主题预恢复，防闪白）
├── vercel.json                 # Vercel 构建与 SPA 配置
├── src/
│   ├── main.tsx                # 路由表 + 根重定向
│   ├── styles/tokens.css       # 设计系统：品牌色 token + 全部组件样式
│   ├── lib/
│   │   ├── types.ts            # 领域类型（User/Plan/WeightEntry/PhotoEntry/Food/Sport…）
│   │   ├── storage.ts          # localStorage 封装 + 跨标签页同步
│   │   ├── sync.ts             # 云同步：推送→拉取→数据级合并（协议见 docs/API.md）
│   │   ├── crypto.ts           # WebCrypto sha-256 密码摘要
│   │   ├── photo.ts            # 图片压缩（full 1280px / thumb 320px）
│   │   ├── bmi.ts              # BMI 计算 + 中国标准分级 + 健康区间 + BMR
│   │   └── format.ts           # 日期/数字格式化
│   ├── data/
│   │   ├── foods.ts            # 92 种食物：热量/三大营养素/GI/常见份量
│   │   └── sports.ts           # 55 项运动 MET 值 + 消耗公式
│   ├── store/useApp.ts         # 全局状态（认证/计划/记录/照片/同步编排）
│   ├── components/
│   │   ├── Shell.tsx           # Tab 框架 + 记录 FAB + 离线横幅
│   │   ├── QuickWeightSheet.tsx# 3 步快速记录（全局核心流）
│   │   ├── WeightChart.tsx     # SVG 体重曲线（缩放/平移/点看）
│   │   ├── CompareSlider.tsx   # 前后对比滑块
│   │   ├── Calendar.tsx        # 月/周日历
│   │   ├── ui.tsx              # NavBar/Sheet/Modal/Segmented/Stepper/Ring…
│   │   ├── icons.tsx           # SVG 线性图标（1.7px stroke）
│   │   └── Widgets.tsx         # Toast / 主题切换
│   └── pages/                  # Home/Track/Plan/Gallery/Foods/Sports/Mine/Auth/Onboarding/ProfileSetup/About
└── docs/API.md                 # 云同步接口协议（含 Node 参考实现）
```

## WebDAV 云备份（可选）

用户可在应用「我的 → WebDAV 云备份」配置自己的坚果云 / Nextcloud / Alist / NAS（详见 `docs/WEBDAV.md`）。
部署者也可以通过**构建时环境变量**为所有用户预设默认值：

| 变量 | 说明 | 默认 |
|---|---|---|
| `VITE_WEBDAV_URL` | WebDAV 服务器根地址 | 空（用户自填） |
| `VITE_WEBDAV_USERNAME` | WebDAV 账号 | 空 |
| `VITE_WEBDAV_PASSWORD` | WebDAV 密码（应用密码；打包进前端即视为公开） | 空 |
| `VITE_WEBDAV_DIR` | 远端目录 | `warmweight` |
| `VITE_WEBDAV_ENABLED` | 默认开启自动备份 | `false` |
| `VITE_WEBDAV_MODE` | `proxy`（默认）/ `direct` | `proxy` |

在 Vercel：项目 Settings → Environment Variables 里添加后重新部署即可；本地开发复制 `.env.example` 为 `.env.local`。
用户在应用内修改后会保存在其浏览器本地，优先于部署预设。

## 数据与离线策略

1. **写入路径**：任何修改先写 localStorage（同步 <10ms），再异步触发云同步——离线功能 100% 可用
2. **同步时机**：登录/注册后、每次数据变更后、网络恢复时（`online` 事件）、手动点同步
3. **合并策略**：体重按 `date` 去重、照片按 `id` 去重、资料/计划按 `updatedAt` 新者胜；同步进行中的新变更自动排队补跑
4. **多标签**：storage 事件实时回灌，两窗口同开数据即时一致
5. 接入真实后端：设置 `src/lib/sync.ts` 的 `CLOUD_API_BASE`，实现 `GET/PUT /api/sync/:userId`（协议与 Node 参考实现见 `docs/API.md`）

## 已验证

- TypeScript 全量类型检查零错误；生产构建通过
- 无头浏览器端到端全流程：引导 → 注册 → 资料补全 → 3 次体重记录 → 计划设定 → 日历/曲线 → 查询页 → 同步日志，数据一致
- 截图审查通过：中文渲染、暖色体系、无元素遮挡；离线横幅与恢复同步正常

## 说明

- 内置食物/运动数据参考《中国食物成分表》第 6 版、中国营养学会 GI 表与 Compendium of Physical Activities，为大众参考值，不构成医疗建议
- 当前认证为前端演示实现（SHA-256 摘要 + 本地云模拟）；生产部署建议按 `docs/API.md` 将认证迁到服务端
