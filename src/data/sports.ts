import type { Sport } from '@/lib/types'

/**
 * 常见运动数据库（MET 值）
 * 参考：Compendium of Physical Activities 2011 + 《中国居民膳食指南》
 * 消耗(kcal) = MET × 1.05 × 体重(kg) × 时长(h)
 */
export const SPORT_DB: Sport[] = [
  // ===== 步行 =====
  { name: '散步(慢速)', category: '步行', met: 2.8 },
  { name: '步行(4.8km/h)', category: '步行', met: 3.5 },
  { name: '快走(5.6km/h)', category: '步行', met: 4.3 },
  { name: '竞走', category: '步行', met: 6.0 },
  { name: '遛狗', category: '步行', met: 3.0 },
  { name: '爬楼梯', category: '步行', met: 8.0 },
  { name: '下山徒步', category: '步行', met: 3.5 },
  { name: '登山徒步', category: '步行', met: 6.5 },

  // ===== 跑步 =====
  { name: '慢跑(6km/h)', category: '跑步', met: 6.0 },
  { name: '跑步(8km/h)', category: '跑步', met: 8.3 },
  { name: '跑步(9.7km/h)', category: '跑步', met: 9.8 },
  { name: '跑步(12km/h)', category: '跑步', met: 11.8 },
  { name: '越野跑', category: '跑步', met: 8.0 },
  { name: '跑步机(中速)', category: '跑步', met: 8.0 },
  { name: '间歇跑(HIIT跑)', category: '跑步', met: 10.0 },

  // ===== 骑行 =====
  { name: '骑行(<16km/h)', category: '骑行', met: 4.0 },
  { name: '骑行(16-19km/h)', category: '骑行', met: 6.8 },
  { name: '骑行(20-23km/h)', category: '骑行', met: 8.0 },
  { name: '动感单车(中强度)', category: '骑行', met: 7.0 },
  { name: '动感单车(高强度)', category: '骑行', met: 10.0 },

  // ===== 球类 =====
  { name: '羽毛球(休闲)', category: '球类', met: 4.5 },
  { name: '羽毛球(比赛)', category: '球类', met: 7.0 },
  { name: '乒乓球', category: '球类', met: 4.0 },
  { name: '篮球(半场)', category: '球类', met: 6.0 },
  { name: '篮球(全场)', category: '球类', met: 8.0 },
  { name: '足球(休闲)', category: '球类', met: 7.0 },
  { name: '网球(双打)', category: '球类', met: 5.0 },
  { name: '网球(单打)', category: '球类', met: 8.0 },
  { name: '排球', category: '球类', met: 4.0 },
  { name: '游泳(自由泳)', category: '游泳', met: 8.3 },
  { name: '游泳(蛙泳)', category: '游泳', met: 5.8 },
  { name: '游泳(仰泳)', category: '游泳', met: 7.0 },
  { name: '游泳(慢速)', category: '游泳', met: 6.0 },

  // ===== 力量 =====
  { name: '力量训练(轻)', category: '力量', met: 3.5 },
  { name: '力量训练(中)', category: '力量', met: 5.0 },
  { name: '力量训练(重)', category: '力量', met: 6.0 },
  { name: '深蹲训练', category: '力量', met: 5.0 },
  { name: '硬拉训练', category: '力量', met: 6.0 },
  { name: '俯卧撑/引体', category: '力量', met: 8.0 },
  { name: '平板支撑', category: '力量', met: 3.8 },
  { name: '壶铃训练', category: '力量', met: 9.8 },

  // ===== 操课 =====
  { name: '瑜伽(哈他)', category: '操课', met: 2.5 },
  { name: '瑜伽(流瑜伽)', category: '操课', met: 4.0 },
  { name: '普拉提', category: '操课', met: 3.8 },
  { name: '健身操(低冲击)', category: '操课', met: 5.0 },
  { name: '健身操(高冲击)', category: '操课', met: 7.0 },
  { name: '尊巴', category: '操课', met: 8.0 },
  { name: '跳绳(慢)', category: '操课', met: 8.8 },
  { name: '跳绳(快)', category: '操课', met: 12.3 },
  { name: '广场舞', category: '操课', met: 5.0 },
  { name: '广播体操', category: '操课', met: 3.5 },

  // ===== 日常 =====
  { name: '做饭', category: '日常', met: 2.5 },
  { name: '打扫房间', category: '日常', met: 3.3 },
  { name: '洗车', category: '日常', met: 3.5 },
  { name: '搬运货物', category: '日常', met: 5.0 },
  { name: '园艺', category: '日常', met: 3.8 },
  { name: '陪孩子玩(活跃)', category: '日常', met: 4.0 },
  { name: '办公(久坐)', category: '日常', met: 1.3 },
  { name: '站立办公', category: '日常', met: 1.8 },
]

export const SPORT_CATEGORIES = ['步行', '跑步', '骑行', '球类', '力量', '操课', '游泳', '日常'] as const

/** 计算运动消耗：MET × 1.05 × 体重 × 小时 */
export function calcBurn(met: number, weightKg: number, minutes: number): number {
  return Math.round(met * 1.05 * weightKg * (minutes / 60))
}
