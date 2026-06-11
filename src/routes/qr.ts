import { Hono } from 'hono'
import { generateQrSvg } from '../utils/qr'
import { generateStyledQrSvg } from '../utils/qr-styled'
import { buildLabeledSvg, embedIconInSvg, parseHexColor } from '../utils/svg'

export const qrRoutes = new Hono()

// ── Allowed enum values ──────────────────────────────────────────
const DOT_TYPES = new Set(['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'])
const CORNER_SQUARE_TYPES = new Set(['square', 'dot', 'extra-rounded'])
const CORNER_DOT_TYPES = new Set(['square', 'dot'])
const GRADIENT_TYPES = new Set(['linear', 'radial'])
const EC_LEVELS = new Set(['L', 'M', 'Q', 'H'])

qrRoutes.get('/', (c) => {
  return c.text(`Hello You! Fiu is here 🐾

Need to generate a QR code?
Send a request to /qr with the following query parameters:

  ── General ──────────────────────────────────────────────
  • text             (required)  — The value to encode in the QR code
  • style            (optional)  — Engine: basic, styled (default: basic)
  • size             (optional)  — QR code size in pixels (default: 300)
  • margin           (optional)  — Quiet zone margin in modules (default: 2, styled only)
  • ec_level         (optional)  — Error correction: L, M, Q, H (default: M)

  ── Colors (both styles) ────────────────────────────────
  • color            (optional)  — Foreground color as hex, e.g. FF0000 or #FF0000 (default: 000000)
  • color_bg         (optional)  — Background color as hex, e.g. FFFFFF or #FFFFFF (default: FFFFFF)

  ── Label (both styles) ─────────────────────────────────
  • label            (optional)  — A text label to display alongside the QR code (auto-wraps)
  • label_position   (optional)  — Position of the label: top, bottom, left, right (default: bottom)
  • text_size        (optional)  — Label text size: sm, md, lg, xl (default: md, scales with QR size)
  • padding_size     (optional)  — Space between text and QR: sm, md, lg, xl (default: md)

  ── Icon / Logo ─────────────────────────────────────────
  • icon_url         (optional)  — URL of icon/logo to embed (both styles)
  • icon_size        (optional)  — Icon size as fraction: 0.1–0.5 (default: 0.25, styled only)
  • icon_margin      (optional)  — Margin around icon in px (default: 0, styled only)
  • icon_hide_bg_dots (optional) — Hide dots behind icon: true, false (default: true, styled only)

  ── Dot Style (styled only) ─────────────────────────────
  • dot_type         (optional)  — Dot shape: square, dots, rounded, extra-rounded, classy, classy-rounded (default: square)
  • dot_scale        (optional)  — Dot scale 0.1–1.0 (default: 1.0)

  ── Corner Squares (styled only) ────────────────────────
  • corner_square_type  (optional) — Corner square shape: square, dot, extra-rounded (default: square)
  • corner_square_color (optional) — Corner square color as hex (default: same as color)

  ── Corner Dots (styled only) ───────────────────────────
  • corner_dot_type  (optional)  — Corner dot shape: square, dot (default: square)
  • corner_dot_color (optional)  — Corner dot color as hex (default: same as color)

  ── Gradient (styled only) ──────────────────────────────
  • gradient_type    (optional)  — Gradient type: linear, radial
  • gradient_color1  (optional)  — Gradient start color as hex
  • gradient_color2  (optional)  — Gradient end color as hex
  • gradient_rotation (optional) — Gradient rotation in degrees (default: 0)

Examples:
  /qr?text=hello-world
  /qr?text=https://example.com&size=500&label=Visit+Me&label_position=bottom&text_size=lg
  /qr?text=https://example.com&icon_url=https://example.com/logo.png
  /qr?text=https://example.com&color=1a1a2e&color_bg=e0e0ff
  /qr?text=https://example.com&style=styled&dot_type=dots&corner_square_type=extra-rounded
  /qr?text=https://example.com&style=styled&dot_type=rounded&gradient_type=linear&gradient_color1=8b5cf6&gradient_color2=ec4899
  /qr?text=https://example.com&style=styled&dot_type=classy&icon_url=https://example.com/logo.png&ec_level=H
`)
})

qrRoutes.get('/qr', async (c) => {
  const text = c.req.query('text')
  if (!text) {
    return c.json({ error: 'Missing required query parameter: text' }, 400)
  }

  // ── General params ──────────────────────────────────────
  const style = c.req.query('style') || 'basic'
  if (style !== 'basic' && style !== 'styled') {
    return c.json({ error: 'Invalid style. Expected: basic, styled' }, 400)
  }

  const size = Math.max(50, Math.min(2000, parseInt(c.req.query('size') || '300', 10)))
  const ecLevelQuery = c.req.query('ec_level')?.toUpperCase()
  if (ecLevelQuery && !EC_LEVELS.has(ecLevelQuery)) {
    return c.json({ error: 'Invalid ec_level. Expected: L, M, Q, H' }, 400)
  }

  // ── Color params ────────────────────────────────────────
  const color = parseHexColor(c.req.query('color'))
  const colorBg = parseHexColor(c.req.query('color_bg'))

  if (c.req.query('color') && !color) {
    return c.json({ error: 'Invalid color format. Expected hex, e.g. FF0000 or #FF0000' }, 400)
  }
  if (c.req.query('color_bg') && !colorBg) {
    return c.json({ error: 'Invalid color_bg format. Expected hex, e.g. FFFFFF or #FFFFFF' }, 400)
  }

  // ── Label params ────────────────────────────────────────
  const label = c.req.query('label') || ''
  const labelPosition = c.req.query('label_position') || 'bottom'
  const textSizeKey = c.req.query('text_size') || 'md'
  const paddingSizeKey = c.req.query('padding_size') || 'md'

  try {
    let qrSvgString: string

    if (style === 'styled') {
      // ── Styled engine (qr-code-styling) ───────────────
      const dotType = c.req.query('dot_type') || 'square'
      if (!DOT_TYPES.has(dotType)) {
        return c.json({ error: `Invalid dot_type. Expected: ${[...DOT_TYPES].join(', ')}` }, 400)
      }

      const cornerSquareType = c.req.query('corner_square_type')
      if (cornerSquareType && !CORNER_SQUARE_TYPES.has(cornerSquareType)) {
        return c.json({ error: `Invalid corner_square_type. Expected: ${[...CORNER_SQUARE_TYPES].join(', ')}` }, 400)
      }

      const cornerDotType = c.req.query('corner_dot_type')
      if (cornerDotType && !CORNER_DOT_TYPES.has(cornerDotType)) {
        return c.json({ error: `Invalid corner_dot_type. Expected: ${[...CORNER_DOT_TYPES].join(', ')}` }, 400)
      }

      const gradientType = c.req.query('gradient_type')
      if (gradientType && !GRADIENT_TYPES.has(gradientType)) {
        return c.json({ error: `Invalid gradient_type. Expected: ${[...GRADIENT_TYPES].join(', ')}` }, 400)
      }

      const gradientColor1 = parseHexColor(c.req.query('gradient_color1'))
      const gradientColor2 = parseHexColor(c.req.query('gradient_color2'))
      if (c.req.query('gradient_color1') && !gradientColor1) {
        return c.json({ error: 'Invalid gradient_color1 format. Expected hex' }, 400)
      }
      if (c.req.query('gradient_color2') && !gradientColor2) {
        return c.json({ error: 'Invalid gradient_color2 format. Expected hex' }, 400)
      }

      const cornerSquareColor = parseHexColor(c.req.query('corner_square_color'))
      if (c.req.query('corner_square_color') && !cornerSquareColor) {
        return c.json({ error: 'Invalid corner_square_color format. Expected hex' }, 400)
      }

      const cornerDotColor = parseHexColor(c.req.query('corner_dot_color'))
      if (c.req.query('corner_dot_color') && !cornerDotColor) {
        return c.json({ error: 'Invalid corner_dot_color format. Expected hex' }, 400)
      }

      const margin = Math.max(0, Math.min(50, parseInt(c.req.query('margin') || '2', 10)))
      const gradientRotation = parseFloat(c.req.query('gradient_rotation') || '0')
      const iconUrl = c.req.query('icon_url') || ''

      const ecLevel = ecLevelQuery
        ? (iconUrl ? 'H' : ecLevelQuery)
        : (iconUrl ? 'H' : 'M')

      qrSvgString = await generateStyledQrSvg({
        text,
        size,
        margin,
        ecLevel: ecLevel as any,
        dotType: dotType as any,
        dotColor: color || undefined,
        cornerSquareType: cornerSquareType as any || undefined,
        cornerSquareColor: cornerSquareColor || undefined,
        cornerDotType: cornerDotType as any || undefined,
        cornerDotColor: cornerDotColor || undefined,
        bgColor: colorBg || undefined,
        gradientType: gradientType as any || undefined,
        gradientColor1: gradientColor1 || undefined,
        gradientColor2: gradientColor2 || undefined,
        gradientRotation,
      })
    } else {
      // ── Basic engine (qrcode) ─────────────────────────
      const iconUrl = c.req.query('icon_url') || ''
      const ecLevel = ecLevelQuery
        ? (iconUrl ? 'H' : ecLevelQuery)
        : (iconUrl ? 'H' : 'M')

      // Build QR color option — only pass when at least one is specified
      const qrColor = (color || colorBg) ? { dark: color || '#000000', light: colorBg || '#ffffff' } : undefined

      qrSvgString = await generateQrSvg(text, size, ecLevel as 'L' | 'M' | 'Q' | 'H', qrColor)
    }

    // Embed icon at the center of the QR if icon_url is provided
    const iconUrl = c.req.query('icon_url') || ''
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
      const iconSize = Math.max(0.1, Math.min(0.5, parseFloat(c.req.query('icon_size') || '0.25')))

      qrSvgString = embedIconInSvg(qrSvgString, dataUri, iconSize, colorBg || '#FFFFFF')
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
      color: color || '#000000',
      colorBg: colorBg || '#FFFFFF',
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
