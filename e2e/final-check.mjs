// 最终回归：完整流程 + 我的页一致性 + 密码找回
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

await send('Page.navigate', { url: 'http://localhost:4173/#/onboarding' })
await sleep(800)
await evalV(`localStorage.clear(); location.reload(); 1`)
await sleep(1600)
const r = await evalV(`(async () => { const $$ = (s) => [...document.querySelectorAll(s)]
  const find = (t) => $$('button').find((b) => b.textContent.trim() === t)
  const setVal = (el, val) => { const p = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value'); p.set.call(el,val); el.dispatchEvent(new Event('input',{bubbles:true})) }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const out = {}
  try {
  for (const label of ['下一页','下一页','开始使用']) { find(label)?.click(); await wait(260) }
  await wait(300)
  find('注册新账号')?.click(); await wait(300)
  const inputs = $$('input')
  setVal(inputs[0],'小暖'); setVal(inputs[1],'v1@warmweight.cn'); setVal(inputs[2],'demo123456'); setVal(inputs[3],'demo123456')
  await wait(250); find('注册并开始')?.click(); await wait(1500)
  out.registerTo = location.hash
  const numInput = $$('input').find((i) => i.type === 'number')
  setVal(numInput, '170')
  $$('.chip').find((c) => c.textContent.trim() === '男')?.click()
  await wait(200)
  find('保存并设定减重计划')?.click(); await wait(1600)
  out.profileTo = location.hash
  location.hash = '#/home'; await wait(800)
  for (const [off, w] of [[-2,'72.4'],[-1,'71.8'],[0,'71.2']]) {
    document.querySelector('.fab')?.click(); await wait(430)
    const sheet = document.querySelector('.sheet')
    const dateInput = sheet.querySelector('input[type=date]')
    const d = new Date(); d.setDate(d.getDate() + off)
    const s = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
    setVal(dateInput, s); await wait(100)
    setVal(sheet.querySelector('input[type=number]'), w); await wait(100)
    $$('button').find((b) => b.textContent.includes('保存记录') || b.textContent.includes('更新'))?.click()
    await wait(650)
  }
  location.hash = '#/plan'; await wait(900)
  find('保存计划')?.click(); await wait(1300)
  location.hash = '#/mine'; await wait(1000)
  const mineText = document.body.innerText
  out.mineSynced = mineText.includes('上次同步')
  out.mineProfile = mineText.includes('男 · 170cm')
  out.weights = JSON.parse(localStorage.getItem('ww.weights') || '[]').length
  out.planOk = !!JSON.parse(localStorage.getItem('ww.plan'))
  // 退出登录 → 找回密码 → 新密码登录
  find('退出登录')?.click(); await wait(300)
  $$('button').find((b) => b.textContent === '退出')?.click(); await wait(700)
  out.afterLogout = location.hash
  find('忘记密码')?.click(); await wait(350)
  const fi = $$('input')
  setVal(fi[0], 'v1@warmweight.cn'); setVal(fi[1], 'newpass123'); setVal(fi[2], 'newpass123')
  await wait(200)
  find('重置密码')?.click(); await wait(900)
  setVal(fi[0], 'v1@warmweight.cn'); setVal(fi[1], 'newpass123')
  await wait(150)
  find('登录')?.click(); await wait(2200)
  out.reloginTo = location.hash
  out.reloginOk = !!localStorage.getItem('ww.currentUserId')
  } catch (e) { out.EXCEPTION = e.message } return out })()`)
console.log(JSON.stringify(r, null, 1))
ws.close()
process.exit(0)
