/** 通用格式化与日期工具 */

export const pad2 = (n: number) => String(n).padStart(2, '0')

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function todayStr(): string {
  return toDateStr(new Date())
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, days: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

/** 周一为一周开始 */
export function startOfWeek(s: string): string {
  const d = parseDate(s)
  const day = (d.getDay() + 6) % 7
  return addDays(s, -day)
}

export function startOfMonth(s: string): string {
  const d = parseDate(s)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`
}

export function endOfMonth(s: string): string {
  const d = parseDate(s)
  return toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000)
}

/** YYYY-MM-DD → M月D日 / YYYY年M月D日 */
export function fmtDateCN(s: string, withYear = false): string {
  const d = parseDate(s)
  const base = `${d.getMonth() + 1}月${d.getDate()}日`
  return withYear ? `${d.getFullYear()}年${base}` : base
}

/** YYYY-MM-DD → 周X（getDay() 周日=0，故映射表从“日”开始） */
export function fmtWeekday(s: string): string {
  return '周' + '日一二三四五六'[parseDate(s).getDay()]
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  return `${fmtDateCN(toDateStr(d))} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/** 2024-1-5 / 2023-12-11 形式的相对描述 */
export function relativeDay(s: string): string {
  const diff = daysBetween(s, todayStr())
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff === 2) return '前天'
  if (diff < 0) return `未来${-diff}天`
  if (diff < 7) return `${diff}天前`
  return fmtDateCN(s)
}

export const round1 = (n: number) => Math.round(n * 10) / 10

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** 千分位 */
export function thousand(n: number): string {
  return n.toLocaleString('zh-CN')
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
