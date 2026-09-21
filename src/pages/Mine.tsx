/** 我的 · 资料维护 / 账号安全 / 云同步中心 / 数据导出 */
import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'
import { Sheet, Modal, Empty } from '@/components/ui'
import { ThemeToggle } from '@/components/Widgets'
import { IconUser, IconChevron, IconLock, IconLogout, IconCloud, IconSync, IconArchive, IconInfo, IconScale } from '@/components/icons'
import { compressImage } from '@/lib/photo'
import { fmtDateTime } from '@/lib/format'
import { getDeviceId, getDeviceName } from '@/lib/storage'
import { CLOUD_API_BASE } from '@/lib/sync'
import { calcBmi, bmiLevel, healthyRange } from '@/lib/bmi'
import type { Gender } from '@/lib/types'

export default function Mine() {
  const nav = useNavigate()
  const { weights, photos, plan, sync, syncing, syncLogs, online, lastSyncAt, logout, updateProfile, changePassword, theme } = useApp()
  const me = useApp((s) => s.me())
  const avatarRef = useRef<HTMLInputElement>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [nick, setNick] = useState(me?.nickname ?? '')
  const [gender, setGender] = useState<Gender | ''>(me?.gender ?? '')
  const [height, setHeight] = useState<string>(me?.heightCm ? String(me.heightCm) : '')
  const [pwOpen, setPwOpen] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [exportData, setExportData] = useState<string | null>(null)

  if (!me) return <Navigate to="/auth" replace />

  const latest = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1)).pop()
  const bmi = latest && me.heightCm ? calcBmi(latest.weight, me.heightCm) : null
  const level = bmi ? bmiLevel(bmi) : null
  const range = healthyRange(me.heightCm)

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const { thumb } = await compressImage(file, 256, 256)
      await updateProfile({ avatar: thumb })
      useApp.getState().toast('头像已更新', 'ok')
    } catch {
      useApp.getState().toast('图片处理失败', 'err')
    }
  }

  const saveProfile = async () => {
    const h = Number(height)
    await updateProfile({
      nickname: nick.trim() || me!.nickname,
      gender: gender || undefined,
      heightCm: h >= 80 && h <= 250 ? Math.round(h) : me!.heightCm
    })
    setEditOpen(false)
    useApp.getState().toast('资料已保存', 'ok')
  }

  const submitPw = async () => {
    if (newPw.length < 6) return useApp.getState().toast('新密码至少 6 位', 'err')
    if (newPw !== newPw2) return useApp.getState().toast('两次输入的新密码不一致', 'err')
    try {
      await changePassword(oldPw, newPw)
      useApp.getState().toast('密码已修改', 'ok')
      setPwOpen(false)
      setOldPw(''); setNewPw(''); setNewPw2('')
    } catch (e) {
      useApp.getState().toast(e instanceof Error ? e.message : '修改失败', 'err')
    }
  }

  const doExport = () => {
    const data = JSON.stringify({ user: { ...me, passwordHash: undefined }, plan, weights, photos, exportedAt: new Date().toISOString() }, null, 2)
    setExportData(data)
  }

  return (
    <div className="page">
      <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatar} />

      {/* 个人卡 */}
      <div className="hero" style={{ marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 62, flexShrink: 0, cursor: 'pointer' }} onClick={() => avatarRef.current?.click()} role="button" aria-label="更换头像">
            {me.avatar ? (
              <img src={me.avatar} alt="头像" className="avatar" width={62} height={62} style={{ border: '2px solid rgba(255,255,255,.6)' }} />
            ) : (
              <div className="avatar" style={{ width: 62, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.25)', color: '#fff', fontWeight: 800, fontSize: 24, border: '2px solid rgba(255,255,255,.6)' }}>
                {(me.nickname || me.email)[0]?.toUpperCase()}
              </div>
            )}
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 22, background: '#fff', color: 'var(--c-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }}>
              <IconUser width={13} height={13} />
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ fontSize: 18, overflowWrap: 'anywhere' }}>{me.nickname || '未设置昵称'}</b>
            <div style={{ fontSize: 12, opacity: 0.9, overflowWrap: 'anywhere' }}>{me.email}</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
              {me.gender === 'male' ? '男' : me.gender === 'female' ? '女' : '性别未填'}
              {me.heightCm ? ` · ${me.heightCm}cm` : ' · 身高未填'}
              {latest ? ` · ${latest.weight}kg` : ''}
            </div>
          </div>
          <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.22)', color: '#fff' }} onClick={() => { setNick(me.nickname); setGender(me.gender); setHeight(me.heightCm ? String(me.heightCm) : ''); setEditOpen(true) }}>
            编辑
          </button>
        </div>
        {/* BMI 摘要 */}
        <div style={{ marginTop: 12, background: 'rgba(255,255,255,.16)', borderRadius: 12, padding: '8px 12px', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <IconScale width={16} height={16} />
          {bmi != null && level ? (
            <>
              <span style={{ whiteSpace: 'nowrap' }}>BMI <b className="num">{bmi}</b>（{level.level}）</span>
              <span style={{ opacity: 0.85 }}>{level.advice}</span>
            </>
          ) : (
            <span>{range ? `健康体重区间 ${range[0]}~${range[1]} kg，记录体重后查看你的 BMI` : '填写身高后解锁 BMI 分级'}</span>
          )}
        </div>
      </div>

      {/* 云同步中心 */}
      <div className="section-title">
        云同步
        <span className="more">{CLOUD_API_BASE ? '已连接云端' : '本地云模拟'}</span>
      </div>
      <div className="card card-pad">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <IconCloud width={34} height={34} style={{ color: online ? 'var(--c-coral)' : 'var(--c-ink-3)' }} />
            <span style={{ position: 'absolute', right: -1, bottom: 0, width: 9, height: 9, borderRadius: 9, background: online ? 'var(--c-ok)' : 'var(--c-ink-3)', border: '2px solid var(--c-paper)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{online ? '网络可用 · 自动同步已开启' : '当前离线 · 本地优先模式'}</div>
            <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>
              {lastSyncAt ? `上次同步 ${fmtDateTime(lastSyncAt)}` : '尚未同步，点右侧按钮立即同步'}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => sync()} disabled={syncing}>
            <IconSync width={15} height={15} />
            {syncing ? '同步中' : '立即同步'}
          </button>
        </div>
        {/* 同步日志 */}
        <div style={{ marginTop: 12, maxHeight: 150, overflowY: 'auto', paddingRight: 8, scrollbarGutter: 'stable' }}>
          {syncLogs.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--c-ink-3)', textAlign: 'center', padding: 8 }}>暂无同步记录</div>
          ) : (
            syncLogs.slice(0, 8).map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12, borderBottom: '1px dashed var(--c-line)' }}>
                <span className={`badge ${l.ok ? 'badge-ok' : 'badge-danger'}`}>{l.ok ? '成功' : '失败'}</span>
                <span style={{ color: 'var(--c-ink-2)' }}>{l.ok ? `↑${l.pushed} ↓${l.pulled}` : l.detail?.slice(0, 30)}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--c-ink-3)' }}>{fmtDateTime(l.at)}</span>
              </div>
            ))
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-ink-3)', marginTop: 8 }}>
          本机标识：{getDeviceName()}（{getDeviceId().slice(0, 10)}）· 数据合并策略：时间戳新者胜
        </div>
      </div>

      {/* 通用设置 */}
      <div className="section-title">通用</div>
      <div className="cell-group">
        <div className="cell" onClick={() => setEditOpen(true)}>
          <IconUser width={20} height={20} style={{ color: 'var(--c-coral)' }} />
          <div className="cell-body">
            <div className="cell-title">个人信息</div>
            <div className="cell-desc">头像 · 昵称 · 性别 · 身高</div>
          </div>
          <span className="cell-extra">›</span>
        </div>
        <div className="cell" style={{ cursor: 'default' }}>
          <ThemeToggle />
          <div className="cell-body">
            <div className="cell-title">深色模式</div>
            <div className="cell-desc">当前{theme === 'light' ? '浅色' : '深色'}主题</div>
          </div>
        </div>
        <div className="cell" onClick={() => setPwOpen(true)}>
          <IconLock width={20} height={20} style={{ color: 'var(--c-caramel)' }} />
          <div className="cell-body">
            <div className="cell-title">修改密码</div>
            <div className="cell-desc">需要验证当前密码</div>
          </div>
          <span className="cell-extra">›</span>
        </div>
        <div className="cell" onClick={doExport}>
          <IconArchive width={20} height={20} style={{ color: 'var(--c-info)' }} />
          <div className="cell-body">
            <div className="cell-title">导出数据</div>
            <div className="cell-desc">体重 {weights.length} 条 · 照片 {photos.length} 张 · {plan ? '已有计划' : '无计划'}</div>
          </div>
          <span className="cell-extra">›</span>
        </div>
        <div className="cell" onClick={() => nav('/about')}>
          <IconInfo width={20} height={20} style={{ color: 'var(--c-ok)' }} />
          <div className="cell-body">
            <div className="cell-title">关于暖轻</div>
            <div className="cell-desc">版本 · 数据说明 · 部署信息</div>
          </div>
          <span className="cell-extra">›</span>
        </div>
      </div>

      <button className="btn btn-outline btn-block" style={{ marginTop: 18, color: 'var(--c-danger)', borderColor: 'var(--c-danger)' }} onClick={() => setConfirmLogout(true)}>
        <IconLogout width={17} height={17} />
        退出登录
      </button>

      {/* 编辑资料 Sheet */}
      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="编辑个人信息">
        <div className="field">
          <label className="field-label">昵称</label>
          <input className="field-input" value={nick} maxLength={16} onChange={(e) => setNick(e.target.value)} placeholder="怎么称呼你" />
        </div>
        <div className="field">
          <label className="field-label">性别</label>
          <div className="chip-row">
            <button className="chip" data-active={gender === 'female'} onClick={() => setGender('female')}>女</button>
            <button className="chip" data-active={gender === 'male'} onClick={() => setGender('male')}>男</button>
            <button className="chip" data-active={gender === ''} onClick={() => setGender('')}>不告知</button>
          </div>
        </div>
        <div className="field">
          <label className="field-label">身高（cm）</label>
          <input className="field-input num" type="number" inputMode="numeric" min={80} max={250} value={height} onChange={(e) => setHeight(e.target.value)} placeholder="用于 BMI 计算" />
          {range ? <div className="field-hint">健康体重区间 {range[0]} ~ {range[1]} kg</div> : null}
        </div>
        <button className="btn btn-primary btn-block" onClick={saveProfile}>保存</button>
      </Sheet>

      {/* 修改密码 Sheet */}
      <Sheet open={pwOpen} onClose={() => setPwOpen(false)} title="修改密码">
        <div className="field">
          <label className="field-label">当前密码</label>
          <input className="field-input" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" />
        </div>
        <div className="field">
          <label className="field-label">新密码（至少 6 位）</label>
          <input className="field-input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="field">
          <label className="field-label">确认新密码</label>
          <input className="field-input" type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} autoComplete="new-password" />
        </div>
        <button className="btn btn-primary btn-block" disabled={!oldPw || !newPw || !newPw2} onClick={submitPw}>确认修改</button>
      </Sheet>

      {/* 导出数据 */}
      <Sheet open={exportData != null} onClose={() => setExportData(null)} title="数据导出（JSON）">
        {exportData ? (
          <>
            <pre style={{ fontSize: 11, background: 'var(--c-paper-2)', borderRadius: 10, padding: 12, overflowX: 'auto', maxHeight: 300, overflowY: 'auto', lineHeight: 1.5 }}>{exportData}</pre>
            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                navigator.clipboard?.writeText(exportData)
                useApp.getState().toast('已复制到剪贴板', 'ok')
              }}
            >
              复制 JSON
            </button>
          </>
        ) : null}
      </Sheet>

      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="退出登录？"
        message="本地数据保留在此设备，下次登录同账号可继续云同步"
        confirmText="退出"
        danger
        onConfirm={() => {
          logout()
          nav('/auth')
        }}
      />
    </div>
  )
}
