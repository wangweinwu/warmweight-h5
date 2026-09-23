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
// 诊断当前页面状态
console.log(JSON.stringify(await evalV(`({
  hash: location.hash,
  hasGoalInput: !!document.querySelector('input[aria-label="目标体重直接输入"]'),
  stepNos: document.querySelectorAll('.step-no').length,
  bodyHead: document.body.innerText.slice(0, 80).replace(/\\n/g, '|')
})`), null, 1))
ws.close(); process.exit(0)
