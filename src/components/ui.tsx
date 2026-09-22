/** 通用 UI 小组件 */
import { useState } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import { IconBack, IconClose } from './icons'

export function NavBar({ title, back, right, transparent = false }: { title: string; back?: () => void; right?: ReactNode; transparent?: boolean }) {
  return (
    <div className="navbar" style={transparent ? { background: 'transparent', border: 'none', backdropFilter: 'none', WebkitBackdropFilter: 'none' } : undefined}>
      {back ? (
        <button className="nav-btn" onClick={back} aria-label="返回">
          <IconBack width={20} height={20} />
        </button>
      ) : null}
      <div className="navbar-title">{title}</div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>{right}</div>
    </div>
)
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-grabber" />
        {title ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <b style={{ fontSize: 17 }}>{title}</b>
            <button className="nav-btn" onClick={onClose} aria-label="关闭" style={{ width: 32, height: 32 }}>
              <IconClose width={18} height={18} />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, message, confirmText = '确定', onConfirm, danger = false }: {
  open: boolean
  onClose: () => void
  title: string
  message?: ReactNode
  confirmText?: string
  onConfirm?: () => void
  danger?: boolean
}) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {message ? <div className="modal-msg">{message}</div> : null}
        <div className="modal-btns">
          <button className="btn btn-outline" onClick={onClose}>取消</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm?.()
              onClose()
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Empty({ icon, title, desc, children }: { icon?: ReactNode; title: string; desc?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <div className="empty-title">{title}</div>
      {desc ? <p>{desc}</p> : null}
      {children ? <div style={{ marginTop: 16 }}>{children}</div> : null}
    </div>
  )
}

export function Progress({ value, max = 100, height = 8 }: { value: number; max?: number; height?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="progress-track" style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, options, style }: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  style?: CSSProperties
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 4,
        background: 'var(--c-cream)',
        borderRadius: 'var(--r-full)',
        padding: 3,
        ...style
      }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1,
            minHeight: 32,
            border: 'none',
            borderRadius: 'var(--r-full)',
            fontSize: 13,
            fontWeight: value === o.value ? 700 : 500,
            color: value === o.value ? '#fff' : 'var(--c-ink-2)',
            background: value === o.value ? 'linear-gradient(135deg,var(--c-coral),var(--c-coral-deep))' : 'transparent',
            cursor: 'pointer',
            transition: 'all .2s'
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 9999, unit, editable = true }: {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  unit?: string
  /** 中间数值可点击直接输入（默认开启） */
  editable?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const fmt = (n: number) => (step < 1 ? n.toFixed(1) : String(Math.round(n)))

  const commit = () => {
    const n = Number(draft)
    if (draft.trim() !== '' && isFinite(n)) {
      const clamped = Math.min(max, Math.max(min, Math.round(n * 10) / 10))
      onChange(clamped)
    }
    setEditing(false)
  }

  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} disabled={value <= min} aria-label="减少">−</button>
      {editing ? (
        <input
          className="stepper-input num"
          type="number"
          inputMode="decimal"
          step="any"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          aria-label="输入数值"
        />
      ) : (
        <span
          onClick={editable ? () => { setDraft(String(value)); setEditing(true) } : undefined}
          style={editable ? { cursor: 'text', borderBottom: '1px dashed var(--c-line-strong)' } : undefined}
          title={editable ? '点击直接输入' : undefined}
        >
          {fmt(value)}{unit ? <i style={{ fontStyle: 'normal', fontSize: 12, color: 'var(--c-ink-3)' }}> {unit}</i> : null}
        </span>
      )}
      <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} disabled={value >= max} aria-label="增加">+</button>
    </div>
  )
}

/** 圆环进度（暖阳主题元素） */
export function Ring({ pct, size = 120, stroke = 10, color = '#fff', track = 'rgba(255,255,255,.25)', children }: {
  pct: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(100, pct))
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  )
}
