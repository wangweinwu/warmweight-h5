/** 首页 · 今日概览 */
import { useMemo, useState } from 'react'
import { useApp } from '@/store/useApp'
import { Navigate, useNavigate } from 'react-router-dom'
import { Ring, Progress, Empty } from '@/components/ui'
import { WeightChart } from '@/components/WeightChart'
import { ThemeToggle } from '@/components/Widgets'
import { IconScale, IconTarget, IconChevron, IconCloud, IconSync, IconPlus } from '@/components/icons'
import { todayStr, daysBetween, fmtDateCN, addDays, round1 } from '@/lib/format'
import { calcBmi, bmiLevel, healthyRange } from '@/lib/bmi'

export default function Home() {
  const nav = useNavigate()
  const { plan, weights, online, syncing, sync } = useApp()
  const me = useApp((s) => s.me())

  if (!me) return <Navigate to="/auth" replace />

  const today = todayStr()
  const todayEntry = weights.find((w) => w.date === today)
  const sorted = useMemo(() => [...weights].sort((a, b) => (a.date < b.date ? -1 : 1)), [weights])
  const latest = sorted[sorted.length - 1]
  const bmi = latest ? calcBmi(latest.weight, me.heightCm) : null
  const level = bmi ? bmiLevel(bmi) : null

  /* 计划进度 */
  const planInfo = useMemo(() => {
    if (!plan) return null
    const totalDays = (plan.unit === 'week' ? plan.duration * 7 : plan.duration * 30)
    const endDate = addDays(plan.startDate, totalDays)
    const total = daysBetween(plan.startDate, endDate)
    const elapsed = Math.max(0, Math.min(total, daysBetween(plan.startDate, today)))
    const loss = round1(plan.startWeight - (latest?.weight ?? plan.startWeight))
    const toLose = round1(plan.startWeight - plan.goalWeight)
    const dailyTarget = round1((toLose / totalDays) * 10) / 10 // kg/日
    const remainKg = round1(Math.max(0, (latest?.weight ?? plan.startWeight) - plan.goalWeight))
    const daysLeft = Math.max(0, total - elapsed)
    const progress = toLose > 0 ? Math.max(0, Math.min(100, (loss / toLose) * 100)) : 0
    const timePct = total > 0 ? (elapsed / total) * 100 : 0
    return { totalDays, endDate, elapsed, total, loss, toLose, dailyTarget, remainKg, daysLeft, progress, timePct }
  }, [plan, latest, today])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 5) return '夜深了'
    if (h < 11) return '早上好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    return '晚上好'
  })()

  return (
    <div className="page-naked">
      {/* 顶部问候 */}
      <div style={{ padding: 'calc(env(safe-area-inset-top) + 14px) 4px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {me.avatar ? (
          <img src={me.avatar} alt="头像" className="avatar" width={40} height={40} />
        ) : (
          <div className="avatar" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-coral-deep)', fontWeight: 800, fontSize: 17 }}>
            {(me.nickname || me.email)[0]?.toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>
            {greeting}，{me.nickname || '朋友'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>{todayEntry ? '今天已打卡，稳稳的' : '今天的体重还没记录哦'}</div>
        </div>
        <button
          className="nav-btn"
          onClick={() => sync()}
          aria-label="手动云同步"
          style={{ position: 'relative' }}
        >
          <IconSync width={19} height={19} style={{ opacity: syncing ? 0.4 : 1 }} />
          <span
            style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 7,
              height: 7,
              borderRadius: 7,
              background: online ? 'var(--c-ok)' : 'var(--c-line-strong)'
            }}
          />
        </button>
        <ThemeToggle />
      </div>

      {/* 暖阳 Hero：今日体重 + 计划进度环 */}
      <div className="hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Ring pct={planInfo?.progress ?? 0} size={112} stroke={11}>
            <b className="num" style={{ fontSize: 15 }}>{Math.round(planInfo?.progress ?? 0)}%</b>
            <span style={{ fontSize: 10, opacity: 0.85 }}>目标进度</span>
          </Ring>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, opacity: 0.9 }}>今日体重（kg）</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '2px 0 6px' }}>
              <b className="num" style={{ fontSize: 38, lineHeight: 1.1 }}>{todayEntry?.weight ?? latest?.weight ?? '--'}</b>
              {!todayEntry && latest ? <span style={{ fontSize: 12, opacity: 0.85 }}>{fmtDateCN(latest.date)}记录</span> : null}
            </div>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,.22)', color: '#fff', backdropFilter: 'blur(4px)' }}
              onClick={() => window.dispatchEvent(new CustomEvent('ww:open-quick'))}
            >
              <IconPlus width={15} height={15} />
              {todayEntry ? '更新今日' : '记一笔'}
            </button>
          </div>
        </div>

        {/* 三格速览 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
          <HeroStat label="累计减重" value={planInfo ? `${planInfo.loss > 0 ? planInfo.loss : 0}` : '--'} unit="kg" />
          <HeroStat label="当前 BMI" value={bmi != null ? String(bmi) : '--'} unit={level ? level.level : ''} />
          <HeroStat label="剩余" value={planInfo ? String(planInfo.daysLeft) : '--'} unit="天" />
        </div>
      </div>

      {/* 计划卡片 */}
      <div className="section-title" onClick={() => nav('/plan')} style={{ cursor: 'pointer' }}>
        减重计划
        <span className="more">
          {plan ? '调整' : '去设定'} <IconChevron width={13} height={13} style={{ verticalAlign: -2 }} />
        </span>
      </div>
      {plan && planInfo ? (
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="badge badge-coral">
              <IconTarget width={13} height={13} />
              {plan.startWeight} → {plan.goalWeight} kg
            </div>
            <span style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>
              {plan.duration} {plan.unit === 'week' ? '周' : '个月'} · 至 {fmtDateCN(planInfo.endDate)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: 'var(--c-ink-2)' }}>
              已减 <b className="num" style={{ color: 'var(--c-coral-deep)' }}>{planInfo.loss > 0 ? planInfo.loss : 0}</b> / {planInfo.toLose} kg
            </span>
            <span style={{ color: 'var(--c-ink-2)' }}>
              还差 <b className="num">{planInfo.remainKg}</b> kg
            </span>
          </div>
          <Progress value={planInfo.progress} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-ink-3)', marginTop: 8 }}>
            <span>每日目标 −{planInfo.dailyTarget} kg</span>
            <span>
              时间进度 {Math.round(planInfo.timePct)}%（第 {planInfo.elapsed + 1}/{planInfo.total} 天）
            </span>
          </div>
        </div>
      ) : (
        <div className="card">
          <Empty
            title="还没有减重计划"
            desc="30 秒设定目标体重与周期，获得每日减重指引"
          >
            <button className="btn btn-primary" onClick={() => nav('/plan')}>
              开始设定
            </button>
          </Empty>
        </div>
      )}

      {/* 体重曲线 */}
      <div className="section-title" onClick={() => nav('/track')} style={{ cursor: 'pointer' }}>
        体重走势
        <span className="more">
          全部记录 <IconChevron width={13} height={13} style={{ verticalAlign: -2 }} />
        </span>
      </div>
      <div className="card card-pad">
        {sorted.length >= 2 ? (
          <WeightChart entries={sorted} heightCm={me.heightCm} goalWeight={plan?.goalWeight} startY={plan?.startWeight} />
        ) : (
          <Empty
            icon={<IconScale width={52} height={52} />}
            title={sorted.length === 1 ? '再记录 1 次就能看到曲线' : '记录两次体重后开启曲线'}
            desc="连续记录是看见变化的第一步"
          >
            <button className="btn btn-ghost" onClick={() => window.dispatchEvent(new CustomEvent('ww:open-quick'))}>
              立即记录
            </button>
          </Empty>
        )}
      </div>

      {/* 身高提示 */}
      {!me.heightCm ? (
        <div className="card card-pad card-tint" style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }} onClick={() => nav('/profile')}>
          <IconCloud width={20} height={20} style={{ color: 'var(--c-caramel)', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13, color: 'var(--c-ink-2)' }}>
            填写身高后可解锁 <b>BMI 分级提示</b> 与健康体重区间
          </div>
          <IconChevron width={15} height={15} style={{ color: 'var(--c-ink-3)' }} />
        </div>
      ) : null}
    </div>
  )
}

function HeroStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '9px 10px', backdropFilter: 'blur(2px)' }}>
      <div style={{ fontSize: 11, opacity: 0.9 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <b className="num" style={{ fontSize: 19 }}>{value}</b>
        <span style={{ fontSize: 10, opacity: 0.85 }}>{unit}</span>
      </div>
    </div>
  )
}
