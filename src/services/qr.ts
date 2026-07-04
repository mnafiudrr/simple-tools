/**
 * QR business logic — pure-ish, runtime-agnostic.
 *
 * Takes a parsed params object (raw query strings) and returns either an SVG
 * string, PNG bytes, or a structured error. Does NOT import Hono, so it stays
 * testable and reusable across runtimes.
 */

import { generateQrSvg, parseSvgDimensions } from '../utils/qr'
import { generateStyledQrSvg } from '../utils/qr-styled'
import { buildLabeledSvg, embedIconInSvg, parseHexColor } from '../utils/svg'
import { renderPngLocally } from '../utils/resvg'

// ── Allowed enum values ──────────────────────────────────────────
const DOT_TYPES = new Set(['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'])
const CORNER_SQUARE_TYPES = new Set(['square', 'dot', 'extra-rounded'])
const CORNER_DOT_TYPES = new Set(['square', 'dot'])
const GRADIENT_TYPES = new Set(['linear', 'radial'])
const EC_LEVELS = new Set(['L', 'M', 'Q', 'H'])
const RETURN_TYPES = new Set(['svg', 'png'])

// ── Public types ─────────────────────────────────────────────────

export type QrResult =
  | { kind: 'svg'; body: string }
  | { kind: 'png'; body: Uint8Array }
  | { kind: 'error'; status: number; error: string }

export interface QrParams {
  text?: string
  style?: string
  size?: string
  margin?: string
  ec_level?: string
  return_type?: string
  color?: string
  color_bg?: string
  bg_transparent?: string
  icon_bg_transparent?: string
  label?: string
  label_position?: string
  text_size?: string
  padding_size?: string
  icon_url?: string
  icon_size?: string
  icon_margin?: string
  icon_hide_bg_dots?: string
  dot_type?: string
  dot_scale?: string
  corner_square_type?: string
  corner_square_color?: string
  corner_dot_type?: string
  corner_dot_color?: string
  gradient_type?: string
  gradient_color1?: string
  gradient_color2?: string
  gradient_rotation?: string
}

// ── Generator ────────────────────────────────────────────────────

export async function generateQr(params: QrParams): Promise<QrResult> {
  const text = params.text
  if (!text) {
    return { kind: 'error', status: 400, error: 'Missing required query parameter: text' }
  }

  // ── General params ──────────────────────────────────────
  const style = params.style || 'basic'
  if (style !== 'basic' && style !== 'styled') {
    return { kind: 'error', status: 400, error: 'Invalid style. Expected: basic, styled' }
  }

  const size = Math.max(50, Math.min(2000, parseInt(params.size || '300', 10)))
  const ecLevelQuery = params.ec_level?.toUpperCase()
  if (ecLevelQuery && !EC_LEVELS.has(ecLevelQuery)) {
    return { kind: 'error', status: 400, error: 'Invalid ec_level. Expected: L, M, Q, H' }
  }

  // ── Return type (svg | png) ─────────────────────────────
  const returnType = params.return_type || 'svg'
  if (!RETURN_TYPES.has(returnType)) {
    return { kind: 'error', status: 400, error: 'Invalid return_type. Expected: svg, png' }
  }

  // ── Color params ────────────────────────────────────────
  const color = parseHexColor(params.color)
  const colorBg = parseHexColor(params.color_bg)

  // bg_transparent suppresses the WHOLE-FILE background (QR light modules,
  // styled engine bg, label canvas). It does NOT affect the icon backdrop.
  // When truthy it wins over any color_bg value. Default: false.
  const bgTransparent = ['true', '1', 'yes'].includes((params.bg_transparent || '').toLowerCase())

  // icon_bg_transparent suppresses ONLY the icon's backdrop rect, independently
  // of bg_transparent. Default: false (icon keeps its white/color_bg backdrop).
  const iconBgTransparent = ['true', '1', 'yes'].includes((params.icon_bg_transparent || '').toLowerCase())

  if (params.color && !color) {
    return { kind: 'error', status: 400, error: 'Invalid color format. Expected hex, e.g. FF0000 or #FF0000' }
  }
  if (params.color_bg && !colorBg) {
    return { kind: 'error', status: 400, error: 'Invalid color_bg format. Expected hex, e.g. FFFFFF or #FFFFFF' }
  }

  // ── Label params ────────────────────────────────────────
  const label = params.label || ''
  const labelPosition = params.label_position || 'bottom'
  const textSizeKey = params.text_size || 'md'
  const paddingSizeKey = params.padding_size || 'md'

  try {
    let qrSvgString: string

    if (style === 'styled') {
      // ── Styled engine (qr-code-styling) ───────────────
      const dotType = params.dot_type || 'square'
      if (!DOT_TYPES.has(dotType)) {
        return { kind: 'error', status: 400, error: `Invalid dot_type. Expected: ${[...DOT_TYPES].join(', ')}` }
      }

      const cornerSquareType = params.corner_square_type
      if (cornerSquareType && !CORNER_SQUARE_TYPES.has(cornerSquareType)) {
        return { kind: 'error', status: 400, error: `Invalid corner_square_type. Expected: ${[...CORNER_SQUARE_TYPES].join(', ')}` }
      }

      const cornerDotType = params.corner_dot_type
      if (cornerDotType && !CORNER_DOT_TYPES.has(cornerDotType)) {
        return { kind: 'error', status: 400, error: `Invalid corner_dot_type. Expected: ${[...CORNER_DOT_TYPES].join(', ')}` }
      }

      const gradientType = params.gradient_type
      if (gradientType && !GRADIENT_TYPES.has(gradientType)) {
        return { kind: 'error', status: 400, error: `Invalid gradient_type. Expected: ${[...GRADIENT_TYPES].join(', ')}` }
      }

      const gradientColor1 = parseHexColor(params.gradient_color1)
      const gradientColor2 = parseHexColor(params.gradient_color2)
      if (params.gradient_color1 && !gradientColor1) {
        return { kind: 'error', status: 400, error: 'Invalid gradient_color1 format. Expected hex' }
      }
      if (params.gradient_color2 && !gradientColor2) {
        return { kind: 'error', status: 400, error: 'Invalid gradient_color2 format. Expected hex' }
      }

      const cornerSquareColor = parseHexColor(params.corner_square_color)
      if (params.corner_square_color && !cornerSquareColor) {
        return { kind: 'error', status: 400, error: 'Invalid corner_square_color format. Expected hex' }
      }

      const cornerDotColor = parseHexColor(params.corner_dot_color)
      if (params.corner_dot_color && !cornerDotColor) {
        return { kind: 'error', status: 400, error: 'Invalid corner_dot_color format. Expected hex' }
      }

      const margin = Math.max(0, Math.min(50, parseInt(params.margin || '2', 10)))
      const gradientRotation = parseFloat(params.gradient_rotation || '0')
      const iconUrl = params.icon_url || ''

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
        bgColor: bgTransparent ? undefined : (colorBg || undefined),
        gradientType: gradientType as any || undefined,
        gradientColor1: gradientColor1 || undefined,
        gradientColor2: gradientColor2 || undefined,
        gradientRotation,
      })
    } else {
      // ── Basic engine (qrcode) ─────────────────────────
      const iconUrl = params.icon_url || ''
      const ecLevel = ecLevelQuery
        ? (iconUrl ? 'H' : ecLevelQuery)
        : (iconUrl ? 'H' : 'M')

      // Build QR color option.
      // - When bgTransparent, set light modules to fully transparent (#0000 = 8-digit hex alpha).
      // - Otherwise only pass when at least one color is explicitly specified (preserves prior default-white behaviour).
      const qrColor = (color || colorBg || bgTransparent)
        ? { dark: color || '#000000', light: bgTransparent ? '#0000' : (colorBg || '#ffffff') }
        : undefined

      qrSvgString = await generateQrSvg(text, size, ecLevel as 'L' | 'M' | 'Q' | 'H', qrColor)
    }

    // Embed icon at the center of the QR if icon_url is provided
    const iconUrl = params.icon_url || ''
    if (iconUrl) {
      const iconRes = await fetch(iconUrl)
      if (!iconRes.ok) {
        return { kind: 'error', status: 400, error: `Failed to fetch icon from URL: ${iconRes.status}` }
      }

      const contentType = iconRes.headers.get('content-type') || 'image/png'
      const arrayBuffer = await iconRes.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
      )
      const dataUri = `data:${contentType};base64,${base64}`
      const iconSize = Math.max(0.1, Math.min(0.5, parseFloat(params.icon_size || '0.25')))

      // Icon backdrop is controlled independently by icon_bg_transparent.
      // It defaults to the file background color (colorBg or white) and is only
      // suppressed when icon_bg_transparent=true — regardless of bg_transparent.
      qrSvgString = embedIconInSvg(qrSvgString, dataUri, iconSize, iconBgTransparent ? undefined : (colorBg || '#FFFFFF'))
    }

    // Build the final SVG (with optional label)
    const finalSvg = label
      ? buildLabeledSvg(qrSvgString, {
          label,
          labelPosition,
          textSizeKey,
          paddingSizeKey,
          size,
          color: color || '#000000',
          colorBg: bgTransparent ? undefined : (colorBg || '#FFFFFF'),
        })
      : qrSvgString

    // ── PNG output: local conversion via @resvg/resvg-wasm ───────────
    if (returnType === 'png') {
      const { width: pngWidth } = parseSvgDimensions(finalSvg, size)
      const pngBuffer = await renderPngLocally(finalSvg, pngWidth)
      return { kind: 'png', body: pngBuffer }
    }

    // ── SVG output (default) ─────────────────────────────────────────
    return { kind: 'svg', body: finalSvg }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { kind: 'error', status: 500, error: `Failed to generate QR code: ${message}` }
  }
}
