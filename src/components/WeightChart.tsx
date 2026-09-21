/**
 * 体重变化曲线（纯 SVG，零依赖）
 * 支持：双指/滚轮缩放、拖拽平移、数据点点击查看 tooltip
 */
import { useRef, useState, useMemo, useCallback } from 'react'
import type { WeightEntry } from '@/lib/types'
import { fmtDateCN, round1 } from '@/lib/format'
import { calcBmi } from '@/lib/bmi'

interface Props {
  entries: WeightEntry[]
  heightCm: number
  goalWeight?: number
  startY?: number
}

type Tip = { x: number; y: number; entry: WeightEntry }

const COLOR_LINE = '#FF7F50'
const COLOR_AREA_FROM = 'rgba(255,127,80,.28)'
const COLOR_AREA_TO = 'rgba(255,127,80,.02)'
const COLOR_GOAL = '#C68E17'
const W = 640
const H = 260
const PAD = { l: 42, r: 16, t: 26, b: 30 }

export function WeightChart({ entries, heightCm, goalWeight, startY }: Props) {
  const [view, setView] = useState<{ from: number; to: number } | null>(null) // 索引区间，null=全量
  const [tip, setTip] = useState<Tip | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const gesture = useRef<{ mode: 'pan' | 'zoom' | null; x: number; dist: number; from: number; to: number }>({ mode: null, x: 0, dist: 0, from: 0, to: 0 })

  const sorted = useMemo(() => [...entries].sort((a, b) => (a.date < b.date ? -1 : 1)), [entries])

  const range = view ?? { from: 0, to: Math.max(0, sorted.length - 1) }
  const slice = useMemo(() => sorted.slice(range.from, range.to + 1), [sorted, range])

  const { xs, ys, wMin, wMax } = useMemo(() => {
    const ws = slice.map((e) => e.weight)
    let lo = Math.min(...ws, goalWeight ?? Infinity, startY ?? Infinity)
    let hi = Math.max(...ws, goalWeight ?? -Infinity, startY ?? -Infinity)
    if (!isFinite(lo)) { lo = 40; hi = 80 }
    const span = Math.max(hi - lo, 1.6)
    lo -= span * 0.12
    hi += span * 0.12
    lo = round1(Math.floor(lo * 2) / 2)
    hi = round1(Math.ceil(hi * 2) / 2)
    const n = slice.length
    const plotW = W - PAD.l - PAD.r
    const xs: number[] = []
    const ys: number[] = []
    for (let i = 0; i < n; i++) {
      xs.push(n === 1 ? PAD.l + plotW / 2 : PAD.l + (plotW * i) / (n - 1))
      ys.push(PAD.t + (H - PAD.t - PAD.b) * (1 - (slice[i].weight - lo) / (hi - lo)))
    }
    return { xs, ys, wMin: lo, wMax: hi }
  }, [slice, goalWeight, startY])

  const linePath = useMemo(() => xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' '), [xs, ys])
  const areaPath = useMemo(() => {
    if (!xs.length) return ''
    const baseY = H - PAD.b
    return `${linePath} L${xs[xs.length - 1].toFixed(1)},${baseY} L${xs[0].toFixed(1)},${baseY} Z`
  }, [linePath, xs])

  const goalY = goalWeight != null ? PAD.t + (H - PAD.t - PAD.b) * (1 - (goalWeight - wMin) / (wMax - wMin)) : null
  const goalVisible = goalY != null && goalWeight != null && goalWeight >= wMin && goalWeight <= wMax

  /* ---- 手势 ---- */
  const idxFromClientX = useCallback(
    (clientX: number) => {
      const svg = svgRef.current
      if (!svg) return null
      const rect = svg.getBoundingClientRect()
      const vx = ((clientX - rect.left) / rect.width) * W
      let best = -1
      let bestD = 1e9
      xs.forEach((x, i) => {
        const d = Math.abs(x - vx)
        if (d < bestD) {
          bestD = d
          best = i
        }
      })
      return best >= 0 ? { idx: best, vx } : null
    },
    [xs]
  )

  const onPointerDown = (e: React.PointerEvent) => {
    const from = range.from
    const to = range.to
    if (e.pointerType === 'touch' && e.isPrimary === false) {
      // 第二根手指按下 → 双指缩放
      gesture.current = { mode: 'zoom', x: 0, dist: touchDist(e), from, to }
      return
    }
    gesture.current = { mode: 'pan', x: e.clientX, dist: 0, from, to }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (g.mode === 'pan') {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const dxView = ((e.clientX - g.x) / rect.width) * W
      const n = sorted.length
      const perPx = (W - PAD.l - PAD.r) / Math.max(1, g.to - g.from)
      const shift = Math.round(dxView / perPx)
      let from = g.from - shift
      let to = g.to - shift
      if (from < 0) { to -= from; from = 0 }
      if (to > n - 1) { from -= to - (n - 1); to = n - 1 }
      from = Math.max(0, from)
      setView({ from, to })
      setTip(null)
    } else if (g.mode === 'zoom') {
      const scale = g.dist / (touchDist(e) || 1)
      applyZoom(scale, g.from, g.to)
    } else {
      // hover 查看点
      const hit = idxFromClientX(e.clientX)
      if (hit) setTip({ x: xs[hit.idx], y: ys[hit.idx], entry: slice[hit.idx] })
    }
  }

  const onPointerUp = () => {
    gesture.current.mode = null
  }

  const applyZoom = (scale: number, from: number, to: number) => {
    const n = sorted.length
    const size = to - from + 1
    let newSize = Math.round(size * scale)
    newSize = Math.max(5, Math.min(n, newSize))
    const center = (from + to) / 2
    let f = Math.round(center - newSize / 2)
    f = Math.max(0, Math.min(n - newSize, f))
    setView({ from: f, to: f + newSize - 1 })
    setTip(null)
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const n = sorted.length
    const size = range.to - range.from + 1
    const scale = e.deltaY > 0 ? 1.18 : 1 / 1.18
    let newSize = Math.round(size * scale)
    newSize = Math.max(5, Math.min(n, newSize))
    // 以指针位置为中心
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const center = range.from + size * ratio
    let f = Math.round(center - newSize * ratio)
    f = Math.max(0, Math.min(n - newSize, f))
    setView({ from: f, to: f + newSize - 1 })
    setTip(null)
  }

  const resetZoom = () => setView(null)
  const zoomed = view != null && (view.from > 0 || view.to < sorted.length - 1)

  const fmtRange = () => {
    if (!slice.length) return ''
    const a = slice[0].date
    const b = slice[slice.length - 1].date
    return a === b ? fmtDateCN(a, true) : `${fmtDateCN(a)} ~ ${fmtDateCN(b)}`
  }

  // y 轴刻度（5 档）
  const yTicks = useMemo(() => {
    const ticks: number[] = []
    for (let i = 0; i <= 4; i++) ticks.push(round1(wMin + ((wMax - wMin) * i) / 4))
    return ticks
  }, [wMin, wMax])

  return (
    <div style={{ position: 'relative', touchAction: 'pan-y' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', display: 'block' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          onPointerUp()
          setTip(null)
        }}
        onWheel={onWheel}
        onClick={(e) => {
          const hit = idxFromClientX(e.clientX)
          if (hit) setTip({ x: xs[hit.idx], y: ys[hit.idx], entry: slice[hit.idx] })
        }}
      >
        <defs>
          <linearGradient id="ww-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR_AREA_FROM} />
            <stop offset="100%" stopColor={COLOR_AREA_TO} />
          </linearGradient>
        </defs>

        {/* 网格与 y 轴 */}
        {yTicks.map((t, i) => {
          const y = PAD.t + (H - PAD.t - PAD.b) * (1 - i / 4)
          return (
            <g key={i}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--c-line)" strokeDasharray="3 5" strokeWidth="1" />
              <text x={PAD.l - 7} y={y + 4} textAnchor="end" fontSize="11" fill="var(--c-ink-3)" fontFamily="var(--font-num)">
                {t}
              </text>
            </g>
          )
        })}

        {/* 目标线 */}
        {goalVisible && goalY != null ? (
          <g>
            <line x1={PAD.l} x2={W - PAD.r} y1={goalY} y2={goalY} stroke={COLOR_GOAL} strokeWidth="1.6" strokeDasharray="7 5" />
            <text x={W - PAD.r} y={goalY - 6} textAnchor="end" fontSize="11" fill={COLOR_GOAL} fontWeight="700">
              目标 {goalWeight}kg
            </text>
          </g>
        ) : null}

        {/* 面积 + 折线 */}
        <path d={areaPath} fill="url(#ww-area)" />
        <path d={linePath} fill="none" stroke={COLOR_LINE} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />

        {/* 数据点 */}
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ys[i]}
            r={tip?.entry === slice[i] ? 5.5 : 3.4}
            fill="#fff"
            stroke={COLOR_LINE}
            strokeWidth="2.2"
            style={{ transition: 'r .12s' }}
          />
        ))}

        {/* x 轴首尾标签 */}
        {slice.length > 0 ? (
          <>
            <text x={PAD.l} y={H - 9} fontSize="11" fill="var(--c-ink-3)">
              {slice[0].date.slice(5).replace('-', '/')}
            </text>
            {slice.length > 1 ? (
              <text x={W - PAD.r} y={H - 9} textAnchor="end" fontSize="11" fill="var(--c-ink-3)">
                {slice[slice.length - 1].date.slice(5).replace('-', '/')}
              </text>
            ) : null}
          </>
        ) : null}
      </svg>

      {tip ? (
        <div className="chart-tip" style={{ left: `${(tip.x / W) * 100}%`, top: `${(tip.y / H) * 100}%` }}>
          <div style={{ opacity: 0.8 }}>{tip.entry.date}</div>
          <b>{tip.entry.weight} kg</b>
          {heightCm ? <div style={{ opacity: 0.85 }}>BMI {calcBmi(tip.entry.weight, heightCm) ?? '—'}</div> : null}
          {tip.entry.note ? <div style={{ opacity: 0.85 }}>{tip.entry.note}</div> : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px 0' }}>
        <span style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>{fmtRange()}</span>
        {zoomed ? (
          <button className="btn btn-ghost btn-sm" onClick={resetZoom}>
            复位缩放
          </button>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>双指缩放 · 拖动平移 · 点按看数值</span>
        )}
      </div>
    </div>
  )
}

function touchDist(e: React.PointerEvent): number {
  const ev = e as unknown as { touches?: TouchList }
  if (ev.touches && ev.touches.length >= 2) {
    const [a, b] = [ev.touches[0], ev.touches[1]]
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
  }
  return 0
}
