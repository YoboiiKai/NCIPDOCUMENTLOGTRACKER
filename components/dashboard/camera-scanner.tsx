"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { CameraOff, Loader2, Check, X, RotateCcw, Upload, ScanLine, Sun, Moon, Crop, Maximize2 } from 'lucide-react'

interface CameraScannerProps {
  isOpen: boolean
  fieldLabel: string
  onClose: () => void
  onResult: (text: string) => void
}

type ScanState = 'idle' | 'streaming' | 'cropping' | 'processing' | 'done' | 'error'

// ─── Image pre-processing pipeline ─────────────────────────────────────────
// 1. Greyscale  2. Contrast normalise  3. Sharpen  4. Adaptive threshold  5. Padding

/** Stretch contrast so darkest pixel → 0, brightest → 255 (handles washed-out camera shots) */
function normalizeContrast(data: Uint8ClampedArray) {
  let min = 255, max = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < min) min = data[i]
    if (data[i] > max) max = data[i]
  }
  if (max === min) return
  const range = max - min
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.round(((data[i] - min) / range) * 255)
    data[i] = data[i + 1] = data[i + 2] = v
  }
}

/** Sharpen with a 3×3 Laplacian unsharp-mask kernel in-place */
function sharpen(data: Uint8ClampedArray, w: number, h: number) {
  const copy = new Uint8ClampedArray(data)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      const v = Math.min(255, Math.max(0,
        5  * copy[i]
        -  copy[((y - 1) * w + x    ) * 4]
        -  copy[((y + 1) * w + x    ) * 4]
        -  copy[(y       * w + x - 1) * 4]
        -  copy[(y       * w + x + 1) * 4]
      ))
      data[i] = data[i + 1] = data[i + 2] = v
    }
  }
}

/**
 * Morphological closing (dilate then erode) on a binary image.
 * Reconnects broken strokes in thin characters — critical for single word/line.
 */
function morphClose(data: Uint8ClampedArray, w: number, h: number, r: number = 1) {
  // Dilation pass: a dark pixel spreads to neighbours within radius r
  const dilated = new Uint8ClampedArray(data)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4] === 0) continue // already dark, skip
      // check if any neighbour is dark
      let hasDark = false
      outer: for (let dy = -r; dy <= r && !hasDark; dy++) {
        for (let dx = -r; dx <= r && !hasDark; dx++) {
          const ny = y + dy, nx = x + dx
          if (ny >= 0 && ny < h && nx >= 0 && nx < w && data[(ny * w + nx) * 4] === 0) hasDark = true
        }
      }
      if (hasDark) { dilated[(y * w + x) * 4] = dilated[(y * w + x) * 4 + 1] = dilated[(y * w + x) * 4 + 2] = 0 }
    }
  }
  // Erosion pass: a dark pixel stays dark only if all neighbours within r are dark
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (dilated[(y * w + x) * 4] !== 0) { data[(y * w + x) * 4] = data[(y * w + x) * 4 + 1] = data[(y * w + x) * 4 + 2] = 255; continue }
      let allDark = true
      outer2: for (let dy = -r; dy <= r && allDark; dy++) {
        for (let dx = -r; dx <= r && allDark; dx++) {
          const ny = y + dy, nx = x + dx
          if (ny >= 0 && ny < h && nx >= 0 && nx < w && dilated[(ny * w + nx) * 4] !== 0) allDark = false
        }
      }
      data[(y * w + x) * 4] = data[(y * w + x) * 4 + 1] = data[(y * w + x) * 4 + 2] = allDark ? 0 : 255
    }
  }
}

/** Add a white border so Tesseract sees clean margins */
function addPadding(canvas: HTMLCanvasElement, pad: number): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width  = canvas.width  + pad * 2
  out.height = canvas.height + pad * 2
  const ctx = out.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.drawImage(canvas, pad, pad)
  return out
}

function preprocessRegion(
  sourceCanvas: HTMLCanvasElement,
  cropPx: { x: number; y: number; w: number; h: number } | null,
  invert: boolean,
  psm: '6' | '7' | '8' = '6',
): string {
  const sw = sourceCanvas.width
  const sh = sourceCanvas.height
  if (!sw || !sh) throw new Error('Canvas has no dimensions')

  const cx = cropPx ? cropPx.x : 0
  const cy = cropPx ? cropPx.y : 0
  const cw = cropPx ? cropPx.w : sw
  const ch = cropPx ? cropPx.h : sh
  if (cw < 4 || ch < 4) throw new Error('Selection is too small')

  // Scale targets per PSM:
  //   PSM 6 (paragraph)  : short side ≥ 1200px
  //   PSM 7 (single line): aim for text height ≥ 150px → scale aggressively; short side ≥ 150px but use height
  //   PSM 8 (single word): single word — need large characters, short side ≥ 200px
  const shortSide = Math.min(cw, ch)
  const longSide  = Math.max(cw, ch)
  const minShort = psm === '8' ? 300 : psm === '7' ? 200 : 1200
  const minLong  = psm === '8' ? 600 : psm === '7' ? 1500 : 2000
  const scale = Math.min(6, Math.max(1, Math.ceil(minShort / shortSide), Math.ceil(minLong / longSide)))
  const tw = Math.round(cw * scale)
  const th = Math.round(ch * scale)

  const out = document.createElement('canvas')
  out.width  = tw
  out.height = th
  const ctx  = out.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(sourceCanvas, cx, cy, cw, ch, 0, 0, tw, th)

  const imgData = ctx.getImageData(0, 0, tw, th)
  const d = imgData.data

  // 1. Greyscale
  for (let i = 0; i < d.length; i += 4) {
    const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
    d[i] = d[i + 1] = d[i + 2] = lum
  }

  // 2. Contrast normalisation
  normalizeContrast(d)

  // 3. Sharpen (double-pass for single line/word — crisper edges on individual chars)
  sharpen(d, tw, th)
  if (psm === '7' || psm === '8') sharpen(d, tw, th)

  // 4. Adaptive threshold
  //    Tighter sensitivity (t=0.15) for line/word: less noise tolerance
  //    Smaller neighbourhood ratio for word mode to isolate individual characters
  const threshT   = psm === '6' ? 0.12 : 0.15
  const threshDiv = psm === '8' ? 16   : 12
  const s2 = Math.max(10, Math.round(Math.min(tw, th) / threshDiv))
  const iw2 = tw + 1
  const integral2 = new Int32Array(iw2 * (th + 1))
  for (let y = 0; y < th; y++)
    for (let x = 0; x < tw; x++) {
      const idx = (y + 1) * iw2 + (x + 1)
      integral2[idx] = d[(y * tw + x) * 4] + integral2[y * iw2 + (x + 1)] + integral2[(y + 1) * iw2 + x] - integral2[y * iw2 + x]
    }
  for (let y = 0; y < th; y++)
    for (let x = 0; x < tw; x++) {
      const x1 = Math.max(0, x - s2), y1 = Math.max(0, y - s2)
      const x2 = Math.min(tw - 1, x + s2), y2 = Math.min(th - 1, y + s2)
      const cnt = (x2 - x1 + 1) * (y2 - y1 + 1)
      const sm  = integral2[(y2 + 1) * iw2 + (x2 + 1)] - integral2[y1 * iw2 + (x2 + 1)] - integral2[(y2 + 1) * iw2 + x1] + integral2[y1 * iw2 + x1]
      let v = d[(y * tw + x) * 4] * cnt < sm * (1 - threshT) ? 0 : 255
      if (invert) v = 255 - v
      d[(y * tw + x) * 4] = d[(y * tw + x) * 4 + 1] = d[(y * tw + x) * 4 + 2] = v
    }

  // 5. Morphological closing for single line/word (reconnect broken strokes)
  if (psm === '7' || psm === '8') morphClose(d, tw, th, 1)

  ctx.putImageData(imgData, 0, 0)

  // 6. White padding: more breathing room for line/word modes
  const pad = psm === '8' ? 60 : psm === '7' ? 50 : 30
  const padded = addPadding(out, pad)
  return padded.toDataURL('image/png')
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CameraScanner({ isOpen, fieldLabel, onClose, onResult }: CameraScannerProps) {
  const videoRef       = useRef<HTMLVideoElement>(null)
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const cropOverlayRef = useRef<HTMLDivElement>(null)
  const isDragging     = useRef(false)
  const dragStart      = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const [scanState,    setScanState]    = useState<ScanState>('idle')
  const [editableText, setEditableText] = useState('')
  const [errorMsg,     setErrorMsg]     = useState('')
  const [progress,     setProgress]     = useState(0)
  const [invert,       setInvert]       = useState(false)
  const [cropSel,      setCropSel]      = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  // PSM = Tesseract Page Segmentation Mode
  // 6 = single uniform block (default)  7 = single text line  8 = single word
  const [psm,          setPsm]          = useState<'6' | '7' | '8'>('6')

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setScanState('idle')
    setEditableText('')
    setErrorMsg('')
    setProgress(0)
    setCropSel(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanState('streaming')
    } catch {
      setErrorMsg('Camera access denied or unavailable. Use "Upload Image" instead.')
      setScanState('error')
    }
  }, [])

  useEffect(() => {
    if (isOpen) startCamera()
    return () => stopCamera()
  }, [isOpen, startCamera, stopCamera])

  // ── OCR ────────────────────────────────────────────────────────────────────
  const runOCR = useCallback(async (dataUrl: string) => {
    setScanState('processing')
    setProgress(10)
    try {
      const { createWorker } = await import('tesseract.js')
      setProgress(20)
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (typeof m?.progress === 'number') setProgress(Math.round(20 + m.progress * 75))
        },
      })
      // Apply PSM and additional Tesseract parameters for accuracy
      const tParams: Record<string, string> = {
        tessedit_pageseg_mode:     psm,
        preserve_interword_spaces: '1',
        tessedit_do_invert:        '0',
        user_defined_dpi:          '300',
        tessedit_unrej_any_wd:     '1',   // accept any word even at low confidence
      }
      if (psm === '7') {
        tParams.textord_min_linesize = '2.5'  // helps with thin single-line text
      }
      if (psm === '8') {
        tParams.textord_min_linesize  = '2'
        tParams.classify_min_slope    = '0'   // ignore character slant variation
      }
      await (worker as any).setParameters(tParams)
      setProgress(25)
      const { data } = await worker.recognize(dataUrl)
      await worker.terminate()
      setProgress(100)
      const lines = data.text
        .replace(/\r\n|\r/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0)
      const cleaned = psm === '6'
        ? lines.join('\n').trim()          // paragraph: preserve line breaks
        : lines.join(' ').trim()           // single line / word: flatten
      setEditableText(cleaned || '(No text detected — try a different text mode or better lighting)')
      setScanState('done')
    } catch (err: any) {
      setErrorMsg(`Recognition failed: ${err?.message ?? String(err)}`)
      setScanState('error')
    }
  }, [psm])

  // ── Capture: freeze frame → go to cropping ─────────────────────────────────
  const handleCapture = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (!video.videoWidth || !video.videoHeight) {
      setErrorMsg('Video not ready yet — please wait a moment.')
      setScanState('error')
      return
    }
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    stopCamera()
    setCropSel(null)
    setScanState('cropping')
  }, [stopCamera])

  // ── Crop pointer events ────────────────────────────────────────────────────
  const getRelPos = (e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => {
    const rect    = el.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return {
      x: Math.max(0, Math.min(clientX - rect.left,  rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top,   rect.height)),
    }
  }

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const overlay = cropOverlayRef.current
    if (!overlay) return
    isDragging.current = true
    const pos = getRelPos(e, overlay)
    dragStart.current = pos
    setCropSel({ x: pos.x, y: pos.y, w: 0, h: 0 })
    e.preventDefault()
  }, [])

  const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return
    const overlay = cropOverlayRef.current
    if (!overlay) return
    const pos = getRelPos(e, overlay)
    setCropSel({
      x: Math.min(pos.x, dragStart.current.x),
      y: Math.min(pos.y, dragStart.current.y),
      w: Math.abs(pos.x - dragStart.current.x),
      h: Math.abs(pos.y - dragStart.current.y),
    })
    e.preventDefault()
  }, [])

  const onPointerUp = useCallback(() => { isDragging.current = false }, [])

  // ── Extract crop selection ─────────────────────────────────────────────────
  const handleExtractCrop = useCallback(() => {
    const canvas  = canvasRef.current
    const overlay = cropOverlayRef.current
    if (!canvas || !overlay || !cropSel || cropSel.w < 10 || cropSel.h < 10) return
    const dW = overlay.offsetWidth
    const dH = overlay.offsetHeight
    const cropPx = {
      x: Math.round((cropSel.x / dW) * canvas.width),
      y: Math.round((cropSel.y / dH) * canvas.height),
      w: Math.round((cropSel.w / dW) * canvas.width),
      h: Math.round((cropSel.h / dH) * canvas.height),
    }
    try { runOCR(preprocessRegion(canvas, cropPx, invert, psm)) }
    catch (err: any) { setErrorMsg(`Preprocessing failed: ${err?.message}`); setScanState('error') }
  }, [cropSel, invert, psm, runOCR])

  // ── Extract full image ─────────────────────────────────────────────────────
  const handleExtractFull = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    try { runOCR(preprocessRegion(canvas, null, invert, psm)) }
    catch (err: any) { setErrorMsg(`Preprocessing failed: ${err?.message}`); setScanState('error') }
  }, [invert, psm, runOCR])

  // ── Upload fallback ────────────────────────────────────────────────────────
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    stopCamera()
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      setCropSel(null)
      setScanState('cropping')
    }
    img.onerror = () => { setErrorMsg('Could not load the selected image.'); setScanState('error') }
    img.src = url
  }, [stopCamera])

  const handleConfirm = () => { onResult(editableText); onClose() }
  const handleRetry   = () => startCamera()
  const hasValidCrop  = cropSel != null && cropSel.w > 10 && cropSel.h > 10

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#0A2D55] via-[#0C3B6E] to-[#0A2D55] text-white px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-md">
              {scanState === 'cropping' ? <Crop className="w-4 h-4" /> : <ScanLine className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">
                {scanState === 'cropping' ? 'Select Area to Scan' : 'Scan Text'}
              </p>
              <p className="text-xs opacity-75 mt-0.5">Field: {fieldLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {scanState === 'streaming' && (
              <button
                type="button"
                title={invert ? 'Light document mode' : 'Dark document mode'}
                onClick={() => setInvert((v) => !v)}
                className={`rounded-md p-1.5 transition-colors ${invert ? 'bg-yellow-400/30' : 'hover:bg-white/10'}`}
              >
                {invert ? <Sun className="w-4 h-4 text-yellow-300" /> : <Moon className="w-4 h-4 text-white/80" />}
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-white/10" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Image area ── */}
        <div className="relative bg-black w-full overflow-hidden" style={{ aspectRatio: '4/3' }}>

          {/* Live video */}
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

          {/* Captured canvas */}
          <canvas
            ref={canvasRef}
            className={`w-full h-full object-contain absolute inset-0 transition-opacity ${
              scanState === 'cropping' || scanState === 'processing' || scanState === 'done'
                ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* ── Crop overlay ── */}
          {scanState === 'cropping' && (
            <div
              ref={cropOverlayRef}
              className="absolute inset-0 cursor-crosshair select-none touch-none"
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
            >
              {/* Selection rectangle + outside mask */}
              {hasValidCrop && (
                <div
                  className="absolute pointer-events-none border-2 border-blue-400"
                  style={{
                    left:      cropSel!.x,
                    top:       cropSel!.y,
                    width:     cropSel!.w,
                    height:    cropSel!.h,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                  }}
                >
                  {/* Corner handles */}
                  <div className="absolute -top-1 -left-1  w-3 h-3 bg-blue-400 rounded-sm" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-sm" />
                  <div className="absolute -bottom-1 -left-1  w-3 h-3 bg-blue-400 rounded-sm" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-400 rounded-sm" />
                  {/* Centre crosshair */}
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <div className="w-full h-px border-t border-dashed border-blue-300/50" />
                  </div>
                  <div className="absolute inset-0 flex justify-center pointer-events-none">
                    <div className="h-full w-px border-l border-dashed border-blue-300/50" />
                  </div>
                  {/* Size badge */}
                  {cropSel!.w > 40 && cropSel!.h > 20 && (
                    <div className="absolute -bottom-6 left-0 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                      {Math.round(cropSel!.w)} × {Math.round(cropSel!.h)} px
                    </div>
                  )}
                </div>
              )}

              {/* Empty-state hint */}
              {!hasValidCrop && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/60 rounded-xl px-5 py-3 text-center">
                    <Crop className="w-6 h-6 text-blue-300 mx-auto mb-1.5" />
                    <p className="text-white text-xs font-semibold">Drag to select text area</p>
                    <p className="text-white/55 text-[10px] mt-0.5">or tap "Scan Full Image" below</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Streaming guide box */}
          {scanState === 'streaming' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[78%] h-[55%] relative">
                <span className="absolute -top-7 left-0 right-0 text-center text-white text-xs drop-shadow font-medium">
                  Align document, then tap Capture
                </span>
                <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-blue-400" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-blue-400" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-blue-400" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-blue-400" />
                <div className="absolute left-0 right-0 h-px bg-blue-400/70 animate-[scanline_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* Processing overlay */}
          {scanState === 'processing' && (
            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-4 px-8">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <div className="w-full">
                <div className="flex justify-between text-white text-xs mb-1.5">
                  <span>{progress < 25 ? 'Preprocessing…' : 'Recognizing text…'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {scanState === 'error' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 p-6">
              <CameraOff className="w-9 h-9 text-red-400" />
              <p className="text-white/80 text-xs text-center leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Done badge */}
          {scanState === 'done' && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-green-500/90 rounded-full px-2 py-1">
              <Check className="w-3 h-3 text-white" />
              <span className="text-white text-[10px] font-semibold">Text recognized</span>
            </div>
          )}
        </div>

        {/* Crop hint strip */}
        {scanState === 'cropping' && (
          <div className="bg-amber-50 border-t border-amber-200 px-3 py-2 flex items-start gap-2">
            <Crop className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 leading-snug">
              {hasValidCrop
                ? 'Selection ready — tap Extract Selection, or redraw to adjust.'
                : 'Drag on the image to outline the text you want to extract.'}
            </p>
          </div>
        )}

        {/* PSM mode strip — shown during cropping */}
        {scanState === 'cropping' && (
          <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide shrink-0">Text mode:</span>
            {([
              { value: '6', label: 'Paragraph',   desc: 'Multiple lines / full block' },
              { value: '7', label: 'Single Line',  desc: 'One line (dates, names, ref #)' },
              { value: '8', label: 'Single Word',  desc: 'One short word or number' },
            ] as { value: '6'|'7'|'8'; label: string; desc: string }[]).map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                title={desc}
                onClick={() => setPsm(value)}
                className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  psm === value
                    ? 'bg-[#0C3B6E] text-white border-[#0C3B6E]'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-[#0C3B6E] hover:text-[#0C3B6E]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Streaming tips strip */}
        {scanState === 'streaming' && (
          <div className="bg-blue-50 border-t border-blue-100 px-3 py-2">
            <p className="text-[11px] text-blue-700 leading-snug">
              💡 Good light · Hold steady · Keep text flat · Avoid shadows
              {invert ? ' · Dark mode ON' : ''}
            </p>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="p-4 space-y-3 overflow-auto">

          {/* OCR result textarea */}
          {scanState === 'done' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recognized Text</label>
                <span className="text-[10px] text-muted-foreground">Edit before confirming</span>
              </div>
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                rows={3}
                autoFocus
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Edit the scanned text here…"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">

            {/* Streaming */}
            {scanState === 'streaming' && (
              <Button type="button" onClick={handleCapture} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                <ScanLine className="w-4 h-4 mr-1" /> Capture
              </Button>
            )}

            {/* Cropping */}
            {scanState === 'cropping' && (
              <>
                <Button
                  type="button"
                  onClick={handleExtractCrop}
                  disabled={!hasValidCrop}
                  title="Extract Selection"
                  className="w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40"
                >
                  <Crop className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExtractFull}
                  title="Scan Full Image"
                  className="w-10 h-10 p-0"
                >
                  <Maximize2 className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRetry}
                  title="Retake Photo"
                  className="w-10 h-10 p-0 text-muted-foreground"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </>
            )}

            {/* Done / error */}
            {(scanState === 'done' || scanState === 'error') && (
              <Button type="button" variant="outline" onClick={handleRetry} title="Retry" className="w-10 h-10 p-0">
                <RotateCcw className="w-5 h-5" />
              </Button>
            )}
            {scanState === 'done' && (
              <Button type="button" onClick={handleConfirm} title="Use This Text" className="w-10 h-10 p-0 bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-5 h-5" />
              </Button>
            )}

            {/* Upload always available except while processing */}
            {scanState !== 'processing' && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Image"
                className="inline-flex items-center justify-center w-10 h-10 rounded-md border hover:bg-accent/10 transition-colors"
              >
                <Upload className="w-5 h-5" />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── end of file ─────────────────────────────────────────────────────────────
