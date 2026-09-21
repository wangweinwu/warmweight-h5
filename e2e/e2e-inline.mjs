/**
 * 一次性页内脚本：完整用户流程都在浏览器里执行，返回 JSON 报告
 */
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
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  const { writeFileSync } = await import('node:fs')
  const data = r.result?.data
  if (!data) { console.log('shot-fail:', name, JSON.stringify(r).slice(0,200)); return }
  writeFileSync(`e2e/screenshots/${name}.png`, Buffer.from(data, 'base64'))
  console.log('shot:', name)
}
const evalRaw = (expr, awaitPromise = true) =>
  send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise })

await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
await send('Page.navigate', { url: 'http://localhost:4173/#/onboarding' })
await sleep(1200)

// 清空存储重来
await evalRaw(`localStorage.clear(); location.reload(); 1`)
await sleep(1500)
await shot('01-onboarding')

const report = await evalRaw(`(async () => {
  const out = { steps: [] }
  const log = (s, v) => out.steps.push(s + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)))
  const $$ = (sel) => [...document.querySelectorAll(sel)]
  const find = (txt) => $$('#root button').find((b) => b.textContent.trim() === txt || b.textContent.includes(txt))
  const setVal = (el, val) => {
    const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    proto.set.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const waitFor = async (fn, ms = 4000) => {
    const t0 = Date.now()
    while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v } catch {} await wait(120) }
    return null
  }

  try {
    /* 引导 3 页 */
    for (const label of ['下一页', '下一页', '开始使用']) {
      const b = find(label)
      if (!b) return Object.assign(out, { fatal: 'guide btn missing: ' + label })
      b.click()
      await wait(350)
    }
    await waitFor(() => location.hash.includes('auth'))
    log('guide-done', location.hash)

    /* 注册 */
    find('注册新账号')?.click()
    await wait(400)
    const inputs = $$('input')
    if (inputs.length < 4) return Object.assign(out, { fatal: 'register inputs=' + inputs.length })
    setVal(inputs[0], '小暖')
    setVal(inputs[1], 'demo@warmweight.cn')
    setVal(inputs[2], 'demo123456')
    setVal(inputs[3], 'demo123456')
    find('注册并开始').click()
    await waitFor(() => !location.hash.includes('auth'), 6000)
    await wait(900)
    log('register-hash', location.hash)
    log('users', Object.keys(JSON.parse(localStorage.getItem('ww.users') || '{}')).length)

    /* 资料补全页（若路由未动但已登录，手动跳转） */
    if (!location.hash.includes('profile-setup') && localStorage.getItem('ww.currentUserId')) {
      location.hash = '#/profile-setup'
      await wait(700)
    }
    if (location.hash.includes('profile-setup')) {
      const pin = $$('input')
      // 昵称、身高
      const numInput = pin.find((i) => i.type === 'number')
      if (numInput) setVal(numInput, '170')
      const male = $$('#root .chip').find((c) => c.textContent.trim() === '男')
      if (male) male.click()
      await wait(200)
      find('保存并设定减重计划')?.click()
      await waitFor(() => location.hash.includes('plan'), 5000)
      log('profile-setup-hash', location.hash)
    }

    /* —— 记录 3 次体重（走 FAB）—— */
    const days = [
      { off: -2, w: '72.4' },
      { off: -1, w: '71.8' },
      { off: 0, w: '71.2' }
    ]
    // 从 plan 页回首页
    if (!localStorage.getItem('ww.currentUserId')) return Object.assign(out, { fatal: 'not logged in before weights' })
    location.hash = '#/home'
    await wait(900)
    for (const { off, w } of days) {
      const fabBtn = document.querySelector('.fab')
      if (!fabBtn) return Object.assign(out, { fatal: 'fab missing, hash=' + location.hash })
      fabBtn.click()
      await wait(500)
      const sheet = await waitFor(() => document.querySelector('.sheet'), 3000)
      if (!sheet) return Object.assign(out, { fatal: 'sheet missing, hash=' + location.hash + ' html=' + document.body.innerHTML.slice(0, 200) })
      const dateInput = sheet.querySelector('input[type=date]')
      const d = new Date()
      d.setDate(d.getDate() + off)
      const s = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
      setVal(dateInput, s)
      await wait(150)
      const numInput = sheet.querySelector('input[type=number]')
      setVal(numInput, w)
      await wait(150)
      out['shot-here-' + off] = true
      const saveBtn = $$('button').find((b) => (b.textContent.includes('保存记录') || b.textContent.includes('更新')))
      saveBtn?.click()
      await wait(750)
    }
    log('weights', JSON.parse(localStorage.getItem('ww.weights') || '[]').length)

    /* 设定计划（若不在编辑态则已在展示态） */
    location.hash = '#/plan'
    await wait(800)
    out['plan-page-html-has-step1'] = !!find('目标体重')
    const savePlanBtn = find('保存计划')
    if (savePlanBtn) {
      savePlanBtn.click()
      await wait(900)
    }
    log('plan', JSON.parse(localStorage.getItem('ww.plan')))
    await new Promise((r) => setTimeout(r, 100))

    /* 追踪页 */
    location.hash = '#/track'
    await wait(1000)
    const weekTab = $$('#root [role=tab]').find((t) => t.textContent === '周')
    if (weekTab) weekTab.click()
    await wait(500)

    /* 首页 */
    location.hash = '#/home'
    await wait(1000)

    /* 食物 */
    location.hash = '#/foods'
    await wait(800)
    const search = document.querySelector('.search-box input')
    setVal(search, '鸡')
    await wait(500)
    document.querySelector('.food-item summary')?.click()
    await wait(400)

    /* 运动 */
    location.hash = '#/sports'
    await wait(800)
    const jump = $$('#root .cell').find((c) => c.textContent.includes('跳绳(快)'))
    if (jump) jump.click()
    await wait(600)

    /* 照片页 */
    location.hash = '#/gallery'
    await wait(800)

    /* 我的 */
    location.hash = '#/mine'
    await wait(900)

    /* 离线 */
    window.dispatchEvent(new Event('offline'))
    await wait(400)
    window.dispatchEvent(new Event('online'))
    await wait(400)

    out.final = {
      hash: location.hash,
      users: Object.keys(JSON.parse(localStorage.getItem('ww.users') || '{}')).length,
      weights: JSON.parse(localStorage.getItem('ww.weights') || '[]').length,
      plan: JSON.parse(localStorage.getItem('ww.plan')),
      profile: JSON.parse(localStorage.getItem('ww.userProfile')),
      syncLogs: (JSON.parse(localStorage.getItem('ww.syncLogs') || '[]')).length,
      lastSyncAt: !!localStorage.getItem('ww.lastSyncAt')
    }
  } catch (e) {
    out.fatal = e.message
  }
  return out
})()`, true)

const rep = report.result?.result?.value
console.log('REPORT:', JSON.stringify(typeof rep === 'string' ? JSON.parse(rep) : rep, null, 1).slice(0, 1800))

// 序列截图（当前停留页面 + 关键页面回访）
const pages = [
  ['18-mine-final', '#/mine'],
  ['19-home-final', '#/home'],
  ['20-track-final', '#/track']
]
for (const [name, hash] of pages) {
  await evalRaw(`location.hash = '${hash}'; 1`)
  await sleep(1000)
  await shot(name)
}
ws.close()
process.exit(0)
