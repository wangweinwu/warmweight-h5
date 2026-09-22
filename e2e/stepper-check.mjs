// 单独验证 Stepper 点击数字可直接输入
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
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const out = {}
  location.hash = '#/plan'; await wait(800)
  // 计划页第0步用普通input；第1步目标体重旁的 Stepper
  const stepperSpan = $$('.stepper span')[0]
  out.spanText = stepperSpan?.textContent.trim()
  out.spanClickable = stepperSpan && getComputedStyle(stepperSpan).cursor === 'text'
  // 点击数字 → 应出现输入框
  stepperSpan?.click()
  await wait(250)
  const stepperInput = document.querySelector('.stepper .stepper-input')
  out.inputAppeared = !!stepperInput
  if (stepperInput) {
    const p = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    p.set.call(stepperInput, '58.5')
    stepperInput.dispatchEvent(new Event('input', { bubbles: true }))
    stepperInput.dispatchEvent(new Event('blur'))
    await wait(250)
  }
  out.spanAfter = $$('.stepper span')[0]?.textContent.trim()
  return out
})()`)
console.log(JSON.stringify(r, null, 1))
ws.close()
process.exit(0)
