/**
 * 记录体重 · 全局 3 步核心流
 * 打开（点 FAB）→ 输入/确认体重 → 保存 ✓（自动算 BMI/更新曲线）
 */
import { useEffect, useState } from 'react'
import { Sheet, Stepper } from './ui'
import { useApp } from '@/store/useApp'
import { todayStr, fmtDateCN, fmtWeekday } from '@/lib/format'
import { calcBmi, bmiLevel, healthyRange } from '@/lib/bmi'
import { IconScale, IconCheck } from './icons'

export function QuickWeightSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { weights, upsertWeight } = useApp()
  const me = useApp((s) => s.me())
  const [date, setDate] = useState(todayStr())
  const [weight, setWeight] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // 打开时预填：今日已有记录 → 预填该值；否则预填最近一次体重
  useEffect(() => {
    if (!open) return
    const today = weights.find((w) => w.date === todayStr())
    const latest = weights[weights.length - 1]
    setDate(todayStr())
    setWeight(today?.weight ?? latest?.weight ?? null)
  }, [open, weights])

  const height = me?.heightCm ?? 0
  const bmi = weight ? calcBmi(weight, height) : null
  const level = bmi ? bmiLevel(bmi) : null
  const range = healthyRange(height)
  const existed = weights.some((w) => w.date === date)

  const save = async () => {
    if (!weight) return
    setSaving(true)
    try {
      await upsertWeight(date, weight)
      useApp.getState().toast(existed ? '已更新今日记录' : '记录成功，继续保持', 'ok')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="记录今日体重">
      {/* 第 1 步：日期（默认今天，可直接改） */}
      <div className="field">
        <label className="field-label">日期</label>
        <div className="chip-row" role="radiogroup" aria-label="选择日期">
          {[2, 1, 0].map((ago) => {
            const d = new Date()
            d.setDate(d.getDate() - ago)
            const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            return (
              <button key={s} className="chip" data-active={date === s} onClick={() => setDate(s)} role="radio" aria-checked={date === s}>
                {ago === 0 ? '今天' : ago === 1 ? '昨天' : fmtWeekday(s)}
              </button>
            )
          })}
          <input
            type="date"
            max={todayStr()}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="chip"
            style={{ width: 150, color: 'var(--c-ink-2)', textAlign: 'center' }}
            aria-label="选择其它日期"
          />
        </div>
      </div>

      {/* 第 2 步：体重数字 */}
      <div className="field">
        <label className="field-label">体重（kg）</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="20"
            max="300"
            placeholder="输入体重"
            value={weight ?? ''}
            onChange={(e) => setWeight(e.target.value === '' ? null : Number(e.target.value))}
            className="field-input num"
            style={{ fontSize: 26, fontWeight: 700, textAlign: 'center', flex: 1 }}
            autoFocus
          />
          <Stepper value={weight ?? 60} onChange={setWeight} step={0.1} min={20} max={300} />
        </div>
        {weights.length > 0 && !existed ? (
          <div className="field-hint">最近一次：{weights[weights.length - 1].weight} kg</div>
        ) : null}
      </div>

      {/* 即时反馈：BMI */}
      {bmi != null && level ? (
        <div className="card card-pad card-tint" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconScale width={30} height={30} style={{ color: 'var(--c-coral)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--c-ink-2)' }}>
              BMI <b className="num" style={{ fontSize: 17, color: 'var(--c-ink)' }}>{bmi}</b>
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>{level.advice}</div>
          </div>
          <span className={`badge badge-${level.color}`}>{level.level}</span>
        </div>
      ) : height === 0 ? (
        <div className="field-hint" style={{ marginBottom: 12 }}>
          在「我的」页填写身高后可自动计算 BMI{range ? `（健康体重 ${range[0]}~${range[1]}kg）` : ''}
        </div>
      ) : null}

      {/* 第 3 步：保存 */}
      <button className="btn btn-primary btn-block" disabled={weight == null || saving} onClick={save}>
        <IconCheck width={18} height={18} />
        {saving ? '保存中…' : existed ? `更新 ${fmtDateCN(date)} 记录` : '保存记录'}
      </button>
    </Sheet>
  )
}
