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
const evalV = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  const { writeFileSync } = await import('node:fs')
  if (r.result?.data) { writeFileSync(`e2e/screenshots/${name}.png`, Buffer.from(r.result.data, 'base64')); console.log('shot:', name) }
}
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
// 资料补全页（含当前体重）
await send('Page.navigate', { url: 'http://localhost:4173/#/onboarding' })
await sleep(900)
await evalV(`(() => { const u = JSON.parse(localStorage.getItem('ww.users') || '{}'); const k = Object.keys(u)[0]; if (k) { localStorage.setItem('ww.currentUserId', JSON.stringify(k).replace(/"/g, '')) ; } return 1 })()`)
await evalV(`localStorage.setItem('ww.onboarded', 'true'); location.hash = '#/profile-setup'; 1`)
await sleep(900)
await shot('v11-profile-setup')
// 计划页（起始体重卡 + 目标输入）
await evalV(`location.hash = '#/plan'; 1`)
await sleep(900)
await shot('v11-plan-edit')
ws.close()
process.exit(0)
