/** 前后对比滑块（拖动分割线查看两张照片差异） */
import { useRef, useState, useCallback } from 'react'

export function CompareSlider({ before, after, beforeLabel = '之前', afterLabel = '现在', height = 420 }: {
  before: string
  after: string
  beforeLabel?: string
  afterLabel?: string
  height?: number
}) {
  const [pos, setPos] = useState(50) // 百分比
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const move = useCallback((clientX: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos(Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  return (
    <div
      ref={ref}
      className="compare"
      style={{ height, position: 'relative' }}
      onPointerDown={(e) => {
        dragging.current = true
        move(e.clientX)
      }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      {/* 底层：现在（完整显示） */}
      <img src={after} alt={afterLabel} style={{ height: '100%', objectFit: 'cover' }} draggable={false} />
      {/* 上层：之前（按 pos 裁剪宽度） */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${pos}%` }}>
        <img src={before} alt={beforeLabel} style={{ height: '100%', objectFit: 'cover', width: ref.current?.offsetWidth ?? '100%' }} draggable={false} />
      </div>

      <span className="compare-tag" style={{ left: 10 }}>{beforeLabel}</span>
      <span className="compare-tag" style={{ right: 10 }}>{afterLabel}</span>

      <div className="compare-handle" style={{ left: `${pos}%` }} />
      <div className="compare-knob" style={{ left: `${pos}%`, top: '50%', position: 'absolute', transform: 'translate(-50%,-50%)' }} aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="m9 6-4 6 4 6M15 6l4 6-4 6" />
        </svg>
      </div>
    </div>
  )
}
