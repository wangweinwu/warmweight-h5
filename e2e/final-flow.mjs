// 干净状态最终回归：全部体重输入路径 + 保存
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
  if (r.result?.exceptionDetails) { console.error('PAGE error:', JSON.stringify(r.result.exceptionDetails).slice(0, 500)); return null }
  return r.result?.result?.value
}

await send('Page.navigate', { url: 'http://localhost:4173/#/onboarding' })
await sleep(800)
await evalV(`localStorage.clear(); location.reload(); 1`)
await sleep(1700)

const r = await evalV(`(async () => {
  const $$ = (s) => [...document.querySelectorAll(s)]
  const find = (t) => $$('button').find((b) => b.textContent.trim() === t)
  const sheetFind = (t) => $$('.sheet button').find((b) => b.textContent.includes(t))
  const setVal = (el, val) => {
    if (!el) throw new Error('input missing')
    const p = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    p.set.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const today = (() => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') })()
  const out = {}
  try {
    /* 注册 + 资料（当前体重 66.6 直接输入） */
    for (const label of ['下一页','下一页','开始使用']) { find(label)?.click(); await wait(260) }
    await wait(300)
    find('注册新账号')?.click(); await wait(300)
    const inputs = $$('input')
    setVal(inputs[0],'小暖'); setVal(inputs[1],'final@warmweight.cn'); setVal(inputs[2],'demo123456'); setVal(inputs[3],'demo123456')
    await wait(250); find('注册并开始')?.click(); await wait(1500)
    const nums = $$('input[type=number]')
    setVal(nums[0], '170'); setVal(nums[1], '66.6'); await wait(200)
    find('保存并设定减重计划')?.click(); await wait(1500)
    out.w1 = JSON.parse(localStorage.getItem('ww.weights')).find((w) => w.date === today)?.weight

    /* 计划：起始体重删空重输 70.5；目标 63.5（blur 提交） */
    location.hash = '#/plan'; await wait(900)
    $$('.cell').find((x) => x.textContent.includes('调整计划'))?.click(); await wait(800)
    const startInput = $$('input[aria-label="起始体重"]')[0]
    startInput.focus(); setVal(startInput, ''); await wait(120)
    out.startDeletable = startInput.value === ''
    setVal(startInput, '70.5'); await wait(120)
    const goalInput = $$('input[aria-label="目标体重直接输入"]')[0]
    goalInput.focus(); setVal(goalInput, ''); await wait(120)
    out.goalDeletable = goalInput.value === ''
    setVal(goalInput, '63.5'); await wait(120)
    goalInput.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await wait(250)
    find('保存计划')?.click(); await wait(1500)
    const plan = JSON.parse(localStorage.getItem('ww.plan'))
    out.plan = { start: plan?.startWeight, goal: plan?.goalWeight }
    out.w2 = JSON.parse(localStorage.getItem('ww.weights')).find((w) => w.date === today)?.weight

    /* FAB 快速记录 55.5（唯一的 sheet，sheet 内按钮精确定位） */
    location.hash = '#/home'; await wait(800)
    document.querySelector('.fab')?.click(); await wait(600)
    setVal(document.querySelector('.sheet input[type=number]'), '55.5'); await wait(150)
    sheetFind('更新')?.click(); await wait(2500)
    out.sheetClosed = !document.querySelector('.sheet')
    out.w3 = JSON.parse(localStorage.getItem('ww.weights')).find((w) => w.date === today)?.weight
  } catch (e) { out.EXCEPTION = e.message }
  return out
})()`)
console.log(JSON.stringify(r, null, 1))
ws.close()
process.exit(0)
