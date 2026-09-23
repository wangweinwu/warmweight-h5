// 恢复验证 v2：先制造本地脏数据(55.5)→等8s自动备份覆盖云端→再改本地为77.7→恢复→本地应回到55.5
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
    const p = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    p.set.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const out = {}
  const today = (() => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') })()

  // 1) 记 55.5 → 等防抖自动备份
  location.hash = '#/home'; await wait(800)
  document.querySelector('.fab')?.click(); await wait(500)
  let qs = document.querySelector('.sheet')
  setVal(qs.querySelector('input[type=number]'), '55.5'); await wait(100)
  ;[...document.querySelectorAll('button')].find((b) => b.textContent.includes('更新') || b.textContent.includes('保存记录'))?.click()
  await wait(900)
  await new Promise((r) => setTimeout(r, 10000)) // 等 8s 防抖 + 上传

  // 2) 改本地为 77.7（不同步等防抖）
  location.hash = '#/home'; await wait(700)
  document.querySelector('.fab')?.click(); await wait(500)
  qs = document.querySelector('.sheet')
  setVal(qs.querySelector('input[type=number]'), '77.7'); await wait(100)
  ;[...document.querySelectorAll('button')].find((b) => b.textContent.includes('更新') || b.textContent.includes('保存记录'))?.click()
  await wait(900)
  out.dirty = JSON.parse(localStorage.getItem('ww.weights')).find((w) => w.date === today)?.weight

  // 3) 从云端恢复 → 应回到 55.5
  location.hash = '#/mine'; await wait(800)
  $$('.cell').find((x) => x.textContent.includes('WebDAV 云备份'))?.click(); await wait(600)
  const sheet = document.querySelector('.sheet')
  ;[...sheet.querySelectorAll('button')].find((b) => b.textContent.includes('从云端恢复'))?.click()
  await wait(2200)
  out.restored = JSON.parse(localStorage.getItem('ww.weights')).find((w) => w.date === today)?.weight
  out.success = out.dirty === 77.7 && out.restored === 55.5
  return out
})()`)
console.log(JSON.stringify(r, null, 1))
ws.close()
process.exit(0)
