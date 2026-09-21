/**
 * 本地持久化层：localStorage 封装 + storage 事件跨标签页同步
 * 所有业务数据带 ww. 前缀；JSON 读写容错
 */

const NS = 'ww.'

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value))
  } catch (e) {
    // 存储满：优先清理大体积缩略数据由上层处理，这里抛出让调用方感知
    throw e
  }
}

export function lsRemove(key: string): void {
  localStorage.removeItem(NS + key)
}

/** 监听其它标签页对本应用 key 的修改（多端/多标签一致性） */
export function onStorageChange(cb: (key: string) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key && e.key.startsWith(NS) && e.newValue !== e.oldValue) {
      cb(e.key.slice(NS.length))
    }
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

/** 设备标识（同步去重与日志用） */
export function getDeviceId(): string {
  let id = localStorage.getItem(NS + 'deviceId')
  if (!id) {
    id = 'dev-' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem(NS + 'deviceId', id)
  }
  return id
}

export function getDeviceName(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) return 'Android 手机'
  if (/MicroMessenger/.test(ua)) return '微信内浏览器'
  if (/Windows/.test(ua)) return 'Windows 浏览器'
  if (/Macintosh/.test(ua)) return 'Mac 浏览器'
  return '未知设备'
}
