/** 拍照记录 · 相机/相册 → 时间轴 → 前后对比（全程 3 步） */
import { useRef, useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '@/store/useApp'
import { Sheet, Modal, Empty, Segmented } from '@/components/ui'
import { CompareSlider } from '@/components/CompareSlider'
import { IconCamera, IconPhoto, IconTrash, IconCompare, IconAlert } from '@/components/icons'
import { compressImage } from '@/lib/photo'
import { fmtDateCN, fmtWeekday, todayStr } from '@/lib/format'
import type { PhotoEntry } from '@/lib/types'

export default function Gallery() {
  const { photos, addPhoto, removePhoto, weights } = useApp()
  const me = useApp((s) => s.me())
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [pickFor, setPickFor] = useState<PhotoEntry | null>(null) // 选中的“现在”照片
  const [beforeOf, setBeforeOf] = useState<PhotoEntry | null>(null)
  const [detail, setDetail] = useState<PhotoEntry | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  if (!me) return <Navigate to="/auth" replace />

  const sorted = useMemo(() => [...photos].sort((a, b) => (a.date < b.date ? -1 : 1)), [photos])
  const byId = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos])

  const pick = () => fileRef.current?.click()

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      useApp.getState().toast('请选择图片文件', 'err')
      return
    }
    setUploading(true)
    try {
      const { full, thumb } = await compressImage(file)
      await addPhoto({ date: todayStr(), thumb, full, weight: weights.find((w) => w.date === todayStr())?.weight })
      useApp.getState().toast('已记录到时间轴', 'ok')
    } catch {
      useApp.getState().toast('图片处理失败，换一张试试', 'err')
    } finally {
      setUploading(false)
    }
  }

  /** 对比：自动选该照片之前最近的一张作为“之前” */
  const openCompare = (p: PhotoEntry) => {
    const idx = sorted.findIndex((x) => x.id === p.id)
    if (idx <= 0) {
      useApp.getState().toast('这是最早一张，再拍一张就能对比', 'info')
      return
    }
    setBeforeOf(sorted[idx - 1])
    setPickFor(p)
  }

  return (
    <div className="page">
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />

      {/* 顶部操作（1/3 步：拍一张） */}
      <div className="hero" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 17 }}>体型变化记录</b>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 3 }}>
            已有 {photos.length} 张 · 同角度光线对比更明显
          </div>
        </div>
        <button
          className="btn"
          style={{ background: 'rgba(255,255,255,.22)', color: '#fff', minHeight: 46, padding: '0 18px' }}
          onClick={pick}
          disabled={uploading}
        >
          <IconCamera width={19} height={19} />
          {uploading ? '处理中…' : '拍摄 / 相册'}
        </button>
      </div>

      {photos.length === 0 ? (
        <div className="card" style={{ marginTop: 12 }}>
          <Empty icon={<IconPhoto width={52} height={52} />} title="还没有照片" desc="每周同一姿势拍一张，见证自己的变化">
            <button className="btn btn-primary" onClick={pick} disabled={uploading}>
              <IconCamera width={18} height={18} />
              拍第一张
            </button>
          </Empty>
        </div>
      ) : (
        <>
          {/* 最新对比入口（2/3 步：选照片 → 3/3 步：滑动对比） */}
          {sorted.length >= 2 ? (
            <>
              <div className="section-title">最新对比</div>
              <div className="card card-pad">
                <CompareSlider before={sorted[sorted.length - 2].thumb} after={sorted[sorted.length - 1].thumb} height={300} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-ink-3)', marginTop: 8 }}>
                  <span>{fmtDateCN(sorted[sorted.length - 2].date)}</span>
                  <span>拖动分割线对比</span>
                  <span>{fmtDateCN(sorted[sorted.length - 1].date)}</span>
                </div>
              </div>
            </>
          ) : null}

          {/* 时间轴 */}
          <div className="section-title">时间轴</div>
          <div>
            {sorted
              .slice()
              .reverse()
              .map((p, i, arr) => (
                <div key={p.id} style={{ display: 'flex', gap: 12 }}>
                  {/* 轴线 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <i style={{ width: 10, height: 10, borderRadius: 10, background: 'var(--c-coral)', marginTop: 18, flexShrink: 0 }} />
                    {i < arr.length - 1 ? <i style={{ width: 2, flex: 1, background: 'var(--c-line)', margin: '4px 0' }} /> : <i style={{ width: 2, height: 8 }} />}
                  </div>
                  <div className="card card-pad" style={{ marginBottom: 12, flex: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={p.thumb}
                      alt={`${p.date} 体型照`}
                      style={{ width: 64, height: 80, objectFit: 'cover', borderRadius: 10, cursor: 'pointer' }}
                      onClick={() => setDetail(p)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtDateCN(p.date)}</div>
                      <div style={{ fontSize: 12, color: 'var(--c-ink-3)' }}>
                        {fmtWeekday(p.date)}
                        {p.weight ? ` · ${p.weight} kg` : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openCompare(p)} disabled={i === arr.length - 1 && sorted.length < 2} style={{ minHeight: 30 }}>
                          <IconCompare width={14} height={14} />
                          对比
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setConfirmDel(p.id)} style={{ minHeight: 30, color: 'var(--c-danger)' }}>
                          <IconTrash width={14} height={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* 对比 Sheet */}
      <Sheet open={pickFor != null && beforeOf != null} onClose={() => { setPickFor(null); setBeforeOf(null) }} title="前后对比">
        {pickFor && beforeOf ? (
          <>
            <CompareSlider before={beforeOf.full} after={pickFor.full} beforeLabel={fmtDateCN(beforeOf.date)} afterLabel={fmtDateCN(pickFor.date)} height={420} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13, color: 'var(--c-ink-2)' }}>
              <span>
                {fmtDateCN(beforeOf.date, true)}
                {beforeOf.weight ? ` · ${beforeOf.weight}kg` : ''}
              </span>
              <span>
                {fmtDateCN(pickFor.date, true)}
                {pickFor.weight ? ` · ${pickFor.weight}kg` : ''}
              </span>
            </div>
          </>
        ) : null}
      </Sheet>

      {/* 大图查看 */}
      <Sheet open={detail != null} onClose={() => setDetail(null)}>
        {detail ? (
          <>
            <img src={detail.full} alt={`${detail.date} 体型照大图`} style={{ width: '100%', borderRadius: 14 }} />
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'var(--c-ink-2)' }}>
              {fmtDateCN(detail.date, true)} {fmtWeekday(detail.date)}
              {detail.weight ? ` · ${detail.weight} kg` : ''}
            </div>
          </>
        ) : null}
      </Sheet>

      <Modal
        open={confirmDel != null}
        onClose={() => setConfirmDel(null)}
        title="删除这张照片？"
        message="删除后不可恢复"
        confirmText="删除"
        danger
        onConfirm={() => confirmDel && removePhoto(confirmDel)}
      />
    </div>
  )
}
