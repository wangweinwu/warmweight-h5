/**
 * 端到端流程验证脚本（CDP 驱动 headless chromium）
 * 覆盖：引导 → 注册 → 资料补全 → 记录体重×3 → 设定计划 → 追踪页 → 查询页 → 我的页
 */
const CDP_PORT = 9223
const BASE = 'http://localhost:4173'

async function getWsUrl() {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)
  const tabs = await res.json()
  const page = tabs.find((t) => t.type === 'page')
  return page.webSocketDebuggerUrl
}

class CDPClient {
  constructor(ws) {
    this.ws = ws
    this.id = 0
    this.pending = new Map()
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
      }
    })
  }
  send(method, params = {}) {
    const id = ++this.id
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }))
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error('page error: ' + JSON.stringify(r.exceptionDetails).slice(0, 300))
    return r.result.value
  }
  async shot(name) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' })
    const { writeFileSync } = await import('node:fs')
    writeFileSync(`e2e/screenshots/${name}.png`, Buffer.from(r.data, 'base64'))
    console.log('shot:', name)
  }
  async click(selector) {
    await this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)})
      if (!el) throw new Error('not found: ${selector}')
      el.click()
    })()`)
  }
  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms))
  }
}

async function main() {
  const wsUrl = await getWsUrl()
  const ws = new WebSocket(wsUrl)
  await new Promise((r) => (ws.onopen = r))
  const c = new CDPClient(ws)

  await c.send('Page.enable')
  await c.send('Runtime.enable')
  await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })

  /* 1. 引导页 */
  await c.send('Page.navigate', { url: BASE + '/#/onboarding' })
  await c.sleep(900)
  // 清空 storage 确保全新状态
  await c.eval(`localStorage.clear(); location.reload(); 'ok'`)
  await c.sleep(900)
  await c.shot('01-onboarding')

  // 翻 3 页引导
  for (let i = 0; i < 3; i++) {
    const btns = await c.eval(`[...document.querySelectorAll('button')].map(b=>b.textContent)`)
    const target = btns.find((t) => t.includes('下一页') || t.includes('开始使用'))
    await c.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(target)}).click(); 'ok'`)
    await c.sleep(400)
  }
  // 现在应在 /auth
  await c.sleep(500)
  console.log('after onboarding hash:', await c.eval('location.hash'))
  await c.shot('02-auth')

  /* 2. 注册（免验证码） */
  await c.eval(`(() => {
    const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='注册新账号')
    if (!b) throw new Error('register-link not found')
    b.click(); return 'ok'
  })()`)
  await c.sleep(300)
  const fillRes = await c.eval(`(() => {
    try {
      const set=(el,val)=>{const proto=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value');proto.set.call(el,val);el.dispatchEvent(new Event('input',{bubbles:true}))}
      const inputs=document.querySelectorAll('input')
      if (inputs.length < 4) return 'wait-inputs:'+inputs.length
      set(inputs[0],'小暖')
      set(inputs[1],'demo@warmweight.cn')
      set(inputs[2],'demo123456')
      set(inputs[3],'demo123456')
      return 'ok'
    } catch(e) { return 'ERR:' + e.message }
  })()`)
  console.log('fillRegister:', fillRes)
  await c.sleep(300)
  await c.shot('03-register')
  await c.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('注册并开始')).click(); 'ok'`)
  await c.sleep(1600)
  console.log('after register hash:', await c.eval('location.hash'))
  await c.shot('04-home-fresh')

  /* 3. 记录 3 次体重（用 FAB → 快速记录 sheet） */
  const dayOffsets = [
    { off: -2, w: 72.4 },
    { off: -1, w: 71.8 },
    { off: 0, w: 71.2 }
  ]
  for (const { off, w } of dayOffsets) {
    await c.eval(`document.querySelector('.fab').click(); 'ok'`)
    await c.sleep(500)
    await c.eval(`(() => {
      const set=(el,val)=>{const proto=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value');proto.set.call(el,val);el.dispatchEvent(new Event('input',{bubbles:true}))}
      const sheet=document.querySelector('.sheet')
      const dateInput=sheet.querySelector('input[type="date"]')
      const d=new Date(); d.setDate(d.getDate()+(${off}))
      const s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
      set(dateInput,s); dateInput.dispatchEvent(new Event('change',{bubbles:true}))
      const numInput=sheet.querySelector('input[type="number"]')
      set(numInput,'${w}')
    })()`)
    await c.sleep(250)
    await c.shot(off === 0 ? '05-quick-weight' : `05-quick-weight-${off}`)
    await c.eval(`[...document.querySelectorAll('.sheet button')].find(b=>b.textContent.includes('保存')||b.textContent.includes('更新')).click(); 'ok'`)
    await c.sleep(700)
  }
  console.log('weights recorded:', await c.eval(`JSON.parse(localStorage.getItem('ww.weights')||'[]').length`))

  /* 4. 身高先补上（首页提示卡 → 我的页方式：直接走 UI） */
  await c.send('Page.navigate', { url: BASE + '/#/mine' })
  await c.sleep(700)
  await c.eval(`[...document.querySelectorAll('.cell')].find(x=>x.textContent.includes('个人信息')).click(); 'ok'`)
  await c.sleep(500)
  await c.eval(`(() => {
    const set=(el,val)=>{const proto=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value');proto.set.call(el,val);el.dispatchEvent(new Event('input',{bubbles:true}))}
    const sheet=document.querySelector('.sheet')
    const nick=sheet.querySelector('input:not([type=number])')
    set(nick,'小暖')
    const h=sheet.querySelector('input[type=number]')
    set(h,'170')
    // 选性别
    ;[...sheet.querySelectorAll('.chip')].find(x=>x.textContent==='男').click()
  })()`)
  await c.sleep(200)
  await c.shot('06-profile-edit')
  await c.eval(`[...document.querySelectorAll('.sheet button')].find(b=>b.textContent==='保存').click(); 'ok'`)
  await c.sleep(700)

  /* 5. 设定计划 */
  await c.send('Page.navigate', { url: BASE + '/#/plan' })
  await c.sleep(800)
  await c.shot('07-plan-edit')
  await c.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='保存计划').click(); 'ok'`)
  await c.sleep(800)
  await c.shot('08-plan-done')

  /* 6. 追踪页（日历+曲线） */
  await c.send('Page.navigate', { url: BASE + '/#/track' })
  await c.sleep(900)
  await c.shot('09-track-month')
  // 切周视图
  await c.eval(`[...document.querySelectorAll('[role=tab]')].find(t=>t.textContent==='周').click(); 'ok'`)
  await c.sleep(400)
  await c.shot('10-track-week')

  /* 7. 首页总览 */
  await c.send('Page.navigate', { url: BASE + '/#/home' })
  await c.sleep(900)
  await c.shot('11-home-overview')

  /* 8. 食物查询 */
  await c.send('Page.navigate', { url: BASE + '/#/foods' })
  await c.sleep(700)
  await c.eval(`(() => {
    const set=(el,val)=>{const proto=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value');proto.set.call(el,val);el.dispatchEvent(new Event('input',{bubbles:true}))}
    set(document.querySelector('.search-box input'),'鸡')
  })()`)
  await c.sleep(400)
  await c.shot('12-foods-search')
  // 展开第一项
  await c.eval(`document.querySelector('.food-item summary')?.click(); 'ok'`)
  await c.sleep(300)
  await c.shot('13-foods-detail')

  /* 9. 运动查询 */
  await c.send('Page.navigate', { url: BASE + '/#/sports' })
  await c.sleep(700)
  await c.eval(`[...document.querySelectorAll('.cell')].find(x=>x.textContent.includes('跳绳'))?.click(); 'ok'`)
  await c.sleep(500)
  await c.shot('14-sports')

  /* 10. 照片页 */
  await c.send('Page.navigate', { url: BASE + '/#/gallery' })
  await c.sleep(700)
  await c.shot('15-gallery-empty')

  /* 11. 我的页 + 同步中心 */
  await c.send('Page.navigate', { url: BASE + '/#/mine' })
  await c.sleep(700)
  await c.shot('16-mine')

  /* 12. 离线模拟 */
  await c.eval(`window.dispatchEvent(new Event('offline')); 'ok'`)
  await c.sleep(400)
  await c.shot('17-offline-banner')
  await c.eval(`window.dispatchEvent(new Event('online')); 'ok'`)

  /* 校验关键数据 */
  const report = await c.eval(`(() => {
    const j=(k)=>JSON.parse(localStorage.getItem('ww.'+k)||'null')
    return JSON.stringify({
      users: Object.keys(j('users')||{}).length,
      weights: (j('weights')||[]).length,
      plan: j('plan'),
      profile: { nick: j('userProfile')?.nickname, h: j('userProfile')?.heightCm, g: j('userProfile')?.gender },
      syncLogs: (j('syncLogs')||[]).length,
      lastSyncAt: !!j('lastSyncAt')
    })
  })()`)
  console.log('DATA REPORT:', report)

  ws.close()
}

main().catch((e) => {
  console.error('E2E FAILED:', e.message)
  process.exit(1)
})
