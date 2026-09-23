/**
 * WebDAV 自动备份编排
 * - 数据变更后防抖 8s 自动上传快照；登录后启动时若云端较新则自动拉取
 * - 快照文件：<dir>/warmweight-backup-<userId前8位>.json
 * - 断点保护：上传失败静默重试，不打扰用户；「我的」页有状态与手动入口
 */
import { lsGet, lsSet } from './storage'
import { defaultWebdavConfig, wdGetJSON, wdPutJSON, wdTest } from './webdav'
import type { WebdavConfig } from './webdav'
import type { CloudSnapshot } from './types'

const CFG_KEY = 'webdav.config'
const LAST_PUSH_KEY = 'webdav.lastPush'

export function getWebdavConfig(): WebdavConfig {
  return { ...defaultWebdavConfig(), ...lsGet<Partial<WebdavConfig>>(CFG_KEY, {}) }
}

export function saveWebdavConfig(cfg: WebdavConfig): void {
  lsSet(CFG_KEY, cfg)
}

/** 最近一次自动备份信息（供设置页展示） */
export interface LastPushInfo {
  at: string
  ok: boolean
  detail?: string
}

export function getLastPush(): LastPushInfo | null {
  return lsGet<LastPushInfo | null>(LAST_PUSH_KEY, null)
}

let pushTimer: ReturnType<typeof setTimeout> | null = null

/** 数据变更后调用：防抖自动上传 */
export function scheduleWebdavPush(userId: string, snapshot: () => CloudSnapshot): void {
  const cfg = getWebdavConfig()
  if (!cfg.enabled || !cfg.url) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    void doPush(userId, snapshot)
  }, 8000)
}

export async function doPush(userId: string, snapshot: () => CloudSnapshot): Promise<{ ok: boolean; message: string }> {
  const cfg = getWebdavConfig()
  if (!cfg.enabled || !cfg.url) return { ok: false, message: '未启用 WebDAV' }
  try {
    const data = { ...snapshot(), savedAt: new Date().toISOString(), backupVer: 1 }
    await wdPutJSON(cfg, backupName(userId), data)
    const info = { at: new Date().toISOString(), ok: true }
    lsSet(LAST_PUSH_KEY, info)
    return { ok: true, message: '已备份到 WebDAV' }
  } catch (e) {
    const info = { at: new Date().toISOString(), ok: false, detail: String((e as Error).message) }
    lsSet(LAST_PUSH_KEY, info)
    return { ok: false, message: 'WebDAV 备份失败：' + (e as Error).message }
  }
}

export function backupName(userId: string): string {
  return `warmweight-backup-${userId.slice(0, 8)}.json`
}

export interface PullResult {
  pulled: boolean
  message: string
  snapshot?: CloudSnapshot
}

/** 启动/登录时恢复：仅当云端 savedAt 比本地 lastSyncAt 新时拉取（本地与内置云同步依然优先） */
export async function tryPullOnLogin(userId: string, localSavedAt: string | null): Promise<PullResult> {
  const cfg = getWebdavConfig()
  if (!cfg.enabled || !cfg.url) return { pulled: false, message: '未启用' }
  try {
    const remote = await wdGetJSON<CloudSnapshot & { savedAt?: string }>(cfg, backupName(userId))
    if (!remote) return { pulled: false, message: '云端暂无备份' }
    const remoteAt = remote.savedAt ?? ''
    if (localSavedAt && remoteAt <= localSavedAt) {
      return { pulled: false, message: '云端备份不比本地新，跳过' }
    }
    return { pulled: true, message: '已从 WebDAV 恢复较新备份', snapshot: remote }
  } catch (e) {
    return { pulled: false, message: 'WebDAV 读取失败：' + (e as Error).message }
  }
}

export { wdTest }
