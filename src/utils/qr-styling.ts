/**
 * Minimal DOM polyfill for qr-code-styling.
 *
 * The library requires `window`, `document`, and `Image` to construct SVG
 * elements.  In Bun / Cloudflare Workers these globals don't exist, so we
 * provide lightweight stubs that satisfy the library's internal DOM
 * manipulation without a real browser environment.
 */

// ── Element factory ──────────────────────────────────────────────
const makeElement = (tag: string): any => {
  const el: Record<string, any> = {
    tagName: tag.toUpperCase(),
    nodeName: tag.toUpperCase(),
    nodeType: 1,
    style: {},
    attributes: {},
    children: [],
    childNodes: [],
    parentNode: null,

    setAttribute(n: string, v: any) { this.attributes[n] = v },
    getAttribute(n: string) { return this.attributes[n] ?? null },
    removeAttribute(n: string) { delete this.attributes[n] },
    appendChild(c: any) { this.childNodes.push(c); this.children.push(c); c.parentNode = this; return c },
    removeChild() { return null },
    insertBefore(c: any) { this.childNodes.push(c); c.parentNode = this; return c },
    replaceChild(c: any) { return c },
    cloneNode() { return makeElement(this.tagName) },
    querySelectorAll() { return [] },
    querySelector() { return null },
    addEventListener() {},
    removeEventListener() {},
    setAttributeNS(_ns: string, n: string, v: any) { this.attributes[n] = v },
    getAttributeNS() { return null },
    removeAttributeNS() {},
    hasAttribute(n: string) { return n in this.attributes },
    getElementsByTagName() { return [] },
    getBoundingClientRect() { return { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 } },
    classList: { add() {}, remove() {}, contains() { return false }, toggle() {} },
    textContent: '',
    innerHTML: '',
    get firstChild() { return this.childNodes[0] || null },
    get lastChild() { return this.childNodes[this.childNodes.length - 1] || null },
    get nextSibling() { return null },
    get previousSibling() { return null },
  }
  return el
}

// ── Document stub ────────────────────────────────────────────────
const stubDocument: any = {
  createElement: makeElement,
  createElementNS: (_ns: string, tag: string) => makeElement(tag),
  createDocumentFragment: () => makeElement('fragment'),
  createTextNode: (t: string) => ({ nodeType: 3, textContent: t, data: t }),
  createComment: (t: string) => ({ nodeType: 8, textContent: t, data: t }),
  appendChild() {},
  body: makeElement('body'),
  documentElement: makeElement('html'),
  head: makeElement('head'),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementsByTagName: () => [],
}

// ── Image stub with real fetch ────────────────────────────────────
// qr-code-styling uses `new Image()` + setting `.src` to load logo
// images. In a browser, this triggers a network request and fires
// `onload` once the image is decoded.  We simulate this by fetching
// the image via the Fetch API and converting to a data-URI.
class StubImage {
  width = 0
  height = 0
  naturalWidth = 0
  naturalHeight = 0
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  complete = false
  crossOrigin = ''

  /** Called by qr-code-styling to start loading an image. */
  set src(value: string) {
    this._src = value
    if (!value) return
    this._loadImage(value)
  }
  get src() { return this._src }

  private _src = ''

  private async _loadImage(url: string) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const ct = res.headers.get('content-type') || 'image/png'
      const buf = await res.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(buf).reduce((d, b) => d + String.fromCharCode(b), ''),
      )
      this._src = `data:${ct};base64,${base64}`
      this.complete = true
      this.naturalWidth = 100
      this.naturalHeight = 100
      // Fire onload asynchronously (like a browser)
      if (this.onload) queueMicrotask(() => this.onload!())
    } catch {
      if (this.onerror) queueMicrotask(() => this.onerror!())
    }
  }
}

// ── Install globals (idempotent) ─────────────────────────────────
let _polyfilled = false

export function ensureDomPolyfill(): void {
  if (_polyfilled) return
  const g = globalThis as any
  if (typeof g.window === 'undefined' || !g.window?.document) {
    g.window = { document: stubDocument, Image: StubImage as any }
    g.document = stubDocument
  }
  _polyfilled = true
}

// ── SVG serialiser ───────────────────────────────────────────────
/**
 * Map of UPPERCASE tag names produced by the DOM stub to their proper
 * SVG camelCase equivalents.  SVG is case-sensitive — `<clipPath>` and
 * `<linearGradient>` must be cased correctly or browsers won't render them.
 */
const SVG_TAG_MAP: Record<string, string> = {
  CLIPPATH: 'clipPath',
  LINEARGRADIENT: 'linearGradient',
  RADIALGRADIENT: 'radialGradient',
  STOP: 'stop',
  DEFS: 'defs',
  RECT: 'rect',
  CIRCLE: 'circle',
  ELLIPSE: 'ellipse',
  LINE: 'line',
  POLYLINE: 'polyline',
  POLYGON: 'polygon',
  PATH: 'path',
  IMAGE: 'image',
  TEXT: 'text',
  TSPAN: 'tspan',
  G: 'g',
  SVG: 'svg',
  USE: 'use',
  SYMBOL: 'symbol',
  PATTERN: 'pattern',
  MASK: 'mask',
  MARKER: 'marker',
  FOREIGNOBJECT: 'foreignObject',
}

/**
 * Map of UPPERCASE attribute names to their proper SVG camelCase equivalents.
 */
const SVG_ATTR_MAP: Record<string, string> = {
  VIEWBOX: 'viewBox',
  PRESERVEASPECTRATIO: 'preserveAspectRatio',
  XMLNSXLINK: 'xmlns:xlink',
  XLINKHREF: 'xlink:href',
  CLIPPATH: 'clip-path',
  FILLOPACITY: 'fill-opacity',
  STROKEOPACITY: 'stroke-opacity',
  STROKEWIDTH: 'stroke-width',
  STROKEDASHARRAY: 'stroke-dasharray',
  STROKELINECAP: 'stroke-linecap',
  STROKELINEJOIN: 'stroke-linejoin',
  TEXTANCHOR: 'text-anchor',
  DOMINANTBASELINE: 'dominant-baseline',
  FONTFAMILY: 'font-family',
  FONTSIZE: 'font-size',
  FONTWEIGHT: 'font-weight',
  FONTSTYLE: 'font-style',
  TEXTDECORATION: 'text-decoration',
  MARKERSTART: 'marker-start',
  MARKERMID: 'marker-mid',
  MARKEREND: 'marker-end',
  TRANSFORM: 'transform',
  GRADIENTUNITS: 'gradientUnits',
  GRADIENTTRANSFORM: 'gradientTransform',
  SPREADMETHOD: 'spreadMethod',
  PATTERNUNITS: 'patternUnits',
  PATTERNCONTENTUNITS: 'patternContentUnits',
  PATTERNTRANSFORM: 'patternTransform',
  MASKCONTENTUNITS: 'maskContentUnits',
  MASKUNITS: 'maskUnits',
  CLIPPATHUNITS: 'clipPathUnits',
  MARKERWIDTH: 'markerWidth',
  MARKERHEIGHT: 'markerHeight',
  REFX: 'refX',
  REFY: 'refY',
  MARKERUNITS: 'markerUnits',
  ORIENT: 'orient',
  BASEPROFILE: 'baseProfile',
  COLOR: 'color',
  OPACITY: 'opacity',
  FILL: 'fill',
  STROKE: 'stroke',
}

/**
 * Convert an UPPERCASE attribute name to its proper SVG form.
 * Handles known mappings and falls back to lowercase for simple names.
 */
function normalizeAttrName(name: string): string {
  if (SVG_ATTR_MAP[name]) return SVG_ATTR_MAP[name]
  // Already lowercase or mixed-case (set by the library directly) — keep as-is
  if (name !== name.toUpperCase()) return name
  // Simple all-lowercase attributes like "id", "x", "y", "width", "height", etc.
  return name.toLowerCase()
}

/**
 * Recursively serialise a virtual DOM tree produced by `qr-code-styling`
 * into a real SVG string with properly-cased tag and attribute names.
 */
export function serializeSvgElement(el: any): string {
  if (!el) return ''
  if (el.nodeType === 3) return el.textContent || ''
  if (el.nodeType === 8) return ''
  if (el.nodeType !== 1) return ''

  const rawTag = el.tagName || ''
  const tag = SVG_TAG_MAP[rawTag] || rawTag.toLowerCase()
  let s = '<' + tag

  const attrs = el.attributes || {}
  for (const [k, v] of Object.entries(attrs)) {
    const attrName = normalizeAttrName(k)
    const attrValue = String(v).replace(/"/g, '"')
    // Fix empty xmlns on root <svg> — must be the SVG namespace for browsers to render
    if (attrName === 'xmlns' && attrValue === '') continue
    s += ' ' + attrName + '="' + attrValue + '"'
  }

  // Ensure root <svg> has the correct SVG namespace
  if (tag === 'svg' && !('xmlns' in attrs)) {
    s += ' xmlns="http://www.w3.org/2000/svg"'
  }

  const children = el.childNodes || []
  if (children.length > 0) {
    s += '>'
    for (const child of children) {
      s += serializeSvgElement(child)
    }
    s += '</' + tag + '>'
  } else {
    s += '/>'
  }
  return s
}
