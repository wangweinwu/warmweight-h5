/** 月历（月/周双视图）· 用于体重追踪 */
import { useMemo, useState } from 'react'
import { toDateStr, addDays, startOfWeek, parseDate, pad2, fmtWeekday } from '@/lib/format'
import { IconChevron } from './icons'

export interface CalMark {
  color?: string
}

export function Calendar({ marks, selected, onSelect, mode }: {
  marks: Record<string, CalMark>
  selected: string
  onSelect: (date: string) => void
  mode: 'month' | 'week'
}) {
  const [cursor, setCursor] = useState(() => selected.slice(0, 7))
  const [year, month] = cursor.split('-').map(Number)

  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1)
    const start = startOfWeek(toDateStr(first))
    const weeks = mode === 'month' ? 6 : 1
    // 周视图：以选中日所在周为准
    const base = mode === 'week' ? startOfWeek(selected) : start
    const out: string[] = []
    for (let i = 0; i < weeks * 7; i++) out.push(addDays(base, i))
    return out
  }, [year, month, mode, selected])

  const inMonth = (s: string) => s.slice(0, 7) === cursor
  const today = toDateStr(new Date())

  const shift = (dir: number) => {
    const d = new Date(year, month - 1 + dir, 1)
    setCursor(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`)
  }
  const weekShift = (dir: number) => {
    const next = addDays(selected, dir * 7)
    setCursor(next.slice(0, 7))
    onSelect(startOfWeek(next))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button className="nav-btn" style={{ width: 34, height: 34 }} onClick={() => (mode === 'month' ? shift(-1) : weekShift(-1))} aria-label="上一期">
          <IconChevron width={17} height={17} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <b style={{ fontSize: 15 }}>{year} 年 {month} 月</b>
        <button className="nav-btn" style={{ width: 34, height: 34 }} onClick={() => (mode === 'month' ? shift(1) : weekShift(1))} aria-label="下一期">
          <IconChevron width={17} height={17} />
        </button>
      </div>
      <div className="cal-grid">
        {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
          <div key={d} className="cal-head">{d}</div>
        ))}
        {cells.map((s) => {
          const dim = mode === 'month' && !inMonth(s)
          return (
            <button
              key={s}
              className="cal-cell"
              data-today={s === today}
              data-selected={s === selected}
              style={dim ? { opacity: 0.35 } : undefined}
              onClick={() => {
                setCursor(s.slice(0, 7))
                onSelect(s)
              }}
            >
              <span>{parseDate(s).getDate()}</span>
              {marks[s] ? <i className="dot" style={marks[s].color ? { background: marks[s].color } : undefined} /> : null}
            </button>
          )
        })}
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-ink-3)', marginTop: 8 }}>
        {selected ? `${selected.slice(5).replace('-', '/')} ${fmtWeekday(selected)}` : ''}
      </div>
    </div>
  )
}
