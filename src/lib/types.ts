/** 核心领域类型定义 */

export type Gender = 'male' | 'female'

export interface User {
  id: string
  email: string
  passwordHash: string // sha-256 hex；demo 环境本地哈希，云端由服务端接管
  nickname: string
  gender: Gender | ''
  heightCm: number | 0
  avatar?: string // dataURL（已压缩）
  createdAt: string
  updatedAt?: string // 资料最后修改时间（多端合并用）
}

/** 减重计划 */
export interface Plan {
  startWeight: number
  goalWeight: number
  startDate: string // YYYY-MM-DD
  unit: 'week' | 'month' // 周期单位
  duration: number // 周/月数
  updatedAt?: string // 计划最后修改时间（多端合并用）
}

/** 单日体重记录 */
export interface WeightEntry {
  date: string // YYYY-MM-DD
  weight: number // kg，1 位小数
  note?: string
  updatedAt: string
}

/** 体型照片 */
export interface PhotoEntry {
  id: string
  date: string
  thumb: string // dataURL 缩略图（时间轴/对比用）
  full: string // dataURL 原图（压缩后）
  weight?: number
  note?: string
}

export type FoodCategory = '主食' | '蔬菜' | '水果' | '肉蛋' | '水产' | '豆奶' | '零食' | '饮品'

export interface Food {
  name: string
  category: FoodCategory
  /** 每 100g 可食部 */
  kcal: number
  protein: number
  fat: number
  carb: number
  /** 血糖生成指数 */
  gi: number
  /** 常见一份的重量(g)与名称 */
  serving: { label: string; grams: number }
}

export type SportCategory = '步行' | '跑步' | '骑行' | '球类' | '力量' | '操课' | '游泳' | '日常'

export interface Sport {
  name: string
  category: SportCategory
  /** MET 值： kcal/h/kg = MET */
  met: number
}

/** 同步操作日志（多端一致性校验用） */
export interface SyncLog {
  id: string
  deviceId: string
  at: string
  pushed: number
  pulled: number
  ok: boolean
  detail?: string
}

/** 云端快照（localStorage 模拟的云存储结构） */
export interface CloudSnapshot {
  userId: string
  savedAt: string
  deviceId: string
  user?: Partial<User>
  plan?: Plan | null
  weights?: WeightEntry[]
  photos?: PhotoEntry[]
}

export interface DeviceInfo {
  id: string
  name: string
  createdAt: string
}
