const PORT = 9223
const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
const tabs = await res.json()
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
})
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const evalV = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
  if (r.result?.exceptionDetails) { console.error('PAGE error:', JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return null }
  return r.result?.result?.value
}

const r = await evalV(`(async () => {
  const $$ = (s) => [...document.querySelectorAll(s)]
  const setVal = (el, val) => {
    const p = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    p.set.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const out = {}
  // 当前 2 条（68.4 昨天67.6 被上一轮破坏成 99.9 覆盖今天）。云端备份有 3 条(68.4+67.6+当时的当天68.4?)——直接看恢复前后
  out.before = JSON.parse(localStorage.getItem('ww.weights') || '[]').map((w) => w.date.slice(5) + ':' + w.weight)
  location.hash = '#/mine'; await wait(800)
  $$('.cell').find((x) => x.textContent.includes('WebDAV 云备份'))?.click(); await wait(600)
  const sheet = document.querySelector('.sheet')
  ;[...sheet.querySelectorAll('button')].find((b) => b.textContent.includes('从云端恢复'))?.click()
  await wait(2200)
  const weights = JSON.parse(localStorage.getItem('ww.weights') || '[]')
  out.after = weights.map((w) => w.date.slice(5) + ':' + w.weight)
  // 恢复后若云端有 99.9（自动备份又把脏数据推上去了）也属正常——关键验证 GET→本地回写链路
  out.restored = out.after.join(',') !== out.before.join(',')
  return out
})()`)
console.log(JSON.stringify(r, null, 1))
ws.close()
process.exit(0)
