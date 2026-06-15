/**
 * Browserless v2.51.0 PNG rendering client.
 *
 * The Worker generates an SVG QR code, then delegates PNG rasterization to a
 * Browserless headless-Chrome service. The `/screenshot` endpoint loads a page
 * URL and returns a PNG screenshot of the rendered SVG.
 *
 * The page URL is built from the `PAGE_URL` env var (the public base URL of
 * this Worker's `/qr` endpoint) with the incoming query string appended — but
 * with `return_type` stripped, so the inner request returns plain SVG and the
 * Worker → Browserless → Worker recursion is broken.
 *
 * @see plans/return-type-png-plan.md
 */

/**
 * Render a page to a PNG buffer via Browserless v2.51.0 `/screenshot`.
 *
 * @param browserlessBaseUrl  Browserless base URL. The operator should bake the
 *                            API token into this value, e.g.
 *                            `https://chrome.browserless.io?token=XXXX`.
 * @param pageUrl             The page Browserless should load (the Worker's
 *                            /qr URL with `return_type` removed).
 * @param width               Clip width in pixels — should match the SVG's
 *                            intrinsic width (parsed via `parseSvgDimensions`).
 * @param height              Clip height in pixels — should match the SVG's
 *                            intrinsic height.
 * @returns                   Raw PNG bytes as an `ArrayBuffer`.
 */
export async function renderPngViaBrowserless(
  browserlessBaseUrl: string,
  pageUrl: string,
  width: number,
  height: number,
): Promise<ArrayBuffer> {
  const endpoint = `${browserlessBaseUrl.replace(/\/$/, '')}/screenshot`
  console.log(pageUrl);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: pageUrl,
      options: {
        type: 'png',
        encoding: 'binary',
        fullPage: false,
        omitBackground: false,
        clip: { x: 0, y: 0, width, height, scale: 1 },
      },
      // networkidle0 ensures the inner /qr request (and any icon_url fetch
      // it performs) fully completes before the screenshot is taken.
      gotoOptions: { waitUntil: 'networkidle0', timeout: 30000 },
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Browserless ${res.status}: ${detail}`)
  }

  return res.arrayBuffer()
}
