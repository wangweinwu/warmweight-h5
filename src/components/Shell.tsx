/** 主框架：底部 Tab + 记录 FAB + 离线横幅 + 路由出口 */
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'
import { QuickWeightSheet } from '@/components/QuickWeightSheet'
import { IconHome, IconChart, IconCamera, IconSearch, IconUser, IconPlus, IconCloud, IconRun } from './icons'

const TABS = [
  { path: '/', label: '首页', icon: IconHome },
  { path: '/track', label: '追踪', icon: IconChart },
  { path: '/gallery', label: '照片', icon: IconCamera },
  { path: '/foods', label: '查询', icon: IconSearch },
  { path: '/mine', label: '我的', icon: IconUser }
]

/** 隐藏 FAB 的路径 */
const FAB_HIDDEN = ['/gallery', '/plan', '/about', '/profile-setup']

export default function Shell() {
  const loc = useLocation()
  const nav = useNavigate()
  const online = useApp((s) => s.online)
  const [fabOpen, setFabOpen] = useState(false)

  /* 其他页面（首页空态等）通过事件打开全局记录 Sheet */
  useEffect(() => {
    const open = () => setFabOpen(true)
    window.addEventListener('ww:open-quick', open)
    return () => window.removeEventListener('ww:open-quick', open)
  }, [])

  /* 离线/恢复自动同步 */
  const setOnline = useApp((s) => s.setOnline)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [setOnline])

  /* 查询 Tab：在 食物/运动 之间记忆切换 */
  const queryTab = loc.pathname.startsWith('/sports') || loc.pathname.startsWith('/foods')
  const queryActive = queryTab || loc.pathname === '/foods'

  const showFab = !FAB_HIDDEN.includes(loc.pathname)

  return (
    <>
      {/* 离线提示条 */}
      {!online ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '5px 12px',
            fontSize: 12,
            color: '#fff',
            background: 'linear-gradient(90deg, var(--c-caramel), var(--c-warn-strong))'
          }}
        >
          <IconCloud width={14} height={14} />
          离线模式 · 数据保存在本机，联网后自动同步
        </div>
      ) : null}

      <Outlet />

      {/* 记录 FAB（非隐藏页显示） */}
      {showFab ? (
        <button className="fab" onClick={() => setFabOpen(true)} aria-label="快速记录体重">
          <IconPlus />
        </button>
      ) : null}

      {/* 查询页内：食物/运动 二级切换 FAB（覆盖在 Tab 上方，点击切换） */}
      {queryTab ? <QuerySwitch pathname={loc.pathname} onGo={(p) => nav(p)} /> : null}

      <QuickWeightSheet open={fabOpen} onClose={() => setFabOpen(false)} />

      {/* 底部导航 */}
      <nav className="tabbar" aria-label="主导航">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.path === '/' ? loc.pathname === '/' : loc.pathname.startsWith(t.path) || (t.path === '/foods' && loc.pathname.startsWith('/sports'))
          return (
            <button
              key={t.path}
              className="tab-item"
              data-active={active}
              onClick={() => nav(t.path)}
              aria-current={active ? 'page' : undefined}
            >
              <Icon />
              <span>{t.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

/** 食物/运动子页切换浮标 */
function QuerySwitch({ pathname, onGo }: { pathname: string; onGo: (p: string) => void }) {
  const onFoods = pathname.startsWith('/foods')
  return (
    <button
      className="fab"
      style={{
        width: 46,
        height: 46,
        right: 'max(18px, env(safe-area-inset-right))',
        bottom: 'calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 84px)',
        background: 'linear-gradient(135deg, var(--c-caramel), var(--c-warn-strong))',
        boxShadow: '0 8px 20px rgba(198,142,23,.4)'
      }}
      onClick={() => onGo(onFoods ? '/sports' : '/foods')}
      aria-label={onFoods ? '切换到运动消耗查询' : '切换到食物热量查询'}
    >
      {onFoods ? <IconRun width={22} height={22} /> : <IconSearch width={22} height={22} />}
    </button>
  )
}
