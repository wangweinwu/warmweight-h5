/**
 * 图片压缩：拍照/相册图片 → 限制最大边长 + JPEG 压缩
 * full（≤1280px, q0.82）用于详情；thumb（≤320px, q0.7）用于时间轴与对比
 */
export interface CompressedImage {
  full: string
  thumb: string
  w: number
  h: number
}

export async function compressImage(file: File, maxFull = 1280, maxThumb = 320): Promise<CompressedImage> {
  const bitmapUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(bitmapUrl)
    const full = drawScaled(img, maxFull, 0.82)
    const thumb = drawScaled(img, maxThumb, 0.7)
    return { full: full.dataUrl, thumb: thumb.dataUrl, w: full.w, h: full.h }
  } finally {
    URL.revokeObjectURL(bitmapUrl)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片读取失败'))
    img.src = src
  })
}

function drawScaled(img: HTMLImageElement, maxEdge: number, quality: number): { dataUrl: string; w: number; h: number } {
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  // iOS Safari 不支持 image/webp 导出，统一 JPEG
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  return { dataUrl, w, h }
}

/** dataURL 体积（字节） */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.round((base64.length * 3) / 4)
}
