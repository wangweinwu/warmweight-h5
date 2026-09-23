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
  const find = (t) => $$('button').find((b) => b.textContent.trim() === t)
  const setVal = (el, val) => {
    if (!el) throw new Error('input missing')
    const p = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    p.set.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const out = { hash: location.hash }
  // 确保在编辑态
  if (document.querySelectorAll('.step-no').length === 0) {
    const cell = $$('.cell').find((x) => x.textContent.includes('调整计划'))
    if (cell) { cell.click(); await wait(700) }
  }
  out.editMode = document.querySelectorAll('.step-no').length > 0
  const goalInput = $$('input[aria-label="目标体重直接输入"]')[0]
  out.foundGoal = !!goalInput
  goalInput.focus()
  setVal(goalInput, '63.5')
  await wait(150)
  goalInput.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
  await wait(300)
  out.valueAfterFocusout = goalInput.value
  find('保存计划')?.click()
  await wait(1400)
  const plan = JSON.parse(localStorage.getItem('ww.plan'))
  out.planGoal = plan?.goalWeight
  return out
})()`)
console.log(JSON.stringify(r, null, 1))
ws.close()
process.exit(0)
