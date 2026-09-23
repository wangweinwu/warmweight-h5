// 回归：输入框可自由删除/编辑（起始体重、目标体重、Stepper、快速记录）
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

await send('Page.navigate', { url: 'http://localhost:4173/#/onboarding' })
await sleep(800)
await evalV(`localStorage.clear(); location.reload(); 1`)
await sleep(1700)

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
    /* 建号 + 资料（含当前体重 68.4） */
    for (const label of ['下一页','下一页','开始使用']) { find(label)?.click(); await wait(260) }
    await wait(300)
    find('注册新账号')?.click(); await wait(300)
    const inputs = $$('input')
    setVal(inputs[0],'小暖'); setVal(inputs[1],'v12@warmweight.cn'); setVal(inputs[2],'demo123456'); setVal(inputs[3],'demo123456')
    await wait(250); find('注册并开始')?.click(); await wait(1500)
    const nums = $$('input[type=number]')
    setVal(nums[0], '170'); setVal(nums[1], '68.4')
    $$('.chip').find((c) => c.textContent.trim() === '男')?.click()
    await wait(200)
    find('保存并设定减重计划')?.click(); await wait(1500)

    /* 计划编辑态 */
    location.hash = '#/plan'; await wait(900)
    const cell = $$('.cell').find((x) => x.textContent.includes('调整计划'))
    cell?.click(); await wait(700)

    const startInput = $$('input[aria-label="起始体重"]')[0]
    /* ★测试1: 全选删除起始体重 → 应能删空，显示"请填写起始体重" */
    startInput.focus()
    setVal(startInput, '')
    await wait(150)
    out.t1_deleted = startInput.value === ''
    out.t1_hint = document.body.innerText.includes('请填写起始体重')

    /* ★测试2: 删空后重新输入 70.5 → 生效 */
    setVal(startInput, '70.5')
    await wait(150)
    out.t2_retype = startInput.value === '70.5'

    /* ★测试3: 目标体重 → 删空再输入 63 */
    const goalInput = $$('input[aria-label="目标体重直接输入"]')[0]
    goalInput.focus()
    setVal(goalInput, '')
    await wait(150)
    out.t3_goal_deleted = goalInput.value === ''   // 草稿模式应保持空
    setVal(goalInput, '63')
    await wait(100)
    goalInput.dispatchEvent(new Event('blur'))
    await wait(250)
    out.t3_goal_committed = goalInput.value === '63' // blur 后草稿清空回显提交值

    /* 保存 → 计划与当日记录应为 70.5 / 63 */
    find('保存计划')?.click(); await wait(1400)
    const plan = JSON.parse(localStorage.getItem('ww.plan'))
    out.t4_plan = { start: plan?.startWeight, goal: plan?.goalWeight }
    const todayKey = (() => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') })()
    const weights = JSON.parse(localStorage.getItem('ww.weights') || '[]')
    out.t4_todayWeight = weights.find((w) => w.date === todayKey)?.weight

    /* ★测试5: 快速记录大输入框可删空 */
    location.hash = '#/home'; await wait(800)
    document.querySelector('.fab')?.click(); await wait(500)
    const sheet = document.querySelector('.sheet')
    const sheetNum = sheet.querySelector('input[type=number]')
    setVal(sheetNum, '')
    await wait(150)
    out.t5_sheet_deletable = sheetNum.value === ''
    $$('button').find((b) => b.textContent.includes('取消')) // 无取消按钮，直接关 sheet
    document.querySelector('.sheet-overlay')?.click()
    await wait(400)
  } catch (e) { out.EXCEPTION = e.message }
  return out
})()`)
console.log(JSON.stringify(r, null, 1))
ws.close()
process.exit(0)
