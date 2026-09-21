// 密码找回 + 新密码登录验证
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
  if (r.error) { console.error('CDP error:', JSON.stringify(r.error)); return null }
  if (r.result?.exceptionDetails) { console.error('PAGE error:', JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return null }
  return r.result?.result?.value
}

const r = await evalV(`(async () => {
  const $$ = (s) => [...document.querySelectorAll(s)]
  const find = (t) => $$('button').find((b) => b.textContent.trim() === t)
  const setVal = (el, val) => {
    if (!el) throw new Error('input missing')
    const p = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    p.set.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const out = {}
  try {
    // 当前在 #/auth（已退出登录）
    out.hash0 = location.hash
    find('忘记密码')?.click(); await wait(400)
    out.forgotMode = !!find('重置密码')
    setVal($$('input')[0], 'v1@warmweight.cn')
    setVal($$('input')[1], 'newpass123')
    setVal($$('input')[2], 'newpass123')
    await wait(250)
    find('重置密码')?.click(); await wait(1100)
    out.backToLogin = !!find('登录')
    // 用新密码登录
    setVal($$('input')[0], 'v1@warmweight.cn')
    setVal($$('input')[1], 'newpass123')
    await wait(200)
    find('登录')?.click(); await wait(2400)
    out.reloginTo = location.hash
    out.reloginOk = !!localStorage.getItem('ww.currentUserId')
  } catch (e) { out.EXCEPTION = e.message }
  return out
})()`)
console.log(JSON.stringify(r, null, 1))
ws.close()
process.exit(0)
