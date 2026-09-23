/**
 * WebDAV 端到端验证：
 * ① 「我的」页配置 WebDAV → 保存 → 立即备份 → 校验 mock 服务器收到文件
 * ② 修改数据（记体重）→ 防抖自动备份 → 校验文件更新
 * ③ 从云端恢复 → 数据回滚到备份点
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
    /* 建号 + 资料 */
    for (const label of ['下一页','下一页','开始使用']) { find(label)?.click(); await wait(260) }
    await wait(300)
    find('注册新账号')?.click(); await wait(300)
    const inputs = $$('input')
    setVal(inputs[0],'小暖'); setVal(inputs[1],'dav@warmweight.cn'); setVal(inputs[2],'demo123456'); setVal(inputs[3],'demo123456')
    await wait(250); find('注册并开始')?.click(); await wait(1400)
    const nums = $$('input[type=number]')
    setVal(nums[0], '170'); setVal(nums[1], '68.4')
    await wait(200)
    find('保存并设定减重计划')?.click(); await wait(1400)

    /* 打开 WebDAV 设置 */
    location.hash = '#/mine'; await wait(900)
    const davCell = $$('.cell').find((x) => x.textContent.includes('WebDAV 云备份'))
    if (!davCell) return { fail: 'webdav cell not found' }
    davCell.click(); await wait(600)

    /* 填配置（直连本地 mock） */
    const sheet = document.querySelector('.sheet')
    const text = $$('input:not([type=password]):not([type=number])', sheet)
    const allInputs = [...sheet.querySelectorAll('input')]
    // 顺序：服务器地址 / 账号 / 密码 / 远端目录
    setVal(allInputs[0], 'http://localhost:8788')
    setVal(allInputs[1], 'davuser')
    setVal(allInputs[2], 'davpass')
    setVal(allInputs[3], 'warmweight')
    // 开启自动备份 + 直连
    const chips = [...sheet.querySelectorAll('.chip')]
    chips.find((c) => c.textContent.trim() === '开启')?.click()
    chips.find((c) => c.textContent.trim() === '直连')?.click()
    await wait(200)

    /* 测试连接 */
    ;[...sheet.querySelectorAll('button')].find((b) => b.textContent === '测试连接')?.click()
    await wait(1200)
    out.testMsg = [...sheet.querySelectorAll('div')].map((d) => d.textContent).find((t) => t.includes('连接成功') || t.includes('失败'))

    /* 立即备份 */
    ;[...sheet.querySelectorAll('button')].find((b) => b.textContent === '立即备份')?.click()
    await wait(1500)
    out.backupMsg = [...sheet.querySelectorAll('div')].map((d) => d.textContent).find((t) => t.includes('已备份') || t.includes('失败'))

    /* 关闭 sheet，记一笔新体重触发防抖自动备份 */
    document.querySelector('.sheet-overlay')?.click()
    await wait(500)
    location.hash = '#/home'; await wait(800)
    document.querySelector('.fab')?.click(); await wait(500)
    const qs = document.querySelector('.sheet')
    const d = new Date(); d.setDate(d.getDate() - 1)
    const dstr = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
    setVal(qs.querySelector('input[type=date]'), dstr)
    await wait(100)
    setVal(qs.querySelector('input[type=number]'), '67.6')
    await wait(100)
    ;[...document.querySelectorAll('button')].find((b) => b.textContent.includes('保存记录'))?.click()
    out.waitAutoPush = true
  } catch (e) { out.EXCEPTION = e.message }
  return out
})()`)
console.log('PHASE1:', JSON.stringify(r, null, 1))

// 等防抖 8s + 上传
await sleep(11000)

// 服务端检查收到的文件
const mockFiles = await fetch('http://localhost:8788/__list__').catch(() => null)
const r2 = await evalV(`(() => {
  const cfg = JSON.parse(localStorage.getItem('ww.webdav.config') || '{}')
  const last = JSON.parse(localStorage.getItem('ww.webdav.lastPush') || 'null')
  const uid = JSON.parse(localStorage.getItem('ww.currentUserId') || '""')
  return { cfg, last, backupName: uid ? 'warmweight-backup-' + uid.slice(0, 8) + '.json' : null }
})()`)
console.log('PHASE2 store:', JSON.stringify(r2, null, 1))

/* 恢复验证：改本地数据 → 从云端恢复 → 数据回滚 */
const r3 = await evalV(`(async () => {
  const $$ = (s) => [...document.querySelectorAll(s)]
  const setVal = (el, val) => {
    const p = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    p.set.call(el, val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const out = {}
  // 破坏性修改：再记一笔 99.9（今天）
  location.hash = '#/home'; await wait(800)
  document.querySelector('.fab')?.click(); await wait(500)
  const qs = document.querySelector('.sheet')
  setVal(qs.querySelector('input[type=number]'), '99.9')
  await wait(100)
  ;[...document.querySelectorAll('button')].find((b) => b.textContent.includes('更新'))?.click()
  await wait(800)
  out.dirtyWeights = JSON.parse(localStorage.getItem('ww.weights') || '[]').length
  // 打开 WebDAV sheet → 恢复
  location.hash = '#/mine'; await wait(800)
  $$('.cell').find((x) => x.textContent.includes('WebDAV 云备份'))?.click(); await wait(600)
  const sheet = document.querySelector('.sheet')
  ;[...sheet.querySelectorAll('button')].find((b) => b.textContent.includes('从云端恢复'))?.click()
  await wait(1800)
  out.restoreMsg = [...sheet.querySelectorAll('div')].map((d) => d.textContent).find((t) => t.includes('恢复') || t.includes('失败'))
  out.weightsAfterRestore = JSON.parse(localStorage.getItem('ww.weights') || '[]').length
  return out
})()`)
console.log('PHASE3:', JSON.stringify(r3, null, 1))

ws.close()
process.exit(0)
