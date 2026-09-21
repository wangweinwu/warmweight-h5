/** 体重追踪页 · 日历（月/周）+ 曲线（缩放）+ 记录列表 */
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'
import { Calendar } from '@/components/Calendar'
import { WeightChart } from '@/components/WeightChart'
import { Segmented, Empty, Modal } from '@/components/ui'
import { IconScale, IconTrash } from '@/components/icons'
import { fmtDateCN, fmtWeekday, relativeDay, round1 } from '@/lib/format'
import { calcBmi, bmiLevel, healthyRange } from '@/lib/bmi'

type ViewMode = 'month' | 'week'

export default function Track() {
  const { weights, plan, removeWeight } = useApp()
  const me = useApp((s) => s.me())
  const [mode, setMode] = useState<ViewMode>('month')
  const [selected, setSelected] = useState(() => new Date().toISOString().slice(0, 10))
  const [detail, setDetail] = useState<string | null>(null)

  if (!me) return <Navigate to="/auth" replace />

  const sorted = useMemo(() => [...weights].sort((a, b) => (a.date < b.date ? -1 : 1)), [weights])
  const byDate = useMemo(() => new Map(weights.map((w) => [w.date, w])), [weights])

  const marks = useMemo(() => {
    const m: Record<string, { color?: string }> = {}
    for (const w of weights) m[w.date] = {}
    return m
  }, [weights])

  const selEntry = byDate.get(selected)

  /* 区间统计 */
  const stats = useMemo(() => {
    if (!sorted.length) return null
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const delta = round1(last.weight - first.weight)
    return { first, last, delta }
  }, [sorted])

  /* 月度统计 */
  const monthStats = useMemo(() => {
    const ym = selected.slice(0, 7)
    const list = sorted.filter((w) => w.date.startsWith(ym))
    if (!list.length) return null
    const ws = list.map((w) => w.weight)
    return { count: list.length, min: Math.min(...ws), max: Math.max(...ws), avg: round1(ws.reduce((a, b) => a + b, 0) / ws.length) }
  }, [sorted, selected])

  const range = healthyRange(me.heightCm)
  const latest = sorted[sorted.length - 1]
  const bmi = latest ? calcBmi(latest.weight, me.heightCm) : null
  const level = bmi ? bmiLevel(bmi) : null
  const selBmi = selEntry ? calcBmi(selEntry.weight, me.heightCm) : null
  const selLevel = selBmi ? bmiLevel(selBmi) : null

  return (
    <div className="page">
      {/* 顶部：最新状态 */}
      <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>最新记录</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <b className="num" style={{ fontSize: 30 }}>{latest?.weight ?? '--'}</b>
            <span style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>kg · {latest ? relativeDay(latest.date) : '暂无'}</span>
          </div>
          {stats && sorted.length > 1 ? (
            <div style={{ fontSize: 12, marginTop: 2, color: stats.delta < 0 ? 'var(--c-ok)' : stats.delta > 0 ? 'var(--c-warn-strong)' : 'var(--c-ink-3)' }}>
              较首录 {stats.delta > 0 ? '+' : ''}{stats.delta} kg
            </div>
          ) : null}
        </div>
        {bmi != null && level ? (
          <div style={{ textAlign: 'center' }}>
            <Ring2 value={bmi} level={level.level} />
            <div style={{ fontSize: 11, color: 'var(--c-ink-3)', marginTop: 4 }}>
              {range ? `健康 ${range[0]}~${range[1]}` : '填写身高看 BMI'}
            </div>
          </div>
        ) : null}
      </div>

      {/* 日历视图（3 步内：打开页即见 → 切月/周 → 点日期） */}
      <div className="section-title">日历视图</div>
      <div className="card card-pad">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'month', label: '月' },
            { value: 'week', label: '周' }
          ]}
          style={{ width: 160, marginBottom: 12 }}
        />
        <Calendar marks={marks} selected={selected} onSelect={setSelected} mode={mode} />

        {/* 当月统计 */}
        {monthStats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 12 }}>
            <MiniStat label="记录" value={`${monthStats.count}`} unit="天" />
            <MiniStat label="最低" value={`${monthStats.min}`} unit="kg" />
            <MiniStat label="最高" value={`${monthStats.max}`} unit="kg" />
            <MiniStat label="均值" value={`${monthStats.avg}`} unit="kg" />
          </div>
        ) : null}

        {/* 选中日详情 */}
        {selEntry ? (
          <div className="card card-pad card-tint" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {fmtDateCN(selected, true)} {fmtWeekday(selected)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-ink-2)', marginTop: 2 }}>
                体重 <b className="num">{selEntry.weight}</b> kg
                {selBmi != null && selLevel ? (
                  <>
                    {' · '}BMI <b className="num">{selBmi}</b>
                    <span className={`badge badge-${selLevel.color}`} style={{ marginLeft: 6 }}>{selLevel.level}</span>
                  </>
                ) : null}
              </div>
              {selEntry.note ? <div style={{ fontSize: 12, color: 'var(--c-ink-3)', marginTop: 2 }}>备注：{selEntry.note}</div> : null}
            </div>
            <button className="nav-btn" onClick={() => setDetail(selEntry.date)} aria-label="删除该条记录">
              <IconTrash width={18} height={18} style={{ color: 'var(--c-danger)' }} />
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-ink-3)', marginTop: 10 }}>
            {selected} 暂无记录 · 点右下角 + 记录
          </div>
        )}
      </div>

      {/* 曲线 */}
      <div className="section-title">变化曲线</div>
      <div className="card card-pad">
        {sorted.length >= 2 ? (
          <WeightChart entries={sorted} heightCm={me.heightCm} goalWeight={plan?.goalWeight} startY={plan?.startWeight} />
        ) : (
          <Empty icon={<IconScale width={52} height={52} />} title="数据还不够" desc="至少记录 2 次体重后展示可缩放曲线" />
        )}
      </div>

      {/* 全部记录 */}
      <div className="section-title">全部记录（{sorted.length}）</div>
      <div className="cell-group">
        {[...sorted].reverse().map((w) => {
          const b = calcBmi(w.weight, me.heightCm)
          const lv = b ? bmiLevel(b) : null
          const prev = sorted[sorted.indexOf(w) - 1]
          const diff = prev ? round1(w.weight - prev.weight) : null
          return (
            <div key={w.date} className="cell" onClick={() => setDetail(w.date)}>
              <div className="cell-body">
                <div className="cell-title">
                  {fmtDateCN(w.date)} <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--c-ink-3)' }}>{fmtWeekday(w.date)}</span>
                </div>
                {lv ? (
                  <div className="cell-desc">
                    BMI {b} · {lv.level}
                  </div>
                ) : null}
              </div>
              {diff != null ? (
                <span style={{ fontSize: 12, color: diff < 0 ? 'var(--c-ok)' : diff > 0 ? 'var(--c-warn-strong)' : 'var(--c-ink-3)' }}>
                  {diff > 0 ? '+' : ''}{diff}
                </span>
              ) : null}
              <b className="num" style={{ fontSize: 16 }}>{w.weight}<i style={{ fontStyle: 'normal', fontSize: 11, color: 'var(--c-ink-3)' }}> kg</i></b>
            </div>
          )
        })}
      </div>

      <Modal
        open={detail != null}
        onClose={() => setDetail(null)}
        title="删除这条记录？"
        message={detail ? `${fmtDateCN(detail, true)} · ${byDate.get(detail)?.weight} kg，删除后不可恢复` : ''}
        confirmText="删除"
        danger
        onConfirm={() => detail && removeWeight(detail)}
      />
    </div>
  )
}

function MiniStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ background: 'var(--c-paper-2)', borderRadius: 12, padding: '8px 4px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>{label}</div>
      <div className="num" style={{ fontWeight: 700, fontSize: 15 }}>
        {value}
        <i style={{ fontStyle: 'normal', fontSize: 10, color: 'var(--c-ink-3)' }}> {unit}</i>
      </div>
    </div>
  )
}

/** BMI 小表盘（半环） */
function Ring2({ value, level }: { value: number; level: string }) {
  const min = 14
  const max = 36
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const size = 64
  const stroke = 7
  const r = (size - stroke) / 2
  const c = Math.PI * r // 半圆
  return (
    <div style={{ position: 'relative', width: size, height: size / 2 + 14 }}>
      <svg width={size} height={size / 2 + 6} viewBox={`0 0 ${size} ${size / 2 + 6}`}>
        <path d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`} fill="none" stroke="var(--c-cream)" strokeWidth={stroke} strokeLinecap="round" />
        <path
          d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke="url(#bmi-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .5s' }}
        />
        <defs>
          <linearGradient id="bmi-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4f8ea8" />
            <stop offset="45%" stopColor="#5a9a5f" />
            <stop offset="72%" stopColor="#c68e17" />
            <stop offset="100%" stopColor="#d4553f" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center' }}>
        <b className="num" style={{ fontSize: 15 }}>{value}</b>
        <span style={{ fontSize: 10, color: 'var(--c-ink-3)', marginLeft: 3 }}>{level}</span>
      </div>
    </div>
  )
}
