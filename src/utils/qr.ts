import QRCode from 'qrcode'

/**
 * Generate a QR code as an SVG string.
 */
export async function generateQrSvg(
  text: string,
  size: number,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M',
): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 2,
    width: size,
    errorCorrectionLevel,
  })
}

/**
 * Parse width, height, and viewBox from an SVG string.
 */
export function parseSvgDimensions(
  svgString: string,
  fallbackSize: number,
): { width: number; height: number; viewBox: string } {
  const svgWidthMatch = svgString.match(/width="([^"]+)"/)
  const svgHeightMatch = svgString.match(/height="([^"]+)"/)
  const viewBoxMatch = svgString.match(/viewBox="([^"]+)"/)

  const width = svgWidthMatch ? parseFloat(svgWidthMatch[1]) : fallbackSize
  const height = svgHeightMatch ? parseFloat(svgHeightMatch[1]) : fallbackSize
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${width} ${height}`

  return { width, height, viewBox }
}
