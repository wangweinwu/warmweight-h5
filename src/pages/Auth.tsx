/** 认证：登录 / 注册 / 找回密码（免验证码，3 步内完成） */
import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'

type Mode = 'login' | 'register' | 'forgot'

export default function Auth() {
  const nav = useNavigate()
  const { register, login, resetPassword, findEmail } = useApp()
  const me = useApp((s) => s.me())
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [nickname, setNickname] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // 注册/登录进行中不拦截：等待编程式导航，避免与守卫竞争
  if (me && !busy) return <Navigate to="/profile-setup" replace />

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const pwOk = pw.length >= 6

  const submit = async () => {
    setErr('')
    if (!emailOk) return setErr('请输入正确的邮箱地址')
    if (!pwOk) return setErr('密码至少 6 位')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, pw)
        nav('/', { replace: true })
      } else if (mode === 'register') {
        if (pw !== pw2) throw new Error('两次输入的密码不一致')
        await register(email, pw, nickname)
        nav('/profile-setup', { replace: true })
      } else {
        if (pw !== pw2) throw new Error('两次输入的密码不一致')
        if (!findEmail(email)) throw new Error('未找到该邮箱账户，请先注册')
        await resetPassword(email, pw)
        useApp.getState().toast('密码已重置，请登录', 'ok')
        setMode('login')
        setPw(''); setPw2('')
        return
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : '操作失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      {/* 品牌头 */}
      <div className="auth-logo">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      </div>
      <h1 className="auth-title">{mode === 'login' ? '欢迎回来' : mode === 'register' ? '创建账号' : '找回密码'}</h1>
      <p className="auth-sub">暖轻 · 记录体重，温柔地变好</p>

      {/* 表单 */}
      {mode === 'register' ? (
        <div className="field">
          <label className="field-label">昵称</label>
          <input className="field-input" value={nickname} maxLength={16} onChange={(e) => setNickname(e.target.value)} placeholder="怎么称呼你（可留空）" />
        </div>
      ) : null}

      <div className="field">
        <label className="field-label">邮箱</label>
        <input
          className="field-input"
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>

      {mode !== 'forgot' ? (
        <div className="field">
          <label className="field-label">密码</label>
          <input
            className="field-input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder={mode === 'register' ? '至少 6 位' : '输入密码'}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
      ) : (
        <div className="field">
          <label className="field-label">新密码（至少 6 位）</label>
          <input
            className="field-input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="设置新密码"
            autoComplete="new-password"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
      )}

      {mode !== 'login' ? (
        <div className="field">
          <label className="field-label">{mode === 'forgot' ? '设置新密码' : '确认密码'}</label>
          <input
            className="field-input"
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="再输一遍"
            autoComplete="new-password"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
      ) : null}

      {err ? (
        <div style={{ color: 'var(--c-danger)', fontSize: 13, margin: '-6px 0 12px', textAlign: 'center' }} role="alert">
          {err}
        </div>
      ) : null}

      <button className="btn btn-primary btn-block" disabled={busy || !email || !pw} onClick={submit}>
        {busy ? '请稍候…' : mode === 'login' ? '登录' : mode === 'register' ? '注册并开始' : '重置密码'}
      </button>

      {/* 模式切换 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 18, fontSize: 13 }}>
        {mode !== 'login' ? (
          <button className="linklike" onClick={() => { setMode('login'); setErr(''); setPw(''); setPw2('') }}>返回登录</button>
        ) : (
          <>
            <button className="linklike" onClick={() => { setMode('register'); setErr(''); setPw(''); setPw2('') }}>注册新账号</button>
            <button className="linklike" style={{ color: 'var(--c-ink-3)' }} onClick={() => { setMode('forgot'); setErr(''); setPw(''); setPw2('') }}>忘记密码</button>
          </>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--c-ink-3)', marginTop: 26, lineHeight: 1.6 }}>
        注册免验证码 · 数据优先存本机，可云同步<br />
        仅供健康管理参考，不构成医疗建议
      </p>
    </div>
  )
}
