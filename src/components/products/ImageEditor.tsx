'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, RotateCcw, ShoppingBag, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

const MIN_SCALE = 0.3
const MAX_SCALE = 4
const ROTATION_MIN = -45
const ROTATION_MAX = 45
const EDITOR_RATIO = 4 / 5
const OUTPUT_SCALE = 2

const CARD_RATIO = 5 / 4
const GALLERY_RATIO = 1 / 1
const MINI_W = 140

type ImageEditorProps = {
  imageUrl: string
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

function fitScale(imgW: number, imgH: number, frameW: number, frameH: number) {
  const ia = imgW / imgH
  const fa = frameW / frameH
  return ia > fa ? frameH / imgH : frameW / imgW
}

function drawMiniCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  iw: number,
  ih: number,
  scale: number,
  rotation: number,
  tx: number,
  ty: number,
  editorFw: number,
  editorFh: number,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const cw = canvas.width
  const ch = canvas.height

  ctx.clearRect(0, 0, cw, ch)

  const s = scale * (cw / editorFw)
  const rx = tx * (cw / editorFw)
  const ry = ty * (ch / editorFh)

  const cx = cw / 2 + rx
  const cy = ch / 2 + ry

  try {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, cw, ch)
    ctx.clip()

    ctx.translate(cx, cy)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.drawImage(img, (-iw * s) / 2, (-ih * s) / 2, iw * s, ih * s)
    ctx.restore()
  } catch {
    // Canvas tainted — silently skip render
    ctx.clearRect(0, 0, cw, ch)
  }
}

export function ImageEditor({ imageUrl, onConfirm, onCancel }: ImageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cardCanvasRef = useRef<HTMLCanvasElement>(null)
  const galleryCanvasRef = useRef<HTMLCanvasElement>(null)

  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const dragStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const imgNatRef = useRef({ w: 0, h: 0 })
  const frameSizeRef = useRef({ w: 0, h: 0 })
  const defaultsRef = useRef<{ scale: number; rotation: number; tX: number; tY: number } | null>(null)

  const onImageLoad = useCallback(() => {
    const img = imageRef.current
    const ctr = containerRef.current
    if (!img || !ctr) return

    const r = ctr.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return

    imgNatRef.current = { w: img.naturalWidth, h: img.naturalHeight }
    frameSizeRef.current = { w: r.width, h: r.height }

    const fs = fitScale(img.naturalWidth, img.naturalHeight, r.width, r.height)
    defaultsRef.current = { scale: fs, rotation: 0, tX: 0, tY: 0 }

    setScale(fs)
    setRotation(0)
    setTranslateX(0)
    setTranslateY(0)
    setImgLoaded(true)
  }, [])

  useEffect(() => {
    if (imgLoaded) return
    const img = imageRef.current
    if (img && img.complete && img.naturalWidth > 0) onImageLoad()
  }, [imgLoaded, onImageLoad])

  useEffect(() => {
    if (!imgLoaded) return
    const img = imageRef.current
    const { w: fw, h: fh } = frameSizeRef.current
    const { w: iw, h: ih } = imgNatRef.current
    if (!img || fw === 0 || fh === 0 || iw === 0 || ih === 0) return

    const cardCanvas = cardCanvasRef.current
    const galleryCanvas = galleryCanvasRef.current
    if (!cardCanvas || !galleryCanvas) return

    drawMiniCanvas(cardCanvas, img, iw, ih, scale, rotation, translateX, translateY, fw, fh)
    drawMiniCanvas(galleryCanvas, img, iw, ih, scale, rotation, translateX, translateY, fw, fh)
  }, [imgLoaded, scale, rotation, translateX, translateY])

  function resetToDefaults() {
    if (!defaultsRef.current) return
    const d = defaultsRef.current
    setScale(d.scale)
    setRotation(d.rotation)
    setTranslateX(d.tX)
    setTranslateY(d.tY)
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    setScale((p) => clamp(p + (e.deltaY > 0 ? -0.08 : 0.08), MIN_SCALE, MAX_SCALE))
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY, tx: translateX, ty: translateY }
  }

  useEffect(() => {
    if (!isDragging) return
    const mm = (e: MouseEvent) => {
      setTranslateX(dragStartRef.current.tx + e.clientX - dragStartRef.current.x)
      setTranslateY(dragStartRef.current.ty + e.clientY - dragStartRef.current.y)
    }
    const mu = () => setIsDragging(false)
    window.addEventListener('mousemove', mm)
    window.addEventListener('mouseup', mu)
    return () => {
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('mouseup', mu)
    }
  }, [isDragging])

  function handleConfirm() {
    const img = imageRef.current
    const ctr = containerRef.current
    if (!img || !ctr) return

    const r = ctr.getBoundingClientRect()
    const fw = r.width
    const fh = r.height
    const ow = Math.round(fw * OUTPUT_SCALE)
    const oh = Math.round(fh * OUTPUT_SCALE)
    const sr = ow / fw

    const canvas = document.createElement('canvas')
    canvas.width = ow
    canvas.height = oh
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, ow, oh)

    const s = scale * sr
    const cx = ow / 2 + translateX * sr
    const cy = oh / 2 + translateY * sr

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((rotation * Math.PI) / 180)
    try {
      ctx.drawImage(img, (-img.naturalWidth * s) / 2, (-img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s)
    } catch {
      ctx.restore()
      return
    }
    ctx.restore()

    canvas.toBlob((b) => b && onConfirm(b), 'image/jpeg', 0.88)
  }

  const transform = `translate(-50%,-50%) translate(${translateX}px,${translateY}px) rotate(${rotation}deg) scale(${scale})`

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/70 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-white">Ajustar imagem do produto</h2>
          <p className="mt-0.5 text-xs text-white/60">
            Arraste, gire e aplique zoom. Os quadros a direita mostram como aparece no card e na pagina do produto.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center gap-5 px-4 pb-4 sm:gap-8 sm:px-6 sm:pb-6">
        <div
          ref={containerRef}
          className="relative shrink-0 overflow-hidden border-2 border-white/35 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_120px_rgba(0,0,0,0.6)]"
          style={{
            aspectRatio: `${EDITOR_RATIO}`,
            maxHeight: 'calc(100vh - 210px)',
            height: '100%',
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt=""
            crossOrigin="anonymous"
            draggable={false}
            onLoad={onImageLoad}
            onError={() => setImgError(true)}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transformOrigin: 'center center',
              transform,
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              display: imgLoaded ? undefined : 'none',
            }}
          />
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            </div>
          )}
          {imgError && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              <p className="text-xs text-white/50 leading-relaxed">
                Nao foi possivel carregar a imagem.<br />
                O servidor de origem pode nao permitir acesso para edicao.
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 text-white/60" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">Card da loja</p>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/15 bg-white/5" style={{ width: MINI_W, height: MINI_W / CARD_RATIO }}>
              <canvas
                ref={cardCanvasRef}
                width={MINI_W * 2}
                height={(MINI_W / CARD_RATIO) * 2}
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-white/60" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/55">Pagina do produto</p>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/15 bg-white/5" style={{ width: MINI_W, height: MINI_W / GALLERY_RATIO }}>
              <canvas
                ref={galleryCanvasRef}
                width={MINI_W * 2}
                height={(MINI_W / GALLERY_RATIO) * 2}
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-black/50 px-4 pb-6 pt-4 backdrop-blur-md sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="flex flex-1 flex-wrap gap-4 sm:flex-nowrap">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <ZoomOut className="h-3.5 w-3.5 text-white/50" />
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/50">Zoom</p>
              <ZoomIn className="h-3.5 w-3.5 text-white/50" />
            </div>
            <Slider
              min={Math.round(MIN_SCALE * 100)}
              max={Math.round(MAX_SCALE * 100)}
              step={1}
              value={Math.round(scale * 100)}
              onValueChange={(v) => setScale(v / 100)}
              className="max-w-[220px]"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 text-white/50" />
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/50">Rotacao</p>
            </div>
            <Slider
              min={ROTATION_MIN}
              max={ROTATION_MAX}
              step={1}
              value={rotation}
              onValueChange={setRotation}
              className="max-w-[220px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetToDefaults}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-lg shadow-white/15 transition-all hover:bg-white/90 hover:shadow-xl"
          >
            Confirmar corte
          </button>
        </div>
      </div>
    </div>
  )
}
