/** BMI 计算与分级（中国成人标准 WS/T 428-2013） */

export interface BmiLevel {
  level: '偏瘦' | '正常' | '超重' | '肥胖'
  color: 'info' | 'ok' | 'warn' | 'danger'
  advice: string
}

export function calcBmi(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm || heightCm < 80 || heightCm > 250) return null
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 10) / 10
}

/** 中国标准：偏瘦 <18.5；正常 18.5-23.9；超重 24-27.9；肥胖 ≥28 */
export function bmiLevel(bmi: number): BmiLevel {
  if (bmi < 18.5) return { level: '偏瘦', color: 'info', advice: '体重偏轻，注意营养均衡与力量训练' }
  if (bmi < 24) return { level: '正常', color: 'ok', advice: '状态很好，继续保持规律饮食与运动' }
  if (bmi < 28) return { level: '超重', color: 'warn', advice: '轻度超标，控制碳水并增加有氧运动' }
  return { level: '肥胖', color: 'danger', advice: '超标较多，建议制定减重计划并循序渐进' }
}

/** 健康体重区间（BMI 18.5–23.9） */
export function healthyRange(heightCm: number): [number, number] | null {
  if (!heightCm) return null
  const m = heightCm / 100
  return [Math.round(18.5 * m * m * 10) / 10, Math.round(23.9 * m * m * 10) / 10]
}

/** 基础代谢（Mifflin-St Jeor） */
export function bmr(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(gender === 'male' ? base + 5 : base - 161)
}
