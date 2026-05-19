import { Hono } from 'hono'
import { generateQrSvg } from '../utils/qr'
import { buildLabeledSvg, embedIconInSvg } from '../utils/svg'

export const qrRoutes = new Hono()

qrRoutes.get('/', (c) => {
  return c.text(`Hello You! Fiu is here 🐾

Need to generate a QR code?
Send a request to /qr with the following query parameters:

  • text           (required)  — The value to encode in the QR code
  • size           (optional)  — QR code size in pixels (default: 300)
  • label          (optional)  — A text label to display alongside the QR code (auto-wraps)
  • label_position (optional)  — Position of the label: top, bottom, left, right (default: bottom)
  • text_size      (optional)  — Label text size: sm, md, lg, xl (default: md, scales with QR size)
  • padding_size   (optional)  — Space between text and QR: sm, md, lg, xl (default: md)
  • icon_url       (optional)  — URL of an icon image to embed at the center of the QR code

Examples:
  /qr?text=hello-world
  /qr?text=https://example.com&size=500&label=Visit+Me&label_position=bottom&text_size=lg
  /qr?text=https://example.com&label=Scan+Me&padding_size=lg
  /qr?text=https://example.com&icon_url=https://example.com/logo.png
`)
})

qrRoutes.get('/qr', async (c) => {
  const text = c.req.query('text')
  if (!text) {
    return c.json({ error: 'Missing required query parameter: text' }, 400)
  }

  const size = Math.max(50, Math.min(2000, parseInt(c.req.query('size') || '300', 10)))
  const label = c.req.query('label') || ''
  const labelPosition = c.req.query('label_position') || 'bottom'
  const textSizeKey = c.req.query('text_size') || 'md'
  const paddingSizeKey = c.req.query('padding_size') || 'md'
  const iconUrl = c.req.query('icon_url') || ''
  console.log(iconUrl);
  

  // Use high error correction when embedding an icon so the QR remains readable
  const ecLevel = iconUrl ? 'H' : 'M'

  try {
    let qrSvgString = await generateQrSvg(text, size, ecLevel)

    // Embed icon at the center of the QR if icon_url is provided
    if (iconUrl) {
      const iconRes = await fetch(iconUrl)
      if (!iconRes.ok) {
        return c.json({ error: `Failed to fetch icon from URL: ${iconRes.status}` }, 400)
      }

      const contentType = iconRes.headers.get('content-type') || 'image/png'
      const arrayBuffer = await iconRes.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
      )
      const dataUri = `data:${contentType};base64,${base64}`

      qrSvgString = embedIconInSvg(qrSvgString, dataUri)
    }

    // If no label, return the QR SVG image directly
    if (!label) {
      return new Response(qrSvgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    const finalSvg = buildLabeledSvg(qrSvgString, {
      label,
      labelPosition,
      textSizeKey,
      paddingSizeKey,
      size,
    })

    return new Response(finalSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    return c.json({ error: 'Failed to generate QR code' }, 500)
  }
})
