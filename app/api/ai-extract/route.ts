import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Use OCRSPACE_API_KEY if set; fall back to the free demo key.
  const apiKey = process.env.OCRSPACE_API_KEY ?? 'helloworld'

  const formData = await req.formData()
  const imageFile = formData.get('image') as File | null

  if (!imageFile) {
    return NextResponse.json({ error: 'No image file provided.' }, { status: 400 })
  }

  // Convert the uploaded file to a base64 data-URI for OCR.space
  const arrayBuffer = await imageFile.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const mimeType = imageFile.type || 'image/jpeg'
  const base64Image = `data:${mimeType};base64,${base64}`

  // Build the OCR.space request body
  const ocrForm = new URLSearchParams()
  ocrForm.set('apikey', apiKey)
  ocrForm.set('base64Image', base64Image)
  ocrForm.set('language', 'eng')
  ocrForm.set('isOverlayRequired', 'false')
  ocrForm.set('detectOrientation', 'true')
  ocrForm.set('scale', 'true')
  ocrForm.set('OCREngine', '2') // Engine 2 is more accurate for printed text

  const upstream = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: ocrForm.toString(),
  })

  if (!upstream.ok) {
    const msg = await upstream.text().catch(() => upstream.statusText)
    return NextResponse.json(
      { error: `OCR.space error ${upstream.status}: ${msg}` },
      { status: upstream.status },
    )
  }

  const data = await upstream.json()

  // OCR.space returns { ParsedResults: [{ ParsedText: "..." }], IsErroredOnProcessing: bool }
  if (data?.IsErroredOnProcessing) {
    const errMsg = data?.ErrorMessage?.[0] ?? data?.ErrorDetails ?? 'OCR processing failed'
    return NextResponse.json({ error: errMsg }, { status: 422 })
  }

  const text: string = data?.ParsedResults?.[0]?.ParsedText ?? ''
  return NextResponse.json({ text })
}
