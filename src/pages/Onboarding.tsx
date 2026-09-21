/** 首次启动引导（3 屏）+ 完成后进入补全资料 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'
import { IconScale, IconTarget, IconCamera } from '@/components/icons'

const SLIDES = [
  {
    icon: <IconScale width={54} height={54} />,
    title: '每天 10 秒，记录体重',
    desc: '手动录入今日体重，BMI 自动计算分级，曲线看见趋势',
    bg: 'linear-gradient(135deg,#FF7F50,#f2924f)'
  },
  {
    icon: <IconTarget width={54} height={54} />,
    title: '设定计划，科学减重',
    desc: '目标体重 + 周期，自动算出每日减重目标与剩余进度',
    bg: 'linear-gradient(135deg,#f2924f,#C68E17)'
  },
  {
    icon: <IconCamera width={54} height={54} />,
    title: '拍照对比，见证变化',
    desc: '体重照按时间轴归档，滑动对比前后变化；食物 GI 与运动消耗随时查',
    bg: 'linear-gradient(135deg,#C68E17,#FF7F50)'
  }
]

export default function Onboarding() {
  const nav = useNavigate()
  const finishOnboarding = useApp((s) => s.finishOnboarding)
  const me = useApp((s) => s.me())
  const [step, setStep] = useState(0)
  const s = SLIDES[step]

  const done = () => {
    finishOnboarding()
    nav(me ? '/profile-setup' : '/auth', { replace: true })
  }

  return (
    <div className="auth-wrap" style={{ justifyContent: 'space-between', minHeight: '100dvh', paddingTop: '18vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: 34,
            margin: '0 auto 26px',
            background: s.bg,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 16px 40px rgba(255,127,80,.35)'
          }}
        >
          {s.icon}
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>{s.title}</h2>
        <p style={{ fontSize: 14, color: 'var(--c-ink-2)', margin: '0 auto', maxWidth: 280, lineHeight: 1.7 }}>{s.desc}</p>
      </div>

      <div>
        <div className="onb-dots">
          {SLIDES.map((_, i) => (
            <i key={i} data-on={i === step} />
          ))}
        </div>
        <button className="btn btn-primary btn-block" onClick={() => (step < SLIDES.length - 1 ? setStep(step + 1) : done())}>
          {step < SLIDES.length - 1 ? '下一页' : '开始使用'}
        </button>
        {step === 0 ? (
          <button className="linklike" style={{ display: 'block', margin: '12px auto 0', fontSize: 13 }} onClick={done}>
            跳过
          </button>
        ) : null}
      </div>
    </div>
  )
}
