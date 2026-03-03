"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  CameraOff,
  Loader2,
  Check,
  X,
  RotateCcw,
  Upload,
  ScanLine,
  Sun,
  Moon,
  Crop,
  Maximize2,
  Sparkles,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface AiCameraScannerProps {
  isOpen: boolean
  fieldLabel: string
  onClose: () => void
  onResult: (text: string) => void
}

type ScanState = 'idle' | 'streaming' | 'cropping' | 'processing' | 'done' | 'error'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — canvas → Blob
// ─────────────────────────────────────────────────────────────────────────────

function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((res, rej) => {
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error('Canvas toBlob returned null'))),
      'image/jpeg',
      quality,
    )
  })
}

/** Crop a region from the source canvas, upscale to a minimum resolution,
 *  and return a new canvas ready for OCR. */
function cropCanvas(
  src: HTMLCanvasElement,
  cropPx: { x: number; y: number; w: number; h: number } | null,
): HTMLCanvasElement {
  const cx = cropPx?.x ?? 0
  const cy = cropPx?.y ?? 0
  const cw = cropPx?.w ?? src.width
  const ch = cropPx?.h ?? src.height

  // Ensure the image is large enough — AI OCR handles its own enhancement
  const scale  = Math.min(4, Math.max(1, Math.ceil(1200 / Math.min(cw, ch))))
  const tw     = Math.round(cw * scale)
  const th     = Math.round(ch * scale)

  const out    = document.createElement('canvas')
  out.width    = tw
  out.height   = th
  const ctx    = out.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, cx, cy, cw, ch, 0, 0, tw, th)
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AiCameraScanner({
  isOpen,
  fieldLabel,
  onClose,
  onResult,
}: AiCameraScannerProps) {
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
  const [invert,       setInvert]       = useState(false)
  const [cropSel,      setCropSel]      = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [statusMsg,    setStatusMsg]    = useState('Uploading image…')

  // ── Camera controls ────────────────────────────────────────────────────────

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
    setCropSel(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width:      { ideal: 1280 },
          height:     { ideal: 720 },
        },
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

  // ── AI OCR via /api/ai-extract ─────────────────────────────────────────────

  const runAiOCR = useCallback(async (srcCanvas: HTMLCanvasElement, cropPx: { x: number; y: number; w: number; h: number } | null) => {
    setScanState('processing')
    setStatusMsg('Preparing image…')
    try {
      const cropped = cropCanvas(srcCanvas, cropPx)

      setStatusMsg('Uploading to AI OCR…')
      const blob = await canvasToBlob(cropped)

      const form = new FormData()
      form.append('image', blob, 'scan.jpg')

      const res = await fetch('/api/ai-extract', {
        method: 'POST',
        body:   form,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err?.error ?? `Server returned ${res.status}`)
      }

      const data = await res.json()

      // freeocr.ai returns { text: "..." } — handle various shapes gracefully
      const extracted: string =
        typeof data?.text === 'string'
          ? data.text
          : typeof data?.result === 'string'
          ? data.result
          : typeof data?.data === 'string'
          ? data.data
          : JSON.stringify(data, null, 2)

      const cleaned = extracted
        .replace(/\r\n|\r/g, '\n')
        .split('\n')
        .map((l: string) => l.trimEnd())
        .join('\n')
        .trim()

      setEditableText(cleaned || '(No text detected — try better lighting or a different area)')
      setScanState('done')
    } catch (err: any) {
      setErrorMsg(`AI OCR failed: ${err?.message ?? String(err)}`)
      setScanState('error')
    }
  }, [])

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
      x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(clientY - rect.top,  rect.height)),
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

  // ── Extract helpers ────────────────────────────────────────────────────────

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
    runAiOCR(canvas, cropPx)
  }, [cropSel, runAiOCR])

  const handleExtractFull = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    runAiOCR(canvas, null)
  }, [runAiOCR])

  // ── Upload fallback ────────────────────────────────────────────────────────

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    stopCamera()
    const url = URL.createObjectURL(file)
    const img  = new Image()
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
        <div className="flex items-center justify-between bg-gradient-to-r from-[#3b0764] via-[#581c87] to-[#3b0764] text-white px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-md">
              {scanState === 'cropping' ? <Crop className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-sm font-semibold leading-none flex items-center gap-1.5">
                {scanState === 'cropping' ? 'Select Area to Scan' : 'AI Scan'}
                <span className="bg-purple-300/30 text-purple-100 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI
                </span>
              </p>
              <p className="text-xs opacity-75 mt-0.5">Field: {fieldLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {scanState === 'streaming' && (
              <button
                type="button"
                title={invert ? 'Normal mode' : 'Dark document mode'}
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
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
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
              {hasValidCrop && (
                <div
                  className="absolute pointer-events-none border-2 border-purple-400"
                  style={{
                    left:      cropSel!.x,
                    top:       cropSel!.y,
                    width:     cropSel!.w,
                    height:    cropSel!.h,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                  }}
                >
                  <div className="absolute -top-1 -left-1   w-3 h-3 bg-purple-400 rounded-sm" />
                  <div className="absolute -top-1 -right-1  w-3 h-3 bg-purple-400 rounded-sm" />
                  <div className="absolute -bottom-1 -left-1  w-3 h-3 bg-purple-400 rounded-sm" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-400 rounded-sm" />
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <div className="w-full h-px border-t border-dashed border-purple-300/50" />
                  </div>
                  <div className="absolute inset-0 flex justify-center pointer-events-none">
                    <div className="h-full w-px border-l border-dashed border-purple-300/50" />
                  </div>
                  {cropSel!.w > 40 && cropSel!.h > 20 && (
                    <div className="absolute -bottom-6 left-0 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                      {Math.round(cropSel!.w)} × {Math.round(cropSel!.h)} px
                    </div>
                  )}
                </div>
              )}

              {!hasValidCrop && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/60 rounded-xl px-5 py-3 text-center">
                    <Crop className="w-6 h-6 text-purple-300 mx-auto mb-1.5" />
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
                <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-purple-400" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-purple-400" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-purple-400" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-purple-400" />
                <div className="absolute left-0 right-0 h-px bg-purple-400/70 animate-[scanline_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* Processing overlay */}
          {scanState === 'processing' && (
            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-4 px-8">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-purple-300 animate-spin" />
                <Sparkles className="w-4 h-4 text-purple-200 absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-semibold">{statusMsg}</p>
                <p className="text-white/55 text-xs mt-1">Powered by FreeOCR.AI</p>
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
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-purple-600/90 rounded-full px-2 py-1">
              <Check className="w-3 h-3 text-white" />
              <span className="text-white text-[10px] font-semibold">AI text extracted</span>
            </div>
          )}
        </div>

        {/* Crop hint strip */}
        {scanState === 'cropping' && (
          <div className="bg-purple-50 border-t border-purple-200 px-3 py-2 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-purple-700 leading-snug">
              {hasValidCrop
                ? 'Selection ready — tap Extract Selection, or redraw to adjust.'
                : 'Drag on the image to outline the text you want to extract.'}
            </p>
          </div>
        )}

        {/* Streaming tips strip */}
        {scanState === 'streaming' && (
          <div className="bg-purple-50 border-t border-purple-100 px-3 py-2">
            <p className="text-[11px] text-purple-700 leading-snug">
              ✨ AI-powered OCR · Works on complex layouts, handwriting &amp; tables
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  AI Extracted Text
                </label>
                <span className="text-[10px] text-muted-foreground">Edit before confirming</span>
              </div>
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                rows={3}
                autoFocus
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Edit the AI-extracted text here…"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">

            {/* Streaming */}
            {scanState === 'streaming' && (
              <Button type="button" onClick={handleCapture} className="flex-1 bg-purple-700 hover:bg-purple-800 text-white">
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
                  className="w-10 h-10 p-0 bg-purple-700 hover:bg-purple-800 text-white disabled:opacity-40"
                >
                  <Crop className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExtractFull}
                  title="Scan Full Image"
                  className="w-10 h-10 p-0 border-purple-300 hover:border-purple-600 hover:text-purple-700"
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
              <Button
                type="button"
                onClick={handleConfirm}
                title="Use This Text"
                className="w-10 h-10 p-0 bg-purple-700 hover:bg-purple-800 text-white"
              >
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
