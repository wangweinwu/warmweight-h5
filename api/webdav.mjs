/**
 * WebDAV 代理函数（Vercel Serverless · ESM）
 * 作用：绕过浏览器跨域限制，把 WebDAV 请求转发到用户配置的服务器
 * 请求：POST /api/webdav，头 x-webdav-url / x-webdav-auth / x-webdav-method / x-webdav-depth，body 为原始请求体
 * 安全：仅允许 http(s) 目标与 WebDAV 常用方法；可用环境变量 WEBDAV_PROXY_ORIGIN_ALLOWLIST 限制转发目标主机
 */
const ALLOW_METHODS = ['GET', 'PUT', 'MKCOL', 'PROPFIND', 'DELETE', 'HEAD', 'OPTIONS']

export default async function handler(req, res) {
  // CORS：允许任意来源使用本代理（凭据由请求方自带，代理不存储）
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-webdav-url, x-webdav-auth, x-webdav-method, x-webdav-depth')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }

  const chunks = []
  for await (const c of req) chunks.push(c)
  const body = Buffer.concat(chunks)

  const target = String(req.headers['x-webdav-url'] || '')
  const auth = String(req.headers['x-webdav-auth'] || '')
  const method = String(req.headers['x-webdav-method'] || 'GET').toUpperCase()
  const depth = String(req.headers['x-webdav-depth'] || '0')

  if (!target || !/^https?:\/\//i.test(target)) {
    res.status(400).json({ error: 'invalid target url' })
    return
  }
  if (!ALLOW_METHODS.includes(method)) {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  // 可选来源白名单：设置环境变量 WEBDAV_PROXY_ORIGIN_ALLOWLIST=host1,host2 后仅允许转发到这些主机
  const allow = process.env.WEBDAV_PROXY_ORIGIN_ALLOWLIST
  if (allow) {
    try {
      const host = new URL(target).host
      if (!allow.split(',').map((h) => h.trim()).includes(host)) {
        res.status(403).json({ error: 'target host not allowed' })
        return
      }
    } catch {
      res.status(400).json({ error: 'invalid target url' })
      return
    }
  }

  const mod = target.toLowerCase().startsWith('https') ? (await import('https')).default : (await import('http')).default
  await new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (!settled) {
        settled = true
        resolve()
      }
    }
    try {
      const u = new URL(target)
      const preq = mod.request(
        {
          hostname: u.hostname,
          port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + u.search,
          method,
          headers: {
            Authorization: auth,
            'Content-Type': 'application/json; charset=utf-8',
            Depth: depth,
            'Content-Length': body.length
          },
          timeout: 25000
        },
        (pres) => {
          res.writeHead(pres.statusCode || 502, { 'x-webdav-status': String(pres.statusCode) })
          pres.on('data', (c) => res.write(c))
          pres.on('end', done)
          pres.on('error', done)
        }
      )
      preq.on('timeout', () => {
        preq.destroy(new Error('upstream timeout'))
      })
      preq.on('error', (e) => {
        if (!res.headersSent) res.status(502).json({ error: String((e && e.message) || e) })
        else res.end()
        done()
      })
      if (body.length) preq.write(body)
      preq.end()
    } catch (e) {
      if (!res.headersSent) res.status(502).json({ error: String((e && e.message) || e) })
      done()
    }
  })
}
