/**
 * WebDAV 客户端（浏览器直连 / 站点代理双模式）
 *
 * 直连模式：WebDAV 服务器需允许跨域（CORS）——Nextcloud / Alist / 群晖等多数可配
 * 代理模式：经本站 /api/webdav 函数转发（Vercel 部署自动可用），无跨域限制，坚果云等直接可用
 */

export interface WebdavConfig {
  enabled: boolean
  /** url 来自部署环境变量（UI 中提示由部署设定，仍可本地覆盖） */
  fromEnv?: boolean
  /** 服务器根地址，如 https://dav.jianguoyun.com/dav/ */
  url: string
  username: string
  /** 建议使用服务端的「应用密码」而非登录密码 */
  password: string
  /** 远程目录（相对服务器根），如 warmweight */
  dir: string
  /** 经本站代理转发（服务器不允许跨域时开启） */
  useProxy: boolean
  /** 自定义代理端点（默认 /api/webdav） */
  proxyUrl?: string
}

/**
 * 默认配置：优先读构建时环境变量（部署时设定），用户在应用内修改后覆盖（存本地）
 * 支持的变量：
 *   VITE_WEBDAV_URL / VITE_WEBDAV_USERNAME / VITE_WEBDAV_PASSWORD
 *   VITE_WEBDAV_DIR / VITE_WEBDAV_ENABLED / VITE_WEBDAV_MODE(proxy|direct)
 */
export function defaultWebdavConfig(): WebdavConfig {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}
  const mode = (env.VITE_WEBDAV_MODE ?? 'proxy').toLowerCase()
  return {
    enabled: env.VITE_WEBDAV_ENABLED === '1' || env.VITE_WEBDAV_ENABLED === 'true',
    url: env.VITE_WEBDAV_URL ?? '',
    username: env.VITE_WEBDAV_USERNAME ?? '',
    password: env.VITE_WEBDAV_PASSWORD ?? '',
    dir: env.VITE_WEBDAV_DIR ?? 'warmweight',
    useProxy: mode !== 'direct',
    fromEnv: Boolean(env.VITE_WEBDAV_URL)
  }
}

/** unicode 安全的 Basic 认证头 */
function authHeader(cfg: WebdavConfig): string {
  const raw = `${cfg.username}:${cfg.password}`
  const bytes = new TextEncoder().encode(raw)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return 'Basic ' + btoa(bin)
}

function joinUrl(base: string, dir: string, name?: string): string {
  const b = base.trim().replace(/\/+$/, '')
  const d = dir.trim().replace(/^\/+|\/+$/g, '')
  const parts = [b]
  if (d) parts.push(d)
  if (name) parts.push(name)
  return parts.join('/')
}

/** 发起 WebDAV 请求（自动选择直连/代理），返回 HTTP 状态码与响应文本 */
async function davFetch(cfg: WebdavConfig, method: string, fileUrl: string, body?: string, depth = '0'): Promise<{ status: number; text: string }> {
  if (cfg.useProxy) {
    const res = await fetch(cfg.proxyUrl || '/api/webdav', {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
        'x-webdav-url': fileUrl,
        'x-webdav-auth': authHeader(cfg),
        'x-webdav-method': method,
        'x-webdav-depth': depth
      },
      body
    })
    return { status: res.status, text: await res.text() }
  }
  const res = await fetch(fileUrl, {
    method,
    headers: {
      Authorization: authHeader(cfg),
      Depth: depth,
      'content-type': 'application/json; charset=utf-8'
    },
    body
  })
  return { status: res.status, text: await res.text() }
}

export interface WebdavTestResult {
  ok: boolean
  message: string
}

/** 测试连接：PROPFIND 目录，不存在则尝试自动创建 */
export async function wdTest(cfg: WebdavConfig): Promise<WebdavTestResult> {
  if (!cfg.url.trim()) return { ok: false, message: '请先填写服务器地址' }
  const dirUrl = joinUrl(cfg.url, cfg.dir)
  try {
    let { status } = await davFetch(cfg, 'PROPFIND', dirUrl, undefined, '0')
    if (status === 404) {
      // 目录不存在 → 逐级创建
      const created = await wdEnsureDir(cfg)
      if (!created) return { ok: false, message: `目录不存在且自动创建失败（${dirUrl}），请确认账号有写权限` }
      status = (await davFetch(cfg, 'PROPFIND', dirUrl, undefined, '0')).status
    }
    if (status === 207 || status === 200) return { ok: true, message: `连接成功，目录 ${cfg.dir || '/'} 可用` }
    if (status === 401 || status === 403) return { ok: false, message: '认证失败：请检查账号与密码（坚果云请用「应用密码」）' }
    if (status === 502) return { ok: false, message: '代理转发失败：请检查服务器地址是否可达' }
    return { ok: false, message: `服务器返回 ${status}，该地址可能不是 WebDAV 服务` }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/Failed to fetch|NetworkError|load failed/i.test(msg)) {
      return {
        ok: false,
        message: cfg.useProxy
          ? '代理不可达：请确认部署环境包含 /api/webdav 函数，或改用直连模式'
          : '直连被浏览器拦截：服务器未开放跨域(CORS)，请开启「经代理转发」'
      }
    }
    return { ok: false, message: '连接异常：' + msg }
  }
}

/** 逐级创建远程目录（已存在忽略 405） */
export async function wdEnsureDir(cfg: WebdavConfig): Promise<boolean> {
  const d = cfg.dir.trim().replace(/^\/+|\/+$/g, '')
  if (!d) return true
  const segments = d.split('/')
  let cur = cfg.url.trim().replace(/\/+$/, '')
  for (const seg of segments) {
    cur += '/' + seg
    const { status } = await davFetch(cfg, 'MKCOL', cur)
    // 201 创建成功；405 已存在；301/200 部分服务器变体
    if (![201, 405, 301, 200].includes(status)) return false
  }
  return true
}

/** 读取远程快照 JSON；404 返回 null，其他错误抛出 */
export async function wdGetJSON<T>(cfg: WebdavConfig, name: string): Promise<T | null> {
  const { status, text } = await davFetch(cfg, 'GET', joinUrl(cfg.url, cfg.dir, name))
  if (status === 404) return null
  if (status !== 200) throw new Error(`WebDAV GET ${status}`)
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('WebDAV 文件内容不是有效 JSON')
  }
}

/** 写入远程快照 JSON（自动确保目录存在） */
export async function wdPutJSON(cfg: WebdavConfig, name: string, data: unknown): Promise<void> {
  await wdEnsureDir(cfg)
  const { status } = await davFetch(cfg, 'PUT', joinUrl(cfg.url, cfg.dir, name), JSON.stringify(data))
  if (![200, 201, 204].includes(status)) throw new Error(`WebDAV PUT ${status}`)
}
