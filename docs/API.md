# 云同步接口协议（v1）

应用通过两个 HTTP 端点与云端交换**整包快照**。前端已内置「本地云模拟」，设置 `CLOUD_API_BASE` 后即刻切换真实后端，无需改动业务代码。

## 快照结构

```jsonc
// PUT /api/sync/:userId 请求体 & GET 响应体
{
  "userId": "uabc123",
  "savedAt": "2026-09-21T12:00:00.000Z",   // 服务端收到时间或客户端时钟，用于同步日志
  "deviceId": "dev-xxxx",                   // 最后写入设备
  "user": {                                 // 可选；资料字段
    "id": "uabc123",
    "email": "me@example.com",
    "nickname": "小暖",
    "gender": "female",
    "heightCm": 165,
    "avatar": "data:image/jpeg;base64,...", // 已压缩 dataURL（可改存对象存储，替换为 URL）
    "createdAt": "...",
    "updatedAt": "..."                      // 数据级时间戳，合并依据
  },
  "plan": {                                 // 可选；null = 已删除计划
    "startWeight": 71.2,
    "goalWeight": 62,
    "startDate": "2026-09-21",
    "unit": "week",
    "duration": 8,
    "updatedAt": "..."
  },
  "weights": [                              // 全量；按 date 幂等
    { "date": "2026-09-21", "weight": 71.2, "note": "", "updatedAt": "..." }
  ],
  "photos": [                               // 全量；按 id 幂等
    { "id": "phxxx", "date": "2026-09-21", "thumb": "data:...", "full": "data:...", "weight": 71.2 }
  ]
}
```

## 端点

### `GET /api/sync/:userId`

- `200` 返回快照 JSON；`404` 表示云端无数据（首次上云）
- 鉴权：生产环境应校验 `Authorization: Bearer <token>`（demo 免鉴权）

### `PUT /api/sync/:userId`

- 请求体即快照 JSON；服务端整体存储，返回 `200`/`204`
- 幂等：同快照重复提交无副作用

## 客户端合并规则（已在 `src/lib/sync.ts` 实现，服务端无需感知）

| 数据 | 合并键 | 策略 |
|---|---|---|
| weights | `date` | `updatedAt` 新者胜 |
| photos | `id` | `updatedAt`（或缺省）新者胜 |
| user / plan | 单对象 | 数据级 `updatedAt` 新者胜 |
| 删除 | 集合缺席即删除 | 全量快照天然携带删除语义 |

## Node 参考实现（零依赖，单文件）

```js
// server.js —— node server.js 起服务（默认 :8787）
const http = require('http')
const store = new Map() // userId -> snapshot；生产请替换为 DB

http.createServer((req, res) => {
  const m = req.url.match(/^\/api\/sync\/([\w-]+)$/)
  if (!m) { res.writeHead(404).end() }
  else if (req.method === 'GET') {
    const snap = store.get(m[1])
    if (!snap) { res.writeHead(404).end() } else {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(snap))
    }
  } else if (req.method === 'PUT') {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      store.set(m[1], JSON.parse(body))
      res.writeHead(204).end()
    })
  } else res.writeHead(405).end()
}).listen(8787)
```

对接：`CLOUD_API_BASE = 'http://localhost:8787'`。

## 生产建议

1. 认证：`/api/login`、`/api/register` 由服务端签发 JWT；前端 `hashPassword` 逻辑整体替换为 token 流程（store 接口不变）
2. 照片：快照中的 dataURL 改传对象存储 URL，避免大 payload
3. 限流：PUT 加节流（建议 ≥30s/次），冲突场景客户端已用时间戳合并兜底
