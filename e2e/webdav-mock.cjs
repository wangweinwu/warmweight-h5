/**
 * 本地 WebDAV 模拟服务器（内存版）+ 代理转发
 * 用于端到端验证：node e2e/webdav-mock.js 起在 :8788
 * 支持 GET / PUT / MKCOL / PROPFIND（简单实现）
 */
const http = require('http')

const store = new Map() // path -> Buffer
const dirs = new Set(['/'])

http.createServer((req, res) => {
  let body = []
  req.on('data', (c) => body.push(c))
  req.on('end', () => {
    if (req.url === '/__list__') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify([...store.keys()]))
      return
    }
    const p = decodeURIComponent(req.url.split('?')[0])
    const data = Buffer.concat(body)
    // CORS：模拟支持浏览器直连的 WebDAV 服务器
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,MKCOL,PROPFIND,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Depth,Content-Type')
    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return }
    console.log(`[webdav-mock] ${req.method} ${p} (${data.length}b)`)

    if (req.method === 'PUT') {
      store.set(p, data)
      // 确保父目录存在
      const segs = p.split('/').filter(Boolean)
      for (let i = 1; i < segs.length; i++) dirs.add('/' + segs.slice(0, i).join('/'))
      res.writeHead(201).end()
    } else if (req.method === 'GET') {
      const buf = store.get(p)
      if (buf) {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        res.end(buf)
      } else res.writeHead(404).end()
    } else if (req.method === 'MKCOL') {
      if (dirs.has(p) || store.has(p)) res.writeHead(405).end()
      else {
        dirs.add(p)
        res.writeHead(201).end()
      }
    } else if (req.method === 'PROPFIND') {
      if (dirs.has(p) || store.has(p)) {
        res.writeHead(207, { 'content-type': 'application/xml; charset=utf-8' })
        res.end('<?xml version="1.0"?><D:multistatus xmlns:D="DAV:"><D:response><D:href>' + p + '</D:href><D:propstat><D:prop><D:resourcetype/></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>')
      } else res.writeHead(404).end()
    } else if (req.method === 'DELETE') {
      res.writeHead(store.delete(p) ? 204 : 404).end()
    } else {
      res.writeHead(405).end()
    }
  })
}).listen(8788, () => console.log('webdav-mock on :8788'))
