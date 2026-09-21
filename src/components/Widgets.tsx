/** Toast 轻提示 · 主题切换 · 全局小部件 */
import { useApp } from '@/store/useApp'
import { IconMoon, IconSun } from './icons'

export function ToastHost() {
  const toasts = useApp((s) => s.toasts)
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className="toast" data-kind={t.kind} role="status">
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function ThemeToggle() {
  const theme = useApp((s) => s.theme)
  const toggleTheme = useApp((s) => s.toggleTheme)
  return (
    <button className="nav-btn" onClick={toggleTheme} aria-label="切换深浅主题">
      {theme === 'light' ? <IconMoon width={19} height={19} /> : <IconSun width={19} height={19} />}
    </button>
  )
}
