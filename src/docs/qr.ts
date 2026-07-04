/**
 * Documentation module for the QR tool.
 *
 * Consumed by both the root tool list (`GET /`) and the help routes
 * (`GET /help`, `GET /help/qr`), so docs live in one place.
 */

export const qrToolMeta = {
  name: 'qr',
  path: '/qr',
  summary: 'Generate a QR code as SVG or PNG with extensive styling options.',
}

/**
 * Full HTML documentation fragment (parameter tables + examples).
 * Rendered as a complete, styled `<section>` so `/help` can concatenate
 * multiple tool sections and `/help/qr` can render it standalone.
 */
export const qrDocsHtml = `
<section>
  <h2>QR Code Generator — <code>/qr</code></h2>
  <p>Generate a QR code as an SVG (default) or PNG image.</p>

  <h3>General Parameters</h3>
  <table>
    <thead><tr><th>Parameter</th><th>Required</th><th>Default</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>text</code></td><td>Yes</td><td>—</td><td>The value to encode in the QR code</td></tr>
      <tr><td><code>style</code></td><td>No</td><td><code>basic</code></td><td>Rendering engine: <code>basic</code> or <code>styled</code></td></tr>
      <tr><td><code>size</code></td><td>No</td><td><code>300</code></td><td>QR code size in pixels (min: 50, max: 2000)</td></tr>
      <tr><td><code>margin</code></td><td>No</td><td><code>2</code></td><td>Quiet zone margin in modules (<code>styled</code> only)</td></tr>
      <tr><td><code>ec_level</code></td><td>No</td><td><code>M</code></td><td>Error correction level: <code>L</code>, <code>M</code>, <code>Q</code>, <code>H</code></td></tr>
      <tr><td><code>return_type</code></td><td>No</td><td><code>svg</code></td><td>Output format: <code>svg</code> or <code>png</code> (rasterized locally via <code>@resvg/resvg-wasm</code>)</td></tr>
    </tbody>
  </table>

  <h3>Color Parameters (both styles)</h3>
  <table>
    <thead><tr><th>Parameter</th><th>Required</th><th>Default</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>color</code></td><td>No</td><td><code>000000</code></td><td>Foreground color as hex, e.g. <code>FF0000</code> or <code>#FF0000</code></td></tr>
      <tr><td><code>color_bg</code></td><td>No</td><td><code>FFFFFF</code></td><td>Background color as hex, e.g. <code>FFFFFF</code> or <code>#FFFFFF</code></td></tr>
    </tbody>
  </table>

  <h3>Label Parameters (both styles)</h3>
  <table>
    <thead><tr><th>Parameter</th><th>Required</th><th>Default</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>label</code></td><td>No</td><td>—</td><td>Text label to display alongside the QR code</td></tr>
      <tr><td><code>label_position</code></td><td>No</td><td><code>bottom</code></td><td>Position: <code>top</code>, <code>bottom</code>, <code>left</code>, <code>right</code></td></tr>
      <tr><td><code>text_size</code></td><td>No</td><td><code>md</code></td><td>Label text size: <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code></td></tr>
      <tr><td><code>padding_size</code></td><td>No</td><td><code>md</code></td><td>Space between text and QR: <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code></td></tr>
    </tbody>
  </table>

  <h3>Icon / Logo Parameters</h3>
  <table>
    <thead><tr><th>Parameter</th><th>Required</th><th>Default</th><th>Style</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>icon_url</code></td><td>No</td><td>—</td><td>both</td><td>URL of an icon/logo image to embed</td></tr>
      <tr><td><code>icon_size</code></td><td>No</td><td><code>0.25</code></td><td>styled</td><td>Icon size as fraction of QR size (0.1–0.5)</td></tr>
      <tr><td><code>icon_margin</code></td><td>No</td><td><code>0</code></td><td>styled</td><td>Margin around icon in pixels</td></tr>
      <tr><td><code>icon_hide_bg_dots</code></td><td>No</td><td><code>true</code></td><td>styled</td><td>Hide QR dots behind icon: <code>true</code>, <code>false</code></td></tr>
    </tbody>
  </table>

  <h3>Dot Style Parameters (<code>styled</code> only)</h3>
  <table>
    <thead><tr><th>Parameter</th><th>Required</th><th>Default</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>dot_type</code></td><td>No</td><td><code>square</code></td><td>Dot shape: <code>square</code>, <code>dots</code>, <code>rounded</code>, <code>extra-rounded</code>, <code>classy</code>, <code>classy-rounded</code></td></tr>
      <tr><td><code>dot_scale</code></td><td>No</td><td><code>1.0</code></td><td>Dot scale factor (0.1–1.0)</td></tr>
    </tbody>
  </table>

  <h3>Corner Square Parameters (<code>styled</code> only)</h3>
  <table>
    <thead><tr><th>Parameter</th><th>Required</th><th>Default</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>corner_square_type</code></td><td>No</td><td><code>square</code></td><td>Corner square shape: <code>square</code>, <code>dot</code>, <code>extra-rounded</code></td></tr>
      <tr><td><code>corner_square_color</code></td><td>No</td><td>same as <code>color</code></td><td>Corner square fill color as hex</td></tr>
    </tbody>
  </table>

  <h3>Corner Dot Parameters (<code>styled</code> only)</h3>
  <table>
    <thead><tr><th>Parameter</th><th>Required</th><th>Default</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>corner_dot_type</code></td><td>No</td><td><code>square</code></td><td>Corner dot shape: <code>square</code>, <code>dot</code></td></tr>
      <tr><td><code>corner_dot_color</code></td><td>No</td><td>same as <code>color</code></td><td>Corner dot fill color as hex</td></tr>
    </tbody>
  </table>

  <h3>Gradient Parameters (<code>styled</code> only)</h3>
  <table>
    <thead><tr><th>Parameter</th><th>Required</th><th>Default</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>gradient_type</code></td><td>No</td><td>—</td><td>Gradient type: <code>linear</code>, <code>radial</code></td></tr>
      <tr><td><code>gradient_color1</code></td><td>No</td><td>—</td><td>Gradient start color as hex</td></tr>
      <tr><td><code>gradient_color2</code></td><td>No</td><td>—</td><td>Gradient end color as hex</td></tr>
      <tr><td><code>gradient_rotation</code></td><td>No</td><td><code>0</code></td><td>Gradient rotation in degrees (linear only)</td></tr>
    </tbody>
  </table>
  <p><strong>Note:</strong> All three gradient parameters (<code>gradient_type</code>, <code>gradient_color1</code>, <code>gradient_color2</code>) must be provided together to apply a gradient.</p>

  <h3>Examples</h3>
  <pre><code>GET /qr?text=hello-world
GET /qr?text=hello-world&return_type=png
GET /qr?text=hello-world&label=ScanMe
GET /qr?text=https://example.com&color=1a1a2e&color_bg=e0e0ff
GET /qr?text=https://example.com&icon_url=https://example.com/logo.png
GET /qr?text=https://example.com&style=styled&dot_type=dots
GET /qr?text=https://example.com&style=styled&dot_type=rounded&gradient_type=linear&gradient_color1=8b5cf6&gradient_color2=ec4899</code></pre>

  <h3>Error Responses</h3>
  <table>
    <thead><tr><th>Status</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td>400</td><td>Missing required <code>text</code> parameter or invalid parameter value</td></tr>
      <tr><td>500</td><td>Failed to generate QR code</td></tr>
    </tbody>
  </table>
</section>
`
