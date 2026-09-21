// 补充截图：食物/运动/计划展示态/引导页
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
await send('Page.navigate', { url: 'http://localhost:4173/#/onboarding' })
await sleep(1500)
const pages = [
  ['21-foods', '#/foods', 900],
  ['22-sports', '#/sports', 900],
  ['23-plan-view', '#/plan', 900],
  ['24-home', '#/home', 1000]
]
for (const [name, hash, wait] of pages) {
  await evalV(`location.hash='${hash}';1`)
  await sleep(wait)
  await shot(name)
}
ws.close(); process.exit(0)
