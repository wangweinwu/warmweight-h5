/** 注册/引导后首次资料补全（1 步保存 → 进首页设定计划） */
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'

export default function ProfileSetup() {
  const nav = useNavigate()
  const updateProfile = useApp((s) => s.updateProfile)
  const me = useApp((s) => s.me())
  const [nickname, setNickname] = useState(me?.nickname ?? '')
  const [gender, setGender] = useState<'' | 'male' | 'female'>(me?.gender ?? '')
  const [height, setHeight] = useState(me?.heightCm ? String(me.heightCm) : '')
  const [busy, setBusy] = useState(false)

  if (!me) return <Navigate to="/auth" replace />
  const h = Number(height)
  const ok = h >= 80 && h <= 250

  const submit = async () => {
    setBusy(true)
    try {
      await updateProfile({ nickname: nickname.trim() || me.nickname, gender: gender || undefined, heightCm: ok ? Math.round(h) : undefined })
      nav('/plan', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 48px)' }}>
      <div style={{ textAlign: 'center', margin: '18px 0 26px' }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 6px' }}>完善你的资料</h2>
        <p style={{ fontSize: 13, color: 'var(--c-ink-2)', margin: 0 }}>身高用于自动计算 BMI 与健康体重区间</p>
      </div>

      <div className="card card-pad">
        <div className="field">
          <label className="field-label">昵称</label>
          <input className="field-input" value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} placeholder="怎么称呼你" />
        </div>
        <div className="field">
          <label className="field-label">性别</label>
          <div className="chip-row">
            <button className="chip" data-active={gender === 'female'} onClick={() => setGender('female')}>女</button>
            <button className="chip" data-active={gender === 'male'} onClick={() => setGender('male')}>男</button>
            <button className="chip" data-active={gender === ''} onClick={() => setGender('')}>不告知</button>
          </div>
        </div>
        <div className="field" style={{ marginBottom: 4 }}>
          <label className="field-label">身高（cm）</label>
          <input className="field-input num" type="number" inputMode="numeric" min={80} max={250} value={height} onChange={(e) => setHeight(e.target.value)} placeholder="如 170" />
          {!ok && height ? <div className="field-hint field-error">请输入 80~250 之间的身高</div> : null}
        </div>
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} disabled={busy || !ok} onClick={submit}>
        保存并设定减重计划
      </button>
      <button className="linklike" style={{ display: 'block', margin: '14px auto 0', fontSize: 13 }} onClick={() => nav('/', { replace: true })}>
        稍后再说，先逛逛
      </button>
    </div>
  )
}
