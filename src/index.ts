import { Hono } from 'hono'
import QRCode from 'qrcode'

const app = new Hono()

// Text size presets as ratio of QR size
const TEXT_SIZE_RATIOS: Record<string, number> = {
  sm: 0.04,
  md: 0.06,
  lg: 0.08,
  xl: 0.10,
}

/**
 * Wrap text into lines that fit within maxWidth (approximate character-based).
 * Each character is estimated as ~0.55 * fontSize wide for sans-serif.
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
}

app.get('/', (c) => {
  return c.text(`Hello You! Fiu is here 🐾

Need to generate a QR code?
Send a request to /qr with the following query parameters:

  • text           (required)  — The value to encode in the QR code
  • size           (optional)  — QR code size in pixels (default: 300)
  • label          (optional)  — A text label to display alongside the QR code (auto-wraps)
  • label_position (optional)  — Position of the label: top, bottom, left, right (default: bottom)
  • text_size      (optional)  — Label text size: sm, md, lg, xl (default: md, scales with QR size)

Examples:
  /qr?text=hello-world
  /qr?text=https://example.com&size=500&label=Visit+Me&label_position=bottom&text_size=lg
`)
})

app.get('/qr', async (c) => {
  const text = c.req.query('text')
  if (!text) {
    return c.json({ error: 'Missing required query parameter: text' }, 400)
  }

  const size = Math.max(50, Math.min(2000, parseInt(c.req.query('size') || '300', 10)))
  const label = c.req.query('label') || ''
  const labelPosition = c.req.query('label_position') || 'bottom'
  const textSizeKey = c.req.query('text_size') || 'md'

  try {
    // Generate QR code as SVG string
    const qrSvgString = await QRCode.toString(text, {
      type: 'svg',
      margin: 2,
      width: size,
      errorCorrectionLevel: 'M',
    })

    // If no label, return the QR SVG image directly
    if (!label) {
      return new Response(qrSvgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }

    // Parse SVG dimensions from the generated QR code
    const svgWidthMatch = qrSvgString.match(/width="([^"]+)"/)
    const svgHeightMatch = qrSvgString.match(/height="([^"]+)"/)
    const viewBoxMatch = qrSvgString.match(/viewBox="([^"]+)"/)

    const qrWidth = svgWidthMatch ? parseFloat(svgWidthMatch[1]) : size
    const qrHeight = svgHeightMatch ? parseFloat(svgHeightMatch[1]) : size
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${qrWidth} ${qrHeight}`

    // Calculate font size based on text_size preset and QR size
    const sizeRatio = TEXT_SIZE_RATIOS[textSizeKey] || TEXT_SIZE_RATIOS.md
    const fontSize = Math.round(qrWidth * sizeRatio)
    const lineHeight = Math.round(fontSize * 1.3)
    const labelPadding = Math.round(fontSize * 0.6)

    // Determine available width for the label text based on position
    let labelMaxWidth: number
    const isHorizontal = labelPosition === 'top' || labelPosition === 'bottom'

    if (isHorizontal) {
      // For top/bottom, label spans the full QR width with padding
      labelMaxWidth = qrWidth - labelPadding * 2
    } else {
      // For left/right, allocate space proportional to text length
      labelMaxWidth = Math.max(fontSize * 8, fontSize * label.length * 0.55 + labelPadding * 2)
    }

    // Wrap text into lines
    const lines = wrapText(label, labelMaxWidth, fontSize)
    const textBlockHeight = lines.length * lineHeight
    const labelAreaHeight = textBlockHeight + labelPadding * 2
    const labelAreaWidth = isHorizontal ? qrWidth : labelMaxWidth + labelPadding * 2

    let canvasWidth: number
    let canvasHeight: number
    let qrX: number
    let qrY: number
    let labelBoxX: number
    let labelBoxY: number

    switch (labelPosition) {
      case 'top':
        canvasWidth = qrWidth
        canvasHeight = qrHeight + labelAreaHeight
        qrX = 0
        qrY = labelAreaHeight
        labelBoxX = 0
        labelBoxY = 0
        break
      case 'left':
        canvasWidth = qrWidth + labelAreaWidth
        canvasHeight = qrHeight
        qrX = labelAreaWidth
        qrY = 0
        labelBoxX = 0
        labelBoxY = 0
        break
      case 'right':
        canvasWidth = qrWidth + labelAreaWidth
        canvasHeight = qrHeight
        qrX = 0
        qrY = 0
        labelBoxX = qrWidth
        labelBoxY = 0
        break
      default: // bottom
        canvasWidth = qrWidth
        canvasHeight = qrHeight + labelAreaHeight
        qrX = 0
        qrY = 0
        labelBoxX = 0
        labelBoxY = qrHeight
        break
    }

    // Extract the inner content of the SVG (paths, rects, etc.)
    const svgContentMatch = qrSvgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
    const svgInnerContent = svgContentMatch ? svgContentMatch[1] : ''

    // Build SVG text elements for each line
    const textElements = lines.map((line, i) => {
      const escapedLine = escapeXml(line)
      const y = labelPadding + fontSize + i * lineHeight
      return `    <text x="${labelAreaWidth / 2}" y="${y}" font-family="sans-serif" font-size="${fontSize}" fill="#000000" text-anchor="middle" dominant-baseline="auto">${escapedLine}</text>`
    }).join('\n')

    const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <rect width="${canvasWidth}" height="${canvasHeight}" fill="#FFFFFF"/>
  <g transform="translate(${qrX}, ${qrY})">
    <svg width="${qrWidth}" height="${qrHeight}" viewBox="${viewBox}">
      ${svgInnerContent}
    </svg>
  </g>
  <g transform="translate(${labelBoxX}, ${labelBoxY})">
    <rect width="${labelAreaWidth}" height="${labelAreaHeight}" fill="#FFFFFF"/>
${textElements}
  </g>
</svg>`

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

export default app
