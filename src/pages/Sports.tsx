/** 运动消耗 · 选运动 + 调时长 → 实时按体重计算（2 步） */
import { useMemo, useState } from 'react'
import { SPORT_DB, SPORT_CATEGORIES, calcBurn } from '@/data/sports'
import { useApp } from '@/store/useApp'
import { Empty, Stepper } from '@/components/ui'
import { IconSearch, IconClose, IconRun, IconFlame } from '@/components/icons'

export default function Sports() {
  const { weights } = useApp()
  const me = useApp((s) => s.me())
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('全部')
  const [minutes, setMinutes] = useState(30)
  const [active, setActive] = useState<string | null>('快走(5.6km/h)')

  /* 体重取当前记录，否则用身高推算，最后兜底 60kg */
  const weight = weights[weights.length - 1]?.weight ?? (me?.heightCm ? Math.round((me.heightCm - 105) * 10) / 10 : 60)

  const list = useMemo(() => {
    let out = SPORT_DB
    const kw = q.trim().toLowerCase()
    if (kw) out = out.filter((s) => s.name.toLowerCase().includes(kw))
    if (cat !== '全部') out = out.filter((s) => s.category === cat)
    return out
  }, [q, cat])

  const activeSport = SPORT_DB.find((s) => s.name === active) ?? null
  const burn = activeSport ? calcBurn(activeSport.met, weight, minutes) : 0

  return (
    <div className="page">
      {/* 搜索 */}
      <div className="search-box" style={{ marginTop: 4 }}>
        <IconSearch />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索运动，如“跳绳”“游泳”" aria-label="搜索运动" />
        {q ? (
          <button className="search-clear" onClick={() => setQ('')} aria-label="清空">
            <IconClose width={14} height={14} />
          </button>
        ) : null}
      </div>

      {/* 分类 */}
      <div className="chip-row" role="tablist" aria-label="运动分类">
        {['全部', ...SPORT_CATEGORIES].map((c) => (
          <button key={c} className="chip" data-active={cat === c} onClick={() => setCat(c)} role="tab" aria-selected={cat === c}>
            {c}
          </button>
        ))}
      </div>

      {/* 计算器（选中运动后实时显示） */}
      {activeSport ? (
        <div className="hero" style={{ marginTop: 14, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconFlame width={20} height={20} />
            <b style={{ fontSize: 15 }}>{activeSport.name}</b>
            <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>MET {activeSport.met}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <div>
              <span className="num" style={{ fontSize: 40, fontWeight: 800 }}>{burn}</span>
              <span style={{ fontSize: 13, opacity: 0.9, marginLeft: 4 }}>kcal</span>
              <div style={{ fontSize: 11, opacity: 0.85 }}>按体重 {weight} kg 计算</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Stepper value={minutes} onChange={setMinutes} step={5} min={5} max={300} unit="分钟" />
            </div>
          </div>
          {/* 快捷时长 */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {[15, 30, 45, 60, 90].map((m) => (
              <button
                key={m}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  minHeight: 30,
                  background: minutes === m ? '#fff' : 'rgba(255,255,255,.2)',
                  color: minutes === m ? 'var(--c-coral-deep)' : '#fff',
                  fontWeight: 600
                }}
                onClick={() => setMinutes(m)}
              >
                {m}分
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 运动列表 */}
      <div style={{ fontSize: 12, color: 'var(--c-ink-3)', margin: '12px 2px 8px' }}>
        {list.length} 项运动 · 拖动时长实时计算
      </div>
      {list.length === 0 ? (
        <div className="card">
          <Empty icon={<IconRun width={52} height={52} />} title="没找到相关运动" desc="换个关键词试试" />
        </div>
      ) : (
        <div className="cell-group">
          {list.map((s) => {
            const per30 = calcBurn(s.met, weight, 30)
            return (
              <div
                key={s.name}
                className="cell"
                data-active={active === s.name}
                onClick={() => setActive(s.name)}
                style={active === s.name ? { background: 'var(--c-coral-soft)' } : undefined}
              >
                <div className="cell-body">
                  <div className="cell-title">{s.name}</div>
                  <div className="cell-desc">{s.category} · MET {s.met}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <b className="num" style={{ fontSize: 15, color: active === s.name ? 'var(--c-coral-deep)' : 'var(--c-ink)' }}>{per30}</b>
                  <i style={{ fontStyle: 'normal', fontSize: 10, color: 'var(--c-ink-3)' }}> kcal/30分</i>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
