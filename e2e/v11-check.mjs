// 回归 v1.1：①资料补全含当前体重 ②计划页可直接输入起始/目标体重 ③全流程不受影响
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
    /* 引导 → 注册 */
    for (const label of ['下一页','下一页','开始使用']) { find(label)?.click(); await wait(260) }
    await wait(300)
    find('注册新账号')?.click(); await wait(300)
    const inputs = $$('input')
    setVal(inputs[0],'小暖'); setVal(inputs[1],'v11@warmweight.cn'); setVal(inputs[2],'demo123456'); setVal(inputs[3],'demo123456')
    await wait(250); find('注册并开始')?.click(); await wait(1500)

    /* ① 资料补全：含当前体重输入 */
    out.setupInputs = $$('input').length  // 期望: 昵称+身高+体重=3
    out.hasWeightField = document.body.innerText.includes('当前体重')
    const nums = $$('input[type=number]')
    out.numInputs = nums.length // 身高+体重 = 2
    setVal(nums[0], '170')       // 身高
    setVal(nums[1], '68.4')      // 当前体重
    $$('.chip').find((c) => c.textContent.trim() === '男')?.click()
    await wait(200)
    find('保存并设定减重计划')?.click(); await wait(1600)
    out.profileTo = location.hash

    /* ①验证: 体重已写入当日记录 */
    const todayKey = (() => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') })()
    const weights = JSON.parse(localStorage.getItem('ww.weights') || '[]')
    out.todayWeightWritten = weights.find((w) => w.date === todayKey)?.weight // 期望 68.4

    /* ② 计划页：起始体重可改 + 目标体重可输入 */
    location.hash = '#/plan'; await wait(900)
    out.planShowsStartCard = document.body.innerText.includes('起始体重')
    const planNums = $$('.card input[type=number]')
    // 起始体重输入框当前值应为 68.4（来自记录）
    out.startInputValue = planNums[0]?.value
    // 修改起始体重为 70
    setVal(planNums[0], '70')
    await wait(200)
    // 目标体重直接输入（第 1 步卡片中的输入框）
    const goalInput = $$('input[aria-label="目标体重直接输入"]')[0]
    out.goalInputExists = !!goalInput
    setVal(goalInput, '63')
    await wait(300)
    // 保存
    find('保存计划')?.click(); await wait(1400)
    const plan = JSON.parse(localStorage.getItem('ww.plan'))
    out.planStart = plan?.startWeight   // 期望 70
    out.planGoal = plan?.goalWeight     // 期望 63
    /* ②验证: 起始体重同步为当日记录 */
    const weights2 = JSON.parse(localStorage.getItem('ww.weights') || '[]')
    out.todayWeightAfterPlan = weights2.find((w) => w.date === todayKey)?.weight // 期望 70
    /* ①验证: 资料里身高 */
    const prof = JSON.parse(localStorage.getItem('ww.userProfile'))
    out.profileH = prof.heightCm

    /* ③ Stepper 直接输入验证（快速记录 sheet 里） */
    location.hash = '#/home'; await wait(800)
    document.querySelector('.fab')?.click(); await wait(500)
    const sheet = document.querySelector('.sheet')
    const sheetNum = sheet.querySelector('input[type=number]')
    const stepperSpan = sheet.querySelector('.stepper span')
    out.stepperEditable = stepperSpan?.textContent.includes('71') && getComputedStyle(stepperSpan).cursor === 'text'
    // 保存关闭
    $$('button').find((b) => b.textContent.includes('更新') || b.textContent.includes('保存记录'))?.click()
    await wait(700)
  } catch (e) { out.EXCEPTION = e.message }
  return out
})()`)
console.log(JSON.stringify(r, null, 1))
ws.close()
process.exit(0)
