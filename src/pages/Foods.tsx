/** 食物库 · 搜索 + 分类筛选 + 份量换算（2 步内出结果） */
import { useMemo, useState } from 'react'
import { FOOD_DB, FOOD_CATEGORIES, giLevel, kcalLevel } from '@/data/foods'
import { Segmented, Empty } from '@/components/ui'
import { IconSearch, IconClose, IconLeaf } from '@/components/icons'
import { thousand } from '@/lib/format'

type SortKey = 'default' | 'kcal' | 'gi'

export default function Foods() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('全部')
  const [sort, setSort] = useState<SortKey>('default')

  const list = useMemo(() => {
    let out = FOOD_DB
    const kw = q.trim().toLowerCase()
    if (kw) out = out.filter((f) => f.name.toLowerCase().includes(kw))
    if (cat !== '全部') out = out.filter((f) => f.category === cat)
    if (sort === 'kcal') out = [...out].sort((a, b) => a.kcal - b.kcal)
    if (sort === 'gi') out = [...out].sort((a, b) => a.gi - b.gi)
    return out
  }, [q, cat, sort])

  return (
    <div className="page">
      {/* 第 1 步：搜索 */}
      <div className="search-box" style={{ marginTop: 4 }}>
        <IconSearch />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索食物，如“鸡胸肉”“燕麦”"
          aria-label="搜索食物"
          enterKeyHint="search"
        />
        {q ? (
          <button className="search-clear" onClick={() => setQ('')} aria-label="清空搜索">
            <IconClose width={14} height={14} />
          </button>
        ) : null}
      </div>

      {/* 第 2 步：分类筛选 */}
      <div className="chip-row" role="tablist" aria-label="食物分类">
        {['全部', ...FOOD_CATEGORIES].map((c) => (
          <button key={c} className="chip" data-active={cat === c} onClick={() => setCat(c)} role="tab" aria-selected={cat === c}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '10px 2px' }}>
        <span style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>{list.length} 种食物</span>
        <div style={{ marginLeft: 'auto' }}>
          <Segmented
            value={sort}
            onChange={setSort}
            options={[
              { value: 'default', label: '默认' },
              { value: 'kcal', label: '热量↓' },
              { value: 'gi', label: 'GI↓' }
            ]}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card">
          <Empty icon={<IconLeaf width={52} height={52} />} title="没找到相关食物" desc="换个关键词，或切换分类看看" />
        </div>
      ) : (
        <div className="cell-group">
          {list.map((f) => {
            const gi = giLevel(f.gi)
            const kc = kcalLevel(f.kcal)
            const servingKcal = Math.round((f.kcal * f.serving.grams) / 100)
            return (
              <details key={f.name} className="food-item">
                <summary className="cell">
                  <div className="cell-body">
                    <div className="cell-title">
                      {f.name}
                      <span className={`badge badge-${gi.color}`} style={{ marginLeft: 8 }}>GI {f.gi}</span>
                    </div>
                    <div className="cell-desc">
                      {f.serving.label}≈{f.serving.grams}g · {servingKcal} kcal
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <b className="num" style={{ fontSize: 16 }}>{f.kcal}</b>
                    <i style={{ fontStyle: 'normal', fontSize: 10, color: 'var(--c-ink-3)' }}> kcal/100g</i>
                    <div>
                      <span className={`badge badge-${kc.color}`} style={{ marginTop: 3 }}>{kc.label}</span>
                    </div>
                  </div>
                </summary>
                {/* 展开详情 */}
                <div style={{ padding: '12px 16px 14px', background: 'var(--c-paper-2)', fontSize: 13 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, textAlign: 'center', marginBottom: 10 }}>
                    <Nutri label="蛋白质" value={f.protein} />
                    <Nutri label="脂肪" value={f.fat} />
                    <Nutri label="碳水" value={f.carb} />
                    <Nutri label="GI" value={f.gi} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${gi.color}`}>{gi.label}</span>
                    <span style={{ color: 'var(--c-ink-2)', fontSize: 12 }}>
                      {f.gi >= 70 ? '升糖快，减脂期少吃' : f.gi >= 55 ? '升糖中等，注意搭配' : '升糖平缓，放心吃'}
                    </span>
                    <span style={{ marginLeft: 'auto', color: 'var(--c-ink-3)', fontSize: 12 }}>
                      一份 {f.serving.label}（{f.serving.grams}g）≈ {thousand(servingKcal)} kcal
                    </span>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Nutri({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'var(--c-paper)', borderRadius: 10, padding: '7px 4px' }}>
      <div style={{ fontSize: 11, color: 'var(--c-ink-3)' }}>{label}</div>
      <b className="num" style={{ fontSize: 14 }}>{value}</b>
      <i style={{ fontStyle: 'normal', fontSize: 10, color: 'var(--c-ink-3)' }}>{label === 'GI' ? '' : 'g'}</i>
    </div>
  )
}
