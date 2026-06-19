/**
 * Styled QR code generation using `qr-code-styling`.
 *
 * This module wraps the library with a DOM polyfill so it works in
 * Bun / Cloudflare Workers where no browser globals exist.
 */

import QRCodeStyling from 'qr-code-styling'
import { ensureDomPolyfill, serializeSvgElement } from './qr-styling'

// ── Public types ─────────────────────────────────────────────────

export type DotType = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded'
export type CornerSquareType = 'square' | 'dot' | 'extra-rounded'
export type CornerDotType = 'square' | 'dot'
export type GradientType = 'linear' | 'radial'
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export interface StyledQrOptions {
  text: string
  size: number
  margin?: number
  ecLevel?: ErrorCorrectionLevel

  // Dot options
  dotType?: DotType
  dotColor?: string

  // Corner square options
  cornerSquareType?: CornerSquareType
  cornerSquareColor?: string

  // Corner dot options
  cornerDotType?: CornerDotType
  cornerDotColor?: string

  // Background
  bgColor?: string

  // Gradient (applied to dots)
  gradientType?: GradientType
  gradientColor1?: string
  gradientColor2?: string
  gradientRotation?: number

  // Logo / image
  imageUrl?: string
  imageSize?: number
  imageMargin?: number
  imageHideBgDots?: boolean
}

// ── Generator ────────────────────────────────────────────────────

/**
 * Generate a styled QR code as an SVG string using `qr-code-styling`.
 *
 * The library is instantiated with `type: 'svg'` and the internal virtual
 * DOM tree is serialised to a string via `serializeSvgElement`.
 */
export async function generateStyledQrSvg(options: StyledQrOptions): Promise<string> {
  // Ensure DOM globals are available for qr-code-styling
  ensureDomPolyfill()

  const {
    text,
    size,
    margin = 2,
    ecLevel = 'M',
    dotType = 'square',
    dotColor,
    cornerSquareType,
    cornerSquareColor,
    cornerDotType,
    cornerDotColor,
    bgColor,
    gradientType,
    gradientColor1,
    gradientColor2,
    gradientRotation = 0,
    imageUrl,
    imageSize = 0.25,
    imageMargin = 0,
    imageHideBgDots = true,
  } = options

  // Build gradient object if all required fields are present
  const hasGradient = gradientType && gradientColor1 && gradientColor2
  const gradient = hasGradient
    ? {
        type: gradientType as GradientType,
        rotation: gradientRotation * (Math.PI / 180), // convert degrees → radians
        colorStops: [
          { offset: 0, color: gradientColor1! },
          { offset: 1, color: gradientColor2! },
        ],
      }
    : undefined

  // Use high error correction when embedding an image
  const effectiveEcLevel = imageUrl ? 'H' : ecLevel

  const qr = new QRCodeStyling({
    type: 'svg',
    width: size,
    height: size,
    margin,
    data: text,
    qrOptions: {
      errorCorrectionLevel: effectiveEcLevel,
    },
    dotsOptions: {
      type: dotType,
      ...(dotColor && !hasGradient ? { color: dotColor } : { color: '#000000' }),
      ...(gradient ? { gradient } : {}),
    },
    cornersSquareOptions: {
      ...(cornerSquareType ? { type: cornerSquareType } : {}),
      ...(cornerSquareColor ? { color: cornerSquareColor } : {}),
    },
    cornersDotOptions: {
      ...(cornerDotType ? { type: cornerDotType } : {}),
      ...(cornerDotColor ? { color: cornerDotColor } : {}),
    },
    backgroundOptions: {
      color: bgColor || '#ffffff',
    },
    ...(imageUrl
      ? {
          image: imageUrl,
          imageOptions: {
            hideBackgroundDots: imageHideBgDots,
            imageSize,
            margin: imageMargin,
          },
        }
      : {}),
  })

  // Serialise the internal virtual SVG element to a string
  const svgString = serializeSvgElement((qr as any)._svg)

  if (!svgString || svgString.length < 50) {
    throw new Error('Failed to generate styled QR SVG')
  }

  // resvg requires url(#id) without quotes, but the dom polyfill might serialize with quotes
  const finalSvgString = svgString.replace(/url\('?(#[^']+)'?\)/g, 'url($1)')

  return finalSvgString
}
