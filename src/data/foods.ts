import type { Food } from '@/lib/types'

/**
 * 常见食物数据库（每 100g 可食部）
 * 数据参考：《中国食物成分表》第 6 版 + 中国营养学会 GI 表；数值为常见均值，供日常参考
 */
export const FOOD_DB: Food[] = [
  // ===== 主食 =====
  { name: '米饭(熟)', category: '主食', kcal: 116, protein: 2.6, fat: 0.3, carb: 25.9, gi: 83, serving: { label: '1 小碗', grams: 150 } },
  { name: '馒头', category: '主食', kcal: 223, protein: 7.0, fat: 1.1, carb: 47.0, gi: 88, serving: { label: '1 个', grams: 100 } },
  { name: '全麦面包', category: '主食', kcal: 246, protein: 10.4, fat: 3.4, carb: 45.3, gi: 52, serving: { label: '2 片', grams: 70 } },
  { name: '白面包', category: '主食', kcal: 283, protein: 8.3, fat: 3.9, carb: 56.0, gi: 75, serving: { label: '2 片', grams: 60 } },
  { name: '燕麦片(干)', category: '主食', kcal: 367, protein: 15.0, fat: 6.7, carb: 61.0, gi: 55, serving: { label: '1 小袋', grams: 40 } },
  { name: '面条(煮)', category: '主食', kcal: 110, protein: 3.6, fat: 0.4, carb: 24.3, gi: 82, serving: { label: '1 小碗', grams: 200 } },
  { name: '荞麦面(煮)', category: '主食', kcal: 129, protein: 4.8, fat: 0.8, carb: 26.0, gi: 59, serving: { label: '1 小碗', grams: 200 } },
  { name: '糙米饭(熟)', category: '主食', kcal: 112, protein: 2.8, fat: 0.8, carb: 23.5, gi: 68, serving: { label: '1 小碗', grams: 150 } },
  { name: '玉米(鲜)', category: '主食', kcal: 112, protein: 4.0, fat: 1.2, carb: 22.8, gi: 55, serving: { label: '1 根', grams: 200 } },
  { name: '红薯(熟)', category: '主食', kcal: 90, protein: 2.0, fat: 0.2, carb: 20.7, gi: 63, serving: { label: '1 小个', grams: 150 } },
  { name: '紫薯(熟)', category: '主食', kcal: 82, protein: 1.8, fat: 0.3, carb: 18.5, gi: 55, serving: { label: '1 小个', grams: 150 } },
  { name: '土豆(煮)', category: '主食', kcal: 78, protein: 2.0, fat: 0.2, carb: 17.2, gi: 66, serving: { label: '1 中个', grams: 130 } },
  { name: '山药(熟)', category: '主食', kcal: 57, protein: 1.9, fat: 0.2, carb: 12.4, gi: 51, serving: { label: '半根', grams: 150 } },
  { name: '南瓜(熟)', category: '主食', kcal: 30, protein: 0.8, fat: 0.2, carb: 6.5, gi: 75, serving: { label: '1 小块', grams: 200 } },
  { name: '饺子(猪肉)', category: '主食', kcal: 232, protein: 8.5, fat: 10.5, carb: 25.6, gi: 55, serving: { label: '6 个', grams: 150 } },
  { name: '米粉(煮)', category: '主食', kcal: 119, protein: 1.5, fat: 0.1, carb: 27.2, gi: 73, serving: { label: '1 小碗', grams: 200 } },
  { name: '意面(煮)', category: '主食', kcal: 131, protein: 5.0, fat: 1.1, carb: 25.0, gi: 49, serving: { label: '1 小碗', grams: 180 } },
  { name: '白粥', category: '主食', kcal: 46, protein: 1.1, fat: 0.3, carb: 9.9, gi: 88, serving: { label: '1 小碗', grams: 250 } },

  // ===== 蔬菜 =====
  { name: '西兰花', category: '蔬菜', kcal: 27, protein: 3.5, fat: 0.4, carb: 3.7, gi: 15, serving: { label: '1 小份', grams: 150 } },
  { name: '菠菜', category: '蔬菜', kcal: 24, protein: 2.6, fat: 0.3, carb: 3.6, gi: 15, serving: { label: '1 小份', grams: 150 } },
  { name: '生菜', category: '蔬菜', kcal: 12, protein: 1.3, fat: 0.2, carb: 1.8, gi: 15, serving: { label: '1 小份', grams: 150 } },
  { name: '油麦菜', category: '蔬菜', kcal: 12, protein: 1.4, fat: 0.4, carb: 1.4, gi: 15, serving: { label: '1 小份', grams: 150 } },
  { name: '番茄', category: '蔬菜', kcal: 15, protein: 0.9, fat: 0.2, carb: 2.9, gi: 15, serving: { label: '1 个', grams: 160 } },
  { name: '黄瓜', category: '蔬菜', kcal: 16, protein: 0.8, fat: 0.2, carb: 2.9, gi: 15, serving: { label: '1 根', grams: 180 } },
  { name: '胡萝卜', category: '蔬菜', kcal: 39, protein: 1.0, fat: 0.2, carb: 8.1, gi: 39, serving: { label: '1 根', grams: 120 } },
  { name: '白菜', category: '蔬菜', kcal: 18, protein: 1.5, fat: 0.2, carb: 3.1, gi: 15, serving: { label: '1 小份', grams: 150 } },
  { name: '芹菜', category: '蔬菜', kcal: 14, protein: 0.7, fat: 0.1, carb: 2.7, gi: 15, serving: { label: '1 小份', grams: 120 } },
  { name: '蘑菇(鲜)', category: '蔬菜', kcal: 24, protein: 2.7, fat: 0.1, carb: 4.1, gi: 15, serving: { label: '1 小份', grams: 100 } },
  { name: '金针菇', category: '蔬菜', kcal: 26, protein: 2.4, fat: 0.4, carb: 3.3, gi: 15, serving: { label: '1 小把', grams: 100 } },
  { name: '紫菜(干)', category: '蔬菜', kcal: 250, protein: 26.7, fat: 1.1, carb: 44.1, gi: 15, serving: { label: '1 片', grams: 3 } },
  { name: '海带(鲜)', category: '蔬菜', kcal: 13, protein: 1.2, fat: 0.1, carb: 2.1, gi: 17, serving: { label: '1 小份', grams: 100 } },
  { name: '豆芽', category: '蔬菜', kcal: 16, protein: 1.7, fat: 0.1, carb: 2.1, gi: 15, serving: { label: '1 小份', grams: 150 } },
  { name: '芦笋', category: '蔬菜', kcal: 19, protein: 2.6, fat: 0.1, carb: 2.0, gi: 15, serving: { label: '1 小份', grams: 120 } },
  { name: '秋葵', category: '蔬菜', kcal: 37, protein: 2.0, fat: 0.2, carb: 7.2, gi: 15, serving: { label: '1 小份', grams: 100 } },

  // ===== 水果 =====
  { name: '苹果', category: '水果', kcal: 53, protein: 0.4, fat: 0.2, carb: 13.5, gi: 36, serving: { label: '1 个', grams: 200 } },
  { name: '香蕉', category: '水果', kcal: 93, protein: 1.4, fat: 0.2, carb: 22.0, gi: 52, serving: { label: '1 根', grams: 120 } },
  { name: '橙子', category: '水果', kcal: 48, protein: 0.9, fat: 0.2, carb: 10.5, gi: 43, serving: { label: '1 个', grams: 180 } },
  { name: '葡萄', category: '水果', kcal: 45, protein: 0.4, fat: 0.3, carb: 10.3, gi: 43, serving: { label: '1 小串', grams: 150 } },
  { name: '西瓜', category: '水果', kcal: 31, protein: 0.5, fat: 0.3, carb: 6.8, gi: 72, serving: { label: '1 小块', grams: 300 } },
  { name: '猕猴桃', category: '水果', kcal: 61, protein: 0.8, fat: 0.6, carb: 14.5, gi: 52, serving: { label: '1 个', grams: 100 } },
  { name: '草莓', category: '水果', kcal: 32, protein: 1.0, fat: 0.2, carb: 7.1, gi: 40, serving: { label: '8 颗', grams: 150 } },
  { name: '蓝莓', category: '水果', kcal: 57, protein: 0.7, fat: 0.3, carb: 14.5, gi: 53, serving: { label: '1 小盒', grams: 125 } },
  { name: '桃子', category: '水果', kcal: 42, protein: 0.9, fat: 0.2, carb: 9.4, gi: 42, serving: { label: '1 个', grams: 150 } },
  { name: '梨', category: '水果', kcal: 44, protein: 0.4, fat: 0.2, carb: 11.0, gi: 36, serving: { label: '1 个', grams: 200 } },
  { name: '柚子', category: '水果', kcal: 42, protein: 0.8, fat: 0.2, carb: 9.5, gi: 25, serving: { label: '2 瓣', grams: 200 } },
  { name: '芒果', category: '水果', kcal: 35, protein: 0.6, fat: 0.2, carb: 8.3, gi: 55, serving: { label: '半个', grams: 200 } },
  { name: '菠萝', category: '水果', kcal: 44, protein: 0.5, fat: 0.1, carb: 10.8, gi: 66, serving: { label: '1 小块', grams: 150 } },
  { name: '榴莲', category: '水果', kcal: 147, protein: 2.6, fat: 3.3, carb: 28.3, gi: 49, serving: { label: '1 小块', grams: 100 } },
  { name: '牛油果', category: '水果', kcal: 161, protein: 2.0, fat: 15.3, carb: 7.4, gi: 15, serving: { label: '半个', grams: 100 } },

  // ===== 肉蛋 =====
  { name: '鸡胸肉', category: '肉蛋', kcal: 133, protein: 24.6, fat: 3.4, carb: 0.6, gi: 0, serving: { label: '1 块', grams: 120 } },
  { name: '鸡腿肉(去皮)', category: '肉蛋', kcal: 146, protein: 20.9, fat: 6.7, carb: 0, gi: 0, serving: { label: '1 个', grams: 100 } },
  { name: '鸡翅(带皮)', category: '肉蛋', kcal: 224, protein: 18.5, fat: 16.4, carb: 1.5, gi: 0, serving: { label: '2 个', grams: 100 } },
  { name: '猪里脊', category: '肉蛋', kcal: 155, protein: 20.2, fat: 7.9, carb: 0.7, gi: 0, serving: { label: '1 小份', grams: 100 } },
  { name: '五花肉', category: '肉蛋', kcal: 568, protein: 7.7, fat: 59.0, carb: 0.9, gi: 0, serving: { label: '1 小份', grams: 80 } },
  { name: '牛里脊', category: '肉蛋', kcal: 107, protein: 22.2, fat: 0.9, carb: 2.4, gi: 0, serving: { label: '1 小份', grams: 100 } },
  { name: '肥牛卷', category: '肉蛋', kcal: 288, protein: 16.0, fat: 24.0, carb: 1.0, gi: 0, serving: { label: '1 小盘', grams: 100 } },
  { name: '羊肉(瘦)', category: '肉蛋', kcal: 118, protein: 20.5, fat: 3.9, carb: 0.2, gi: 0, serving: { label: '1 小份', grams: 100 } },
  { name: '鸭肉', category: '肉蛋', kcal: 240, protein: 15.5, fat: 19.7, carb: 0.2, gi: 0, serving: { label: '1 小份', grams: 100 } },
  { name: '培根', category: '肉蛋', kcal: 181, protein: 22.3, fat: 10.0, carb: 0, gi: 0, serving: { label: '2 片', grams: 30 } },
  { name: '火腿肠', category: '肉蛋', kcal: 212, protein: 14.0, fat: 10.4, carb: 15.6, gi: 0, serving: { label: '1 根', grams: 60 } },
  { name: '鸡蛋(全)', category: '肉蛋', kcal: 144, protein: 13.3, fat: 8.8, carb: 2.8, gi: 0, serving: { label: '1 个', grams: 55 } },
  { name: '鸡蛋白', category: '肉蛋', kcal: 60, protein: 11.6, fat: 0.1, carb: 3.1, gi: 0, serving: { label: '1 个', grams: 33 } },
  { name: '咸鸭蛋', category: '肉蛋', kcal: 190, protein: 12.7, fat: 12.7, carb: 6.3, gi: 0, serving: { label: '1 个', grams: 60 } },

  // ===== 水产 =====
  { name: '三文鱼', category: '水产', kcal: 139, protein: 17.2, fat: 7.8, carb: 0, gi: 0, serving: { label: '1 块', grams: 120 } },
  { name: '金枪鱼', category: '水产', kcal: 132, protein: 28.0, fat: 1.3, carb: 0, gi: 0, serving: { label: '1 块', grams: 100 } },
  { name: '鲈鱼', category: '水产', kcal: 105, protein: 18.6, fat: 3.4, carb: 0, gi: 0, serving: { label: '1 段', grams: 100 } },
  { name: '带鱼', category: '水产', kcal: 127, protein: 17.7, fat: 4.9, carb: 3.1, gi: 0, serving: { label: '1 段', grams: 100 } },
  { name: '虾仁', category: '水产', kcal: 48, protein: 10.4, fat: 0.7, carb: 0, gi: 0, serving: { label: '1 小份', grams: 100 } },
  { name: '鳕鱼', category: '水产', kcal: 88, protein: 20.4, fat: 0.5, carb: 0.5, gi: 0, serving: { label: '1 块', grams: 120 } },
  { name: '生蚝', category: '水产', kcal: 73, protein: 9.0, fat: 2.1, carb: 3.9, gi: 0, serving: { label: '4 只', grams: 100 } },
  { name: '鱿鱼', category: '水产', kcal: 84, protein: 17.4, fat: 1.6, carb: 0, gi: 0, serving: { label: '1 小份', grams: 100 } },
  { name: '扇贝', category: '水产', kcal: 60, protein: 11.1, fat: 0.6, carb: 2.6, gi: 0, serving: { label: '4 只', grams: 100 } },
  { name: '蟹肉', category: '水产', kcal: 62, protein: 11.6, fat: 1.2, carb: 1.1, gi: 0, serving: { label: '1 小份', grams: 100 } },

  // ===== 豆奶 =====
  { name: '豆腐(北)', category: '豆奶', kcal: 116, protein: 12.2, fat: 4.8, carb: 2.0, gi: 15, serving: { label: '1 小块', grams: 150 } },
  { name: '内酯豆腐', category: '豆奶', kcal: 50, protein: 5.0, fat: 1.9, carb: 3.3, gi: 15, serving: { label: '1 盒', grams: 300 } },
  { name: '豆浆(无糖)', category: '豆奶', kcal: 31, protein: 3.0, fat: 1.6, carb: 1.2, gi: 15, serving: { label: '1 杯', grams: 250 } },
  { name: '牛奶(全脂)', category: '豆奶', kcal: 54, protein: 3.0, fat: 3.2, carb: 3.4, gi: 28, serving: { label: '1 盒', grams: 250 } },
  { name: '牛奶(脱脂)', category: '豆奶', kcal: 33, protein: 3.4, fat: 0.1, carb: 4.9, gi: 32, serving: { label: '1 盒', grams: 250 } },
  { name: '酸奶(无糖)', category: '豆奶', kcal: 62, protein: 3.5, fat: 3.3, carb: 4.7, gi: 38, serving: { label: '1 杯', grams: 200 } },
  { name: '希腊酸奶', category: '豆奶', kcal: 97, protein: 9.0, fat: 5.0, carb: 4.0, gi: 35, serving: { label: '1 杯', grams: 150 } },
  { name: '豆腐干', category: '豆奶', kcal: 140, protein: 16.2, fat: 3.9, carb: 8.5, gi: 15, serving: { label: '2 块', grams: 80 } },
  { name: '腐竹(干)', category: '豆奶', kcal: 461, protein: 44.6, fat: 21.7, carb: 22.3, gi: 15, serving: { label: '半根', grams: 20 } },
  { name: '拿铁(中杯)', category: '豆奶', kcal: 43, protein: 2.4, fat: 1.9, carb: 4.0, gi: 30, serving: { label: '1 杯', grams: 350 } },

  // ===== 零食 =====
  { name: '薯片', category: '零食', kcal: 548, protein: 5.6, fat: 37.6, carb: 47.8, gi: 56, serving: { label: '1 小袋', grams: 45 } },
  { name: '巧克力(黑)', category: '零食', kcal: 546, protein: 7.8, fat: 38.0, carb: 44.0, gi: 23, serving: { label: '3 块', grams: 25 } },
  { name: '巧克力(牛奶)', category: '零食', kcal: 552, protein: 6.9, fat: 32.0, carb: 59.0, gi: 42, serving: { label: '3 块', grams: 25 } },
  { name: '饼干(苏打)', category: '零食', kcal: 489, protein: 8.2, fat: 19.0, carb: 69.0, gi: 70, serving: { label: '4 片', grams: 30 } },
  { name: '蛋糕(奶油)', category: '零食', kcal: 348, protein: 5.8, fat: 15.0, carb: 48.0, gi: 65, serving: { label: '1 小块', grams: 80 } },
  { name: '冰淇淋', category: '零食', kcal: 207, protein: 3.5, fat: 11.0, carb: 24.0, gi: 61, serving: { label: '1 球', grams: 80 } },
  { name: '坚果(混合)', category: '零食', kcal: 607, protein: 20.0, fat: 54.0, carb: 17.0, gi: 15, serving: { label: '1 小袋', grams: 25 } },
  { name: '核桃', category: '零食', kcal: 646, protein: 14.9, fat: 58.8, carb: 19.1, gi: 15, serving: { label: '2 颗', grams: 15 } },
  { name: '花生(炒)', category: '零食', kcal: 601, protein: 23.9, fat: 49.2, carb: 21.7, gi: 14, serving: { label: '1 小把', grams: 20 } },
  { name: '爆米花(原味)', category: '零食', kcal: 387, protein: 12.0, fat: 4.5, carb: 77.8, gi: 65, serving: { label: '1 小桶', grams: 60 } },
  { name: '辣条', category: '零食', kcal: 394, protein: 8.0, fat: 20.0, carb: 46.0, gi: 60, serving: { label: '1 包', grams: 50 } },
  { name: '海苔(调味)', category: '零食', kcal: 177, protein: 12.0, fat: 2.0, carb: 30.0, gi: 15, serving: { label: '4 片', grams: 8 } },

  // ===== 饮品 =====
  { name: '可乐', category: '饮品', kcal: 43, protein: 0, fat: 0, carb: 10.6, gi: 63, serving: { label: '1 罐', grams: 330 } },
  { name: '零度可乐', category: '饮品', kcal: 0, protein: 0, fat: 0, carb: 0, gi: 0, serving: { label: '1 罐', grams: 330 } },
  { name: '橙汁(100%)', category: '饮品', kcal: 45, protein: 0.7, fat: 0.2, carb: 10.4, gi: 50, serving: { label: '1 杯', grams: 250 } },
  { name: '奶茶(全糖)', category: '饮品', kcal: 55, protein: 1.2, fat: 2.5, carb: 7.5, gi: 60, serving: { label: '1 杯', grams: 500 } },
  { name: '美式咖啡', category: '饮品', kcal: 2, protein: 0.3, fat: 0, carb: 0, gi: 0, serving: { label: '1 杯', grams: 350 } },
  { name: '啤酒', category: '饮品', kcal: 43, protein: 0.5, fat: 0, carb: 3.6, gi: 66, serving: { label: '1 罐', grams: 330 } },
  { name: '红酒', category: '饮品', kcal: 85, protein: 0.1, fat: 0, carb: 2.6, gi: 0, serving: { label: '1 杯', grams: 150 } },
  { name: '运动饮料', category: '饮品', kcal: 26, protein: 0, fat: 0, carb: 6.5, gi: 65, serving: { label: '1 瓶', grams: 500 } },
  { name: '蜂蜜水', category: '饮品', kcal: 32, protein: 0, fat: 0, carb: 8.0, gi: 58, serving: { label: '1 杯', grams: 250 } },
  { name: '椰子水', category: '饮品', kcal: 19, protein: 0.7, fat: 0.2, carb: 3.7, gi: 40, serving: { label: '1 个', grams: 300 } },
]

export const FOOD_CATEGORIES = ['主食', '蔬菜', '水果', '肉蛋', '水产', '豆奶', '零食', '饮品'] as const

/** GI 分级 */
export function giLevel(gi: number): { label: '高 GI' | '中 GI' | '低 GI'; color: 'danger' | 'warn' | 'ok' } {
  if (gi >= 70) return { label: '高 GI', color: 'danger' }
  if (gi >= 55) return { label: '中 GI', color: 'warn' }
  return { label: '低 GI', color: 'ok' }
}

/** 热量密度分级 */
export function kcalLevel(kcal: number): { label: string; color: 'ok' | 'warn' | 'danger' } {
  if (kcal < 100) return { label: '低热量', color: 'ok' }
  if (kcal < 250) return { label: '中热量', color: 'warn' }
  return { label: '高热量', color: 'danger' }
}
