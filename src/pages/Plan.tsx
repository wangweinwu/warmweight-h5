/** 减重计划 · 3 步设定：目标体重 → 周期 → 确认（自动计算每日目标） */
import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'
import { Stepper, Modal, Progress } from '@/components/ui'
import { IconTarget, IconCheck, IconTrash, IconInfo } from '@/components/icons'
import { todayStr, addDays, fmtDateCN, daysBetween, round1 } from '@/lib/format'

export default function Plan() {
  const nav = useNavigate()
  const { plan, weights, savePlan, clearPlan } = useApp()
  const me = useApp((s) => s.me())
  const [editing, setEditing] = useState(!plan)
  const [confirmClear, setConfirmClear] = useState(false)

  /* 表单状态 */
  const [goalWeight, setGoalWeight] = useState(plan?.goalWeight ?? Math.max(40, round1((me?.heightCm ? me.heightCm - 105 : 60) - 3)))
  const [unit, setUnit] = useState<'week' | 'month'>(plan?.unit ?? 'week')
  const [duration, setDuration] = useState(plan?.duration ?? 8)
  const [startDate, setStartDate] = useState(plan?.startDate ?? todayStr())

  if (!me) return <Navigate to="/auth" replace />

  const sorted = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1))
  const latest = sorted[sorted.length - 1]
  const recordedStart = plan?.startWeight ?? latest?.weight ?? null
  // 起始体重：纯草稿输入（初始=最近记录），输入过程不拦截，删除后为空即待填写
  const [startDraft, setStartDraft] = useState(recordedStart != null ? String(recordedStart) : '')
  const manualStart = startDraft.trim() !== '' && isFinite(Number(startDraft)) ? Math.round(Number(startDraft) * 10) / 10 : null
  const startWeight = manualStart
  // 目标体重：草稿输入，失焦/回车提交
  const [goalDraft, setGoalDraft] = useState('')

  const commitGoalDraft = () => {
    const n = Number(goalDraft)
    if (goalDraft.trim() !== '' && isFinite(n)) {
      setGoalWeight(Math.min(200, Math.max(30, Math.round(n * 10) / 10)))
    }
    setGoalDraft('')
  }

  /** 进入编辑态：草稿重置为当前记录值 */
  const openEdit = () => {
    setStartDraft(recordedStart != null ? String(recordedStart) : '')
    setGoalDraft('')
    setEditing(true)
  }

  const totalDays = unit === 'week' ? duration * 7 : duration * 30
  const endDate = addDays(startDate, totalDays)
  const toLose = startWeight != null ? round1(startWeight - goalWeight) : null
  const dailyTarget = toLose != null ? round1(toLose / totalDays) : null
  const weeklyTarget = dailyTarget != null ? round1(dailyTarget * 7) : null
  const tooFast = dailyTarget != null && dailyTarget > 0.35

  const startInvalid = startDraft !== '' && (manualStart == null || manualStart < 30 || manualStart > 300)
  const canSave =
    !startInvalid && startWeight != null && startWeight >= 30 && startWeight <= 300 && goalWeight > 30 && goalWeight < startWeight && duration >= 1

  const submit = () => {
    if (!canSave || startWeight == null) return
    savePlan({ startWeight, goalWeight, startDate, unit, duration })
    // 手动填写的起始体重同步为当日体重记录，保证曲线/计划口径一致
    if (manualStart != null && (!latest || latest.date !== todayStr() || latest.weight !== manualStart)) {
      void useApp.getState().upsertWeight(todayStr(), manualStart)
    }
    setStartDraft('')
    setEditing(false)
    useApp.getState().toast('计划已保存，每天加油', 'ok')
  }

  /* 展示态 */
  const planInfo = useMemo(() => {
    if (!plan) return null
    const tDays = plan.unit === 'week' ? plan.duration * 7 : plan.duration * 30
    const end = addDays(plan.startDate, tDays)
    const total = daysBetween(plan.startDate, end)
    const elapsed = Math.max(0, Math.min(total, daysBetween(plan.startDate, todayStr())))
    const cur = latest?.weight ?? plan.startWeight
    const loss = round1(plan.startWeight - cur)
    const toLoseTotal = round1(plan.startWeight - plan.goalWeight)
    const progress = toLoseTotal > 0 ? Math.max(0, Math.min(100, (loss / toLoseTotal) * 100)) : 0
    return {
      tDays, end, total, elapsed, cur, loss, toLoseTotal, progress,
      daily: round1(toLoseTotal / tDays),
      daysLeft: Math.max(0, total - elapsed),
      remain: round1(Math.max(0, cur - plan.goalWeight))
    }
  }, [plan, latest])

  if (!editing && plan && planInfo) {
    return (
      <div className="page">
        <div className="hero" style={{ textAlign: 'center', padding: 26 }}>
          <IconTarget width={30} height={30} style={{ opacity: 0.9 }} />
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>目标体重</div>
          <div className="num" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15 }}>{plan.goalWeight}<i style={{ fontSize: 18, fontStyle: 'normal' }}> kg</i></div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>
            {plan.startWeight} kg 出发 · {plan.duration} {plan.unit === 'week' ? '周' : '个月'} · 每日 −{planInfo.daily} kg
          </div>
        </div>

        <div className="card card-pad" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--c-ink-2)' }}>
              已减 <b className="num" style={{ color: 'var(--c-coral-deep)' }}>{Math.max(0, planInfo.loss)}</b> / {planInfo.toLoseTotal} kg
            </span>
            <span style={{ color: 'var(--c-ink-2)' }}>剩余 <b className="num">{planInfo.remain}</b> kg · {planInfo.daysLeft} 天</span>
          </div>
          <Progress value={planInfo.progress} height={10} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-ink-3)', marginTop: 8 }}>
            <span>进度 {Math.round(planInfo.progress)}%</span>
            <span>第 {planInfo.elapsed + 1} / {planInfo.total} 天 · 至 {fmtDateCN(planInfo.end)}</span>
          </div>
        </div>

        <div className="cell-group" style={{ marginTop: 14 }}>
          <div className="cell" onClick={openEdit}>
            <div className="cell-body">
              <div className="cell-title">调整计划</div>
              <div className="cell-desc">修改目标体重或周期，重新计算每日目标</div>
            </div>
            <span className="cell-extra">›</span>
          </div>
          <div className="cell" onClick={() => setConfirmClear(true)}>
            <div className="cell-body">
              <div className="cell-title" style={{ color: 'var(--c-danger)' }}>删除计划</div>
              <div className="cell-desc">不影响已记录的体重数据</div>
            </div>
            <IconTrash width={17} height={17} style={{ color: 'var(--c-danger)' }} />
          </div>
        </div>

        <Modal
          open={confirmClear}
          onClose={() => setConfirmClear(false)}
          title="删除当前计划？"
          message="删除后首页将不再展示进度，可随时重新设定"
          confirmText="删除"
          danger
          onConfirm={() => {
            clearPlan()
            useApp.getState().toast('已删除计划', 'ok')
          }}
        />
      </div>
    )
  }

  /* 编辑态：3 步内完成 */
  return (
    <div className="page">
      <div className="section-title" style={{ marginTop: 4 }}>
        {plan ? '调整计划' : '设定减重计划'}
      </div>

      {/* 第 0 步：起始体重（可修改） */}
      <div className="card card-pad" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="step-no">0</span>
          <b style={{ fontSize: 15 }}>起始体重</b>
          <span style={{ fontSize: 12, color: 'var(--c-ink-3)', marginLeft: 'auto' }}>
            {recordedStart != null ? '来自最近记录，可修改' : '手动填写'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <input
            className="field-input num"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={startDraft}
            onChange={(e) => setStartDraft(e.target.value)}
            onBlur={() => {
              // 失焦时若为合法值则规范化为 1 位小数
              if (manualStart != null) setStartDraft(String(manualStart))
            }}
            placeholder="如 72.5"
            style={{ flex: 1, fontSize: 20, fontWeight: 700, textAlign: 'center' }}
            aria-label="起始体重"
          />
          <span style={{ fontSize: 13, color: 'var(--c-ink-2)', flexShrink: 0 }}>kg</span>
        </div>
        <div className="field-hint" style={{ marginTop: 6 }}>
          建议用晨起空腹体重；修改后将同步为当日体重记录
          {startDraft.trim() === '' ? (
            <span className="field-error">（请填写起始体重）</span>
          ) : startInvalid ? (
            <span className="field-error">（请输入 30~300 之间的数值）</span>
          ) : null}
        </div>
      </div>

      {/* 第 1 步：目标体重 */}
      <div className="card card-pad" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span className="step-no">1</span>
          <b style={{ fontSize: 15 }}>目标体重</b>
          {startWeight != null ? <span style={{ fontSize: 12, color: 'var(--c-ink-3)', marginLeft: 'auto' }}>起始 {startWeight} kg</span> : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <Stepper value={goalWeight} onChange={setGoalWeight} step={0.5} min={30} max={200} unit="kg" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <input
              className="num"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              onBlur={commitGoalDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              style={{ width: 86, fontSize: 30, fontWeight: 800, textAlign: 'center', border: 'none', borderBottom: '2px dashed var(--c-line-strong)', background: 'transparent', color: 'var(--c-ink)', outline: 'none', fontFamily: 'var(--font-num)' }}
              aria-label="目标体重直接输入"
            />
            <i style={{ fontSize: 13, fontStyle: 'normal', color: 'var(--c-ink-3)' }}>kg</i>
          </div>
        </div>
        {toLose != null ? (
          <div style={{ textAlign: 'center', fontSize: 12, color: toLose > 0 ? 'var(--c-coral-deep)' : 'var(--c-ink-3)', marginTop: 8 }}>
            {toLose > 0 ? `需减重 ${toLose} kg` : toLose === 0 ? '目标等于当前体重' : '目标高于当前体重，将转为维持计划'}
          </div>
        ) : null}
      </div>

      {/* 第 2 步：计划周期 */}
      <div className="card card-pad" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span className="step-no">2</span>
          <b style={{ fontSize: 15 }}>计划周期</b>
        </div>
        <div className="chip-row" style={{ marginBottom: 12 }}>
          <button className="chip" data-active={unit === 'week'} onClick={() => setUnit('week')}>按周</button>
          <button className="chip" data-active={unit === 'month'} onClick={() => setUnit('month')}>按月</button>
        </div>
        <div className="chip-row">
          {(unit === 'week' ? [2, 4, 8, 12, 16, 24] : [1, 2, 3, 6, 12]).map((d) => (
            <button key={d} className="chip" data-active={duration === d} onClick={() => setDuration(d)}>
              {d} {unit === 'week' ? '周' : '个月'}
            </button>
          ))}
        </div>
        <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
          <label className="field-label">开始日期</label>
          <input type="date" className="field-input" value={startDate} max={todayStr()} onChange={(e) => e.target.value && setStartDate(e.target.value)} />
        </div>
      </div>

      {/* 第 3 步：确认（自动计算） */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span className="step-no">3</span>
          <b style={{ fontSize: 15 }}>确认结果</b>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'center' }}>
          <ResultBox label="每日目标减重" value={dailyTarget != null ? `−${dailyTarget}` : '--'} unit="kg/天" highlight />
          <ResultBox label="每周合计" value={weeklyTarget != null ? `−${weeklyTarget}` : '--'} unit="kg/周" />
          <ResultBox label="计划截止" value={fmtDateCN(endDate)} unit={`${totalDays} 天`} />
          <ResultBox label="结束体重" value={`${goalWeight}`} unit="kg" />
        </div>
        {tooFast ? (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--c-warn-strong)', background: 'var(--c-caramel-soft)', borderRadius: 10, padding: '8px 10px' }}>
            每日目标超过 0.35kg，速度偏快，建议拉长周期更健康
          </div>
        ) : null}
      </div>

      <button className="btn btn-primary btn-block" disabled={!canSave} onClick={submit}>
        <IconCheck width={18} height={18} />
        保存计划
      </button>
      {plan ? (
        <button className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={() => setEditing(false)}>
          取消
        </button>
      ) : null}
    </div>
  )
}

function ResultBox({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div style={{ background: highlight ? 'var(--c-coral-soft)' : 'var(--c-paper-2)', borderRadius: 12, padding: '10px 6px' }}>
      <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>{label}</div>
      <div className="num" style={{ fontWeight: 800, fontSize: 17, color: highlight ? 'var(--c-coral-deep)' : 'var(--c-ink)' }}>
        {value}
        <i style={{ fontStyle: 'normal', fontSize: 10, color: 'var(--c-ink-3)', marginLeft: 2 }}>{unit}</i>
      </div>
    </div>
  )
}
