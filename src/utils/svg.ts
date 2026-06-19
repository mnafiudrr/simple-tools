import { parseSvgDimensions } from './qr'

/**
 * Validate and normalise a hex colour string.
 * Accepts `#RRGGBB`, `RRGGBB`, `#RGB`, or `RGB`.
 * Returns the normalised `#RRGGBB` form, or `null` if invalid.
 */
export function parseHexColor(raw: string | undefined | null): string | null {
  if (!raw) return null
  const hex = raw.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    // Expand shorthand #RGB → #RRGGBB
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`
  }
  return null
}

// Text size presets as ratio of QR size
export const TEXT_SIZE_RATIOS: Record<string, number> = {
  sm: 0.04,
  md: 0.06,
  lg: 0.08,
  xl: 0.10,
}

// Padding size presets as ratio of fontSize (negative values overlap label with QR)
export const PADDING_SIZE_RATIOS: Record<string, number> = {
  sm: -1,
  md: -0.4,
  lg: 0.2,
  xl: 0.6,
}

/**
 * Wrap text into lines that fit within maxWidth (approximate character-based).
 * Each character is estimated as ~0.55 * fontSize wide for sans-serif.
 */
export function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const charWidth = fontSize * 0.55
  const maxCharsPerLine = Math.max(1, Math.floor(maxWidth / charWidth))

  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word
    } else if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
      currentLine += ' ' + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface LabelOptions {
  label: string
  labelPosition: string
  textSizeKey: string
  paddingSizeKey: string
  size: number
  color?: string
  colorBg?: string
}

/**
 * Build a composite SVG with the QR code and a text label positioned around it.
 */
export function buildLabeledSvg(qrSvgString: string, options: LabelOptions): string {
  const { label, labelPosition, textSizeKey, paddingSizeKey, size, color, colorBg } = options

  const { width: qrWidth, height: qrHeight, viewBox } = parseSvgDimensions(qrSvgString, size)

  // Calculate font size based on text_size preset and QR size
  const sizeRatio = TEXT_SIZE_RATIOS[textSizeKey] || TEXT_SIZE_RATIOS.md
  const fontSize = Math.round(qrWidth * sizeRatio)
  const lineHeight = Math.round(fontSize * 1.3)
  const paddingRatio = PADDING_SIZE_RATIOS[paddingSizeKey] || PADDING_SIZE_RATIOS.md
  const labelPadding = Math.round(fontSize * paddingRatio)

  // When padding is negative, the label overlaps the QR area.
  // Use absolute padding for text positioning inside the label box,
  // but allow the label box itself to overlap into QR space.
  const isOverlap = labelPadding < 0
  const textPadding = isOverlap ? 0 : labelPadding

  // Determine available width for the label text based on position
  let labelMaxWidth: number
  const isHorizontal = labelPosition === 'top' || labelPosition === 'bottom'

  if (isHorizontal) {
    labelMaxWidth = qrWidth - textPadding * 2
  } else {
    labelMaxWidth = Math.max(fontSize * 8, fontSize * label.length * 0.55 + textPadding * 2)
  }

  // Wrap text into lines
  const lines = wrapText(label, labelMaxWidth, fontSize)
  const textBlockHeight = lines.length * lineHeight

  // Label area uses absolute padding for sizing to avoid cutting text
  const labelAreaHeight = textBlockHeight + textPadding * 2
  const labelAreaWidth = isHorizontal ? qrWidth : labelMaxWidth + textPadding * 2

  // Overlap offset: how much the label box shifts into the QR area
  const overlapOffset = isOverlap ? Math.abs(labelPadding) : 0

  let canvasWidth: number
  let canvasHeight: number
  let qrX: number
  let qrY: number
  let labelBoxX: number
  let labelBoxY: number

  switch (labelPosition) {
    case 'top':
      canvasWidth = qrWidth
      canvasHeight = qrHeight + labelAreaHeight - overlapOffset
      qrX = 0
      qrY = labelAreaHeight - overlapOffset
      labelBoxX = 0
      labelBoxY = 0
      break
    case 'left':
      canvasWidth = qrWidth + labelAreaWidth - overlapOffset
      canvasHeight = qrHeight
      qrX = labelAreaWidth - overlapOffset
      qrY = 0
      labelBoxX = 0
      labelBoxY = 0
      break
    case 'right':
      canvasWidth = qrWidth + labelAreaWidth - overlapOffset
      canvasHeight = qrHeight
      qrX = 0
      qrY = 0
      labelBoxX = qrWidth - overlapOffset
      labelBoxY = 0
      break
    default: // bottom
      canvasWidth = qrWidth
      canvasHeight = qrHeight + labelAreaHeight - overlapOffset
      qrX = 0
      qrY = 0
      labelBoxX = 0
      labelBoxY = qrHeight - overlapOffset
      break
  }

  // Extract the inner content of the SVG (paths, rects, etc.)
  const svgContentMatch = qrSvgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
  const svgInnerContent = svgContentMatch ? svgContentMatch[1] : ''

  // Build SVG text elements for each line
  const textElements = lines
    .map((line, i) => {
      const escapedLine = escapeXml(line)
      const y = textPadding + fontSize + i * lineHeight
      return `    <text x="${labelAreaWidth / 2}" y="${y}" font-family="sans-serif" font-size="${fontSize}" fill="${color || '#000000'}" text-anchor="middle" dominant-baseline="auto">${escapedLine}</text>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
    <rect width="${canvasWidth}" height="${canvasHeight}" fill="${colorBg || '#FFFFFF'}"/>
    <g transform="translate(${qrX}, ${qrY})">
      <svg width="${qrWidth}" height="${qrHeight}" viewBox="${escapeXml(viewBox)}">
        ${svgInnerContent}
      </svg>
    </g>
    <g transform="translate(${labelBoxX}, ${labelBoxY})">
  ${textElements}
    </g>
  </svg>`
  }
  
/**
 * Embed an icon image (as base64 data URI) at the center of a QR code SVG.
 * Adds a white rounded-rect background behind the icon for readability.
 *
 * All coordinates are computed in the SVG's viewBox coordinate space so the
 * icon is correctly positioned regardless of the viewBox-to-pixel ratio.
 *
 * @param qrSvgString  — the raw QR SVG string
 * @param iconDataUri   — base64 data URI of the icon (e.g. "data:image/png;base64,…")
 * @param iconRatio     — icon size as a fraction of QR viewBox size (default 0.25 = 25%)
 */
export function embedIconInSvg(
  qrSvgString: string,
  iconDataUri: string,
  iconRatio = 0.25,
  colorBg = '#FFFFFF',
): string {
  const { viewBox } = parseSvgDimensions(qrSvgString, 300)

  // Parse the viewBox to get the coordinate space dimensions
  const vbParts = viewBox.split(/[\s,]+/).map(Number)
  const vbWidth = vbParts[2] || 300
  const vbHeight = vbParts[3] || 300

  // Calculate icon dimensions in viewBox units
  const iconSize = vbWidth * iconRatio
  const padding = iconSize * 0.08
  const bgSize = iconSize + padding * 2
  const bgX = (vbWidth - bgSize) / 2
  const bgY = (vbHeight - bgSize) / 2
  const iconX = (vbWidth - iconSize) / 2
  const iconY = (vbHeight - iconSize) / 2
  const rx = bgSize * 0.1

  // Extract inner content of the QR SVG
  const svgContentMatch = qrSvgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
  const svgInnerContent = svgContentMatch ? svgContentMatch[1] : ''

  // Re-use the original outer <svg> tag attributes (width, height, viewBox)
  const svgTagMatch = qrSvgString.match(/<svg[^>]*>/)
  const svgOpenTag = svgTagMatch ? svgTagMatch[0] : '<svg xmlns="http://www.w3.org/2000/svg">'

  return `${svgOpenTag}
    ${svgInnerContent}
    <rect x="${bgX}" y="${bgY}" width="${bgSize}" height="${bgSize}" rx="${rx}" ry="${rx}" fill="${colorBg}"/>
    <image xmlns:xlink="http://www.w3.org/1999/xlink" href="${iconDataUri}" xlink:href="${iconDataUri}" x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}"/>
  </svg>`
}
