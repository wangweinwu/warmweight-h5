/**
 * 全局状态：zustand store
 * 数据优先 localStorage；在线时自动/手动云同步；storage 事件保持多标签一致
 */
import { create } from 'zustand'
import { lsGet, lsSet, lsRemove, onStorageChange, getDeviceId, getDeviceName } from '@/lib/storage'
import { syncNow } from '@/lib/sync'
import { hashPassword } from '@/lib/crypto'
import { scheduleWebdavPush, tryPullOnLogin } from '@/lib/webdavSync'
import { uid, todayStr } from '@/lib/format'
import type { User, Plan, WeightEntry, PhotoEntry, SyncLog } from '@/lib/types'

interface Toast {
  id: string
  kind: 'info' | 'ok' | 'err'
  text: string
}

interface AppState {
  /* ---- 数据 ---- */
  users: Record<string, User>
  currentUserId: string | null
  plan: Plan | null
  weights: WeightEntry[]
  photos: PhotoEntry[]
  lastSyncAt: string | null
  syncing: boolean
  syncLogs: SyncLog[]
  online: boolean
  onboarded: boolean
  theme: 'light' | 'dark'
  toasts: Toast[]

  /* ---- 派生查询 ---- */
  me: () => User | null
  weightOf: (date: string) => WeightEntry | undefined

  /* ---- 认证 ---- */
  register: (email: string, password: string, nickname: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  findEmail: (email: string) => User | null
  resetPassword: (email: string, newPassword: string) => Promise<void>
  changePassword: (oldPw: string, newPw: string) => Promise<void>
  updateProfile: (patch: Partial<Pick<User, 'nickname' | 'gender' | 'heightCm' | 'avatar'>>) => Promise<void>

  /* ---- 计划与记录 ---- */
  savePlan: (plan: Plan) => void
  clearPlan: () => void
  upsertWeight: (date: string, weight: number, note?: string) => Promise<void>
  removeWeight: (date: string) => Promise<void>
  addPhoto: (photo: Omit<PhotoEntry, 'id'>) => Promise<void>
  removePhoto: (id: string) => Promise<void>

  /* ---- 同步与其它 ---- */
  sync: (silent?: boolean) => Promise<void>
  setOnline: (on: boolean) => void
  finishOnboarding: () => void
  toggleTheme: () => void
  toast: (text: string, kind?: Toast['kind']) => void
  dismissToast: (id: string) => void
}

const emptyCloudPayload = (userId: string) => ({
  userId,
  savedAt: new Date().toISOString(),
  deviceId: getDeviceId(),
  plan: null as Plan | null,
  weights: [] as WeightEntry[],
  photos: [] as PhotoEntry[]
})

/** 把当前用户数据刷入 users 表并落盘 */
function persistUsers(users: Record<string, User>) {
  lsSet('users', users)
}

export const useApp = create<AppState>((set, get) => {
  let syncQueued = false
  /* 初始状态（含 storage 恢复） */
  const init = {
    users: lsGet<Record<string, User>>('users', {}),
    currentUserId: lsGet<string | null>('currentUserId', null),
    plan: lsGet<Plan | null>('plan', null),
    weights: lsGet<WeightEntry[]>('weights', []),
    photos: lsGet<PhotoEntry[]>('photos', []),
    lastSyncAt: lsGet<string | null>('lastSyncAt', null),
    syncing: false,
    syncLogs: lsGet<SyncLog[]>('syncLogs', []),
    online: navigator.onLine,
    onboarded: lsGet<boolean>('onboarded', false),
    theme: (lsGet<'light' | 'dark'>('theme', 'light')),
    toasts: [] as Toast[]
  }
  // 若本地存在当前用户，拉平其资料（上次同步合并的结果）
  if (init.currentUserId && init.users[init.currentUserId]) {
    const u = init.users[init.currentUserId]
    const localUser = lsGet<Partial<User> | null>('userProfile', null)
    if (localUser) Object.assign(u, pickProfile(localUser))
    init.users[init.currentUserId] = u
  }

  /* 跨标签页一致性：storage 事件回灌 */
  onStorageChange((key) => {
    if (key === 'users') set({ users: lsGet('users', {}) })
    else if (key === 'plan') set({ plan: lsGet('plan', null) })
    else if (key === 'weights') set({ weights: lsGet('weights', []) })
    else if (key === 'photos') set({ photos: lsGet('photos', []) })
    else if (key === 'currentUserId') set({ currentUserId: lsGet('currentUserId', null) })
  })

  const cur = () => {
    const { currentUserId, users } = get()
    return currentUserId ? users[currentUserId] ?? null : null
  }

  /** 修改当前用户后统一落盘（打数据级时间戳供多端合并） */
  function touchUser(patch: Partial<User>) {
    const me = cur()
    if (!me) return
    const users = { ...get().users, [me.id]: { ...me, ...patch, updatedAt: new Date().toISOString() } }
    persistUsers(users)
    set({ users })
  }

  /** 业务数据落盘 */
  function persistBiz(patch: { plan?: Plan | null; weights?: WeightEntry[]; photos?: PhotoEntry[] }) {
    if ('plan' in patch) lsSet('plan', patch.plan)
    if ('weights' in patch) lsSet('weights', patch.weights)
    if ('photos' in patch) lsSet('photos', patch.photos)
  }

  /** WebDAV 自动备份：数据变更后防抖上传 */
  function webdavBackup() {
    const me = cur()
    if (!me) return
    scheduleWebdavPush(me.id, () => ({
      userId: me.id,
      savedAt: new Date().toISOString(),
      deviceId: getDeviceId(),
      user: pickProfile(cur()),
      plan: get().plan,
      weights: get().weights,
      photos: get().photos
    }))
  }

  return {
    ...init,

    me: cur,
    weightOf: (date) => get().weights.find((w) => w.date === date),

    /* ============ 认证 ============ */
    register: async (email, password, nickname) => {
      const users = get().users
      const key = email.trim().toLowerCase()
      if (Object.values(users).some((u) => u.email === key)) throw new Error('该邮箱已注册，请直接登录')
      const user: User = {
        id: uid('u'),
        email: key,
        passwordHash: await hashPassword(password),
        nickname: nickname.trim() || key.split('@')[0],
        gender: '',
        heightCm: 0,
        createdAt: new Date().toISOString()
      }
      const newUsers = { ...users, [user.id]: user }
      persistUsers(newUsers)
      lsSet('currentUserId', user.id)
      lsSet('userProfile', pickProfile(user))
      lsSet('lastSyncAt', null) // 新设备登录窗口
      set({ users: newUsers, currentUserId: user.id, plan: null, weights: [], photos: [], lastSyncAt: null })
      // 注册后自动首推
      void get().sync(true)
      webdavBackup()
      // WebDAV 有旧设备备份时不覆盖（新账号一般云端为空）
    },

    login: async (email, password) => {
      const key = email.trim().toLowerCase()
      const user = Object.values(get().users).find((u) => u.email === key)
      if (!user) throw new Error('未找到该邮箱账户')
      const hash = await hashPassword(password)
      if (hash !== user.passwordHash) throw new Error('密码不正确')
      lsSet('currentUserId', user.id)
      lsSet('userProfile', pickProfile(user))
      set({ currentUserId: user.id, plan: lsGet('plan', null), weights: lsGet('weights', []), photos: lsGet('photos', []) })
      void get().sync(true)
      // 登录时若 WebDAV 云端备份比本地新 → 自动恢复
      void tryPullOnLogin(user.id, get().lastSyncAt).then((res) => {
        if (res.pulled && res.snapshot) {
          const snap = res.snapshot
          const patch: Partial<AppState> = {}
          if (snap.plan !== undefined) { lsSet('plan', snap.plan); patch.plan = snap.plan }
          if (snap.weights) { lsSet('weights', snap.weights); patch.weights = snap.weights }
          if (snap.photos) { lsSet('photos', snap.photos); patch.photos = snap.photos }
          set(patch)
          get().toast('已从 WebDAV 恢复云端备份', 'ok')
        }
      })
    },

    logout: () => {
      lsRemove('currentUserId')
      lsRemove('userProfile')
      set({ currentUserId: null, plan: null, weights: [], photos: [] })
    },

    findEmail: (email) => Object.values(get().users).find((u) => u.email === email.trim().toLowerCase()) ?? null,

    resetPassword: async (email, newPassword) => {
      const user = get().findEmail(email)
      if (!user) throw new Error('未找到该邮箱账户')
      const hash = await hashPassword(newPassword)
      const users = { ...get().users, [user.id]: { ...user, passwordHash: hash } }
      persistUsers(users)
      set({ users })
    },

    changePassword: async (oldPw, newPw) => {
      const me = cur()
      if (!me) throw new Error('请先登录')
      const hash = await hashPassword(oldPw)
      if (hash !== me.passwordHash) throw new Error('当前密码不正确')
      const newHash = await hashPassword(newPw)
      touchUser({ passwordHash: newHash })
      void get().sync(true)
    },

    updateProfile: async (patch) => {
      touchUser(patch)
      lsSet('userProfile', pickProfile({ ...cur()!, ...patch }))
      void get().sync(true)
      webdavBackup()
    },

    /* ============ 计划与记录 ============ */
    savePlan: (plan) => {
      const stamped = { ...plan, updatedAt: new Date().toISOString() }
      persistBiz({ plan: stamped })
      set({ plan: stamped })
      void get().sync(true)
      webdavBackup()
    },

    clearPlan: () => {
      persistBiz({ plan: null })
      set({ plan: null })
      void get().sync(true)
      webdavBackup()
    },

    upsertWeight: async (date, weight, note) => {
      const list = [...get().weights]
      const idx = list.findIndex((w) => w.date === date)
      const entry: WeightEntry = { date, weight, note, updatedAt: new Date().toISOString() }
      if (idx >= 0) list[idx] = entry
      else list.push(entry)
      list.sort((a, b) => (a.date < b.date ? -1 : 1))
      persistBiz({ weights: list })
      set({ weights: list })
      void get().sync(true)
      webdavBackup()
    },

    removeWeight: async (date) => {
      const list = get().weights.filter((w) => w.date !== date)
      persistBiz({ weights: list })
      set({ weights: list })
      void get().sync(true)
      webdavBackup()
    },

    addPhoto: async (photo) => {
      const list = [...get().photos, { ...photo, id: uid('ph') }].sort((a, b) => (a.date < b.date ? -1 : 1))
      persistBiz({ photos: list })
      set({ photos: list })
      void get().sync(true)
      webdavBackup()
    },

    removePhoto: async (id) => {
      const list = get().photos.filter((p) => p.id !== id)
      persistBiz({ photos: list })
      set({ photos: list })
      void get().sync(true)
      webdavBackup()
    },

    /* ============ 同步（队列化：进行中的同步只合并请求，完成后用最新状态再跑一轮） ============ */
    sync: async (silent = false) => {
      if (!cur()) return
      if (syncQueued) {
        return // 已有排队，本轮不必重复入队
      }
      if (get().syncing) {
        syncQueued = true // 标记：当前同步结束后用最新状态补跑一轮
        return
      }
      if (!get().online) {
        if (!silent) get().toast('当前离线，恢复网络后自动同步', 'info')
        return
      }

      syncQueued = true // 防止执行期间新的并发
      do {
        syncQueued = false
        set({ syncing: true })
        const me = cur()
        if (!me) break
        const payload = {
          ...emptyCloudPayload(me.id),
          user: pickProfile(me),
          plan: get().plan,
          weights: get().weights,
          photos: get().photos
        }
        const res = await syncNow(me.id, payload, get().lastSyncAt)
        if (res.ok && res.merged) {
          const syncedAt = new Date().toISOString()
          lsSet('lastSyncAt', syncedAt)
          set({ lastSyncAt: syncedAt })
          // ★ 采纳合并结果为唯一真源（整体覆盖本地，多端一致）
          // 注意：若同步期间本地又有新写入（本字段时间戳比 merged 新），保留本地，等待下一轮补跑
          const m = res.merged
          const patch: Partial<AppState> = {}
          const localPlan = get().plan
          if (localPlan === payload.plan) {
            lsSet('plan', m.plan ?? null)
            patch.plan = m.plan ?? null
          }
          const localWeights = get().weights
          if (localWeights === payload.weights) {
            lsSet('weights', m.weights ?? [])
            patch.weights = m.weights ?? []
          } else {
            syncQueued = true
          }
          const localPhotos = get().photos
          if (localPhotos === payload.photos) {
            lsSet('photos', m.photos ?? [])
            patch.photos = m.photos ?? []
          } else {
            syncQueued = true
          }
          const meNow = cur()
          if (meNow === me) {
            const u = { ...me, ...pickProfile(m.user) }
            const users = { ...get().users, [me.id]: u }
            persistUsers(users)
            lsSet('userProfile', pickProfile(u))
            patch.users = users
          } else {
            syncQueued = true
          }
          set(patch)
          if (!silent) get().toast(`已同步 · 上行 ${res.pushed} 条 / 下行 ${res.pulled} 条`, 'ok')
        } else if (!res.ok && !silent) {
          get().toast(res.message, 'err')
        }
        const logs = [res.log, ...get().syncLogs].slice(0, 30)
        lsSet('syncLogs', logs)
        set({ syncLogs: logs, syncing: false })
      } while (syncQueued)
      set({ syncing: false })
    },

    setOnline: (on) => {
      const was = get().online
      set({ online: on })
      if (on && !was) void get().sync(true) // 恢复在线自动同步
    },

    finishOnboarding: () => {
      lsSet('onboarded', true)
      set({ onboarded: true })
    },

    toggleTheme: () => {
      const next = get().theme === 'light' ? 'dark' : 'light'
      lsSet('theme', next)
      document.documentElement.dataset.theme = next
      set({ theme: next })
    },

    toast: (text, kind = 'info') => {
      const t: Toast = { id: uid('t'), kind, text }
      set({ toasts: [...get().toasts, t] })
      setTimeout(() => get().dismissToast(t.id), 2400)
    },
    dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) })
  }

})

function pickProfile(u?: Partial<User> | null): Partial<User> | undefined {
  if (!u) return undefined
  return {
    id: u.id,
    email: u.email,
    nickname: u.nickname,
    gender: u.gender,
    heightCm: u.heightCm,
    avatar: u.avatar,
    createdAt: u.createdAt
  }
}

type CloudBox = {
  userId: string
  savedAt: string
  deviceId: string
  user?: Partial<User>
  plan?: Plan | null
  weights?: WeightEntry[]
  photos?: PhotoEntry[]
}

export { todayStr, getDeviceName }
