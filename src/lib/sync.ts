/**
 * 云端同步层（离线优先）
 *
 * 生产对接：将 CLOUD_API_BASE 指向你的后端（或 Serverless 函数），
 * 实现 GET/PUT /api/sync/:userId 快照接口即可，协议见 docs/API.md。
 * 当前实现内置「本地云模拟」：以 ww.cloud.* 键充当云端存储，
 * 完整走一遍 推送→拉取→合并→校验 流程，接口签名与真实后端一致。
 */

import { lsGet, lsSet, getDeviceId } from './storage'
import type { CloudSnapshot, SyncLog, Plan } from './types'
import { uid } from './format'

export const CLOUD_API_BASE = '' // 例：https://api.example.com；留空 = 本地云模拟

const cloudKey = (userId: string) => `cloud.${userId}`

/** 模拟网络延迟 */
const netDelay = () => new Promise((r) => setTimeout(r, 260 + Math.random() * 340))

export function isRealCloud(): boolean {
  return CLOUD_API_BASE !== ''
}

async function cloudGet(userId: string): Promise<CloudSnapshot | null> {
  if (isRealCloud()) {
    const res = await fetch(`${CLOUD_API_BASE}/api/sync/${userId}`, { method: 'GET' })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as CloudSnapshot
  }
  await netDelay()
  return lsGet<CloudSnapshot | null>(cloudKey(userId), null)
}

async function cloudPut(snapshot: CloudSnapshot): Promise<void> {
  if (isRealCloud()) {
    const res = await fetch(`${CLOUD_API_BASE}/api/sync/${snapshot.userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return
  }
  await netDelay()
  lsSet(cloudKey(snapshot.userId), snapshot)
}

/** 单对象合并：updatedAt 新者胜（数据级时间戳，解决同设备连续同步覆盖问题） */
function mergeObj<T extends { updatedAt?: string }>(local?: T, remote?: T): T | undefined {
  if (!local) return remote
  if (!remote) return local
  return (remote.updatedAt ?? '') > (local.updatedAt ?? '') ? remote : local
}

/** 数组合并：按 date/id 去重，updatedAt 新者胜 */
function mergeById<T extends { date?: string; id?: string; updatedAt?: string }>(local: T[], remote: T[], keyOf: (x: T) => string): T[] {
  const map = new Map<string, T>()
  for (const item of local) map.set(keyOf(item), item)
  for (const item of remote) {
    const k = keyOf(item)
    const exist = map.get(k)
    if (!exist || (item.updatedAt ?? '') > (exist.updatedAt ?? '')) map.set(k, item)
  }
  return [...map.values()].sort((a, b) => (keyOf(a) < keyOf(b) ? -1 : 1))
}

export interface SyncResult {
  ok: boolean
  pushed: number
  pulled: number
  message: string
  log: SyncLog
  /** 合并后的最终快照（作为唯一真源回写本地） */
  merged?: CloudSnapshot
}

/**
 * 完整同步：推送本地数据 → 拉取云端快照 → 字段级合并 → 回写云端
 * 合并策略：集合按 date/id 去重新者胜；单对象（user/plan）按快照时间新者胜
 * 返回 merged 供调用方整体采纳，保证多端一致
 */
export async function syncNow(userId: string, local: CloudSnapshot, lastSyncAt: string | null): Promise<SyncResult> {
  try {
    const remote = await cloudGet(userId)

    let pushed = 0
    let pulled = 0
    let merged: CloudSnapshot

    if (!remote) {
      // 首次上云：整体推送
      merged = { ...local, savedAt: new Date().toISOString(), deviceId: getDeviceId() }
      pushed = (local.weights?.length ?? 0) + (local.photos?.length ?? 0)
      await cloudPut(merged)
    } else {
      // 数据级合并：user/plan 各按自身 updatedAt 新者胜
      const user = mergeObj(local.user, remote.user)
      const plan: Plan | null | undefined = mergeObj(
        local.plan ? { ...local.plan } : undefined,
        remote.plan ? { ...remote.plan } : undefined
      )

      const weights = mergeById(local.weights ?? [], remote.weights ?? [], (w) => w.date)
      const photos = mergeById(local.photos ?? [], remote.photos ?? [], (p) => p.id ?? p.date)

      pushed =
        (local.weights ?? []).filter((w) => !lastSyncAt || w.updatedAt > lastSyncAt).length +
        (local.photos ?? []).filter((p) => !lastSyncAt || (p.date ?? '') > lastSyncAt).length
      pulled =
        (remote.weights ?? []).filter((w) => {
          const l = (local.weights ?? []).find((x) => x.date === w.date)
          return (!l || w.updatedAt > l.updatedAt) && (!lastSyncAt || w.updatedAt > lastSyncAt)
        }).length +
        (remote.photos ?? []).filter((p) => !(local.photos ?? []).some((x) => x.id === p.id)).length

      merged = {
        userId,
        savedAt: new Date().toISOString(),
        deviceId: getDeviceId(),
        user: user as CloudSnapshot['user'],
        plan: plan ?? null,
        weights,
        photos
      }
      await cloudPut(merged)
    }

    const log: SyncLog = {
      id: uid('log'),
      deviceId: getDeviceId(),
      at: new Date().toISOString(),
      pushed,
      pulled,
      ok: true
    }
    return { ok: true, pushed, pulled, message: '同步完成', log, merged }
  } catch (e) {
    const log: SyncLog = { id: uid('log'), deviceId: getDeviceId(), at: new Date().toISOString(), pushed: 0, pulled: 0, ok: false, detail: String(e) }
    return { ok: false, pushed: 0, pulled: 0, message: navigator.onLine ? '同步失败，稍后自动重试' : '当前离线，恢复网络后自动同步', log }
  }
}
