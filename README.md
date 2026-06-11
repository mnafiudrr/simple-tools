# QR Code Generator API

A simple QR code generator API built with [Hono](https://hono.dev/) and deployed on [Cloudflare Workers](https://workers.cloudflare.com/) or [AWS Lambda](https://aws.amazon.com/lambda/).

Supports two rendering engines:

- **basic** — the original `qrcode` library (fast, lightweight)
- **styled** — `qr-code-styling` library (custom dot shapes, corner styles, gradients, native logo embedding)

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [Node.js](https://nodejs.org/) (for wrangler CLI compatibility)
- A [Cloudflare](https://www.cloudflare.com/) account (for Cloudflare Workers deployment)
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials (for Lambda deployment)

## Install

```bash
bun install
```

## Run Locally

Start the development server:

```bash
bun run dev
```

The server will start at `http://localhost:8787`.

## API Usage

### `GET /qr`

Generate a QR code as an SVG image.

#### General Parameters

| Parameter         | Required | Default   | Description                                                      |
|-------------------|----------|-----------|------------------------------------------------------------------|
| `text`            | Yes      | —         | The value to encode in the QR code                               |
| `style`           | No       | `basic`   | Rendering engine: `basic` or `styled`                            |
| `size`            | No       | `300`     | QR code size in pixels (min: 50, max: 2000)                     |
| `margin`          | No       | `2`       | Quiet zone margin in modules (`styled` only)                     |
| `ec_level`        | No       | `M`       | Error correction level: `L`, `M`, `Q`, `H`                      |

#### Color Parameters (both styles)

| Parameter   | Required | Default     | Description                                                    |
|-------------|----------|-------------|----------------------------------------------------------------|
| `color`     | No       | `000000`    | Foreground (dark module) color as hex, e.g. `FF0000` or `#FF0000` |
| `color_bg`  | No       | `FFFFFF`    | Background (light module) color as hex, e.g. `FFFFFF` or `#FFFFFF` |

#### Label Parameters (both styles)

| Parameter         | Required | Default   | Description                                                      |
|-------------------|----------|-----------|------------------------------------------------------------------|
| `label`           | No       | —         | Text label to display alongside the QR code                      |
| `label_position`  | No       | `bottom`  | Position of the label: `top`, `bottom`, `left`, `right`         |
| `text_size`       | No       | `md`      | Label text size preset: `sm`, `md`, `lg`, `xl` (scales with QR size) |
| `padding_size`    | No       | `md`      | Space between text and QR: `sm`, `md`, `lg`, `xl`               |

#### Icon / Logo Parameters

| Parameter            | Required | Default   | Style    | Description                                              |
|----------------------|----------|-----------|----------|----------------------------------------------------------|
| `icon_url`           | No       | —         | both     | URL of an icon/logo image to embed                       |
| `icon_size`          | No       | `0.25`    | styled   | Icon size as fraction of QR size (0.1–0.5)               |
| `icon_margin`        | No       | `0`       | styled   | Margin around icon in pixels                             |
| `icon_hide_bg_dots`  | No       | `true`    | styled   | Hide QR dots behind icon: `true`, `false`                |

#### Dot Style Parameters (`styled` only)

| Parameter   | Required | Default    | Description                                                                  |
|-------------|----------|------------|------------------------------------------------------------------------------|
| `dot_type`  | No       | `square`   | Dot shape: `square`, `dots`, `rounded`, `extra-rounded`, `classy`, `classy-rounded` |

#### Corner Square Parameters (`styled` only)

| Parameter              | Required | Default    | Description                                               |
|------------------------|----------|------------|-----------------------------------------------------------|
| `corner_square_type`   | No       | `square`   | Corner square shape: `square`, `dot`, `extra-rounded`     |
| `corner_square_color`  | No       | same as `color` | Corner square fill color as hex                      |

#### Corner Dot Parameters (`styled` only)

| Parameter           | Required | Default    | Description                                     |
|---------------------|----------|------------|-------------------------------------------------|
| `corner_dot_type`   | No       | `square`   | Corner dot shape: `square`, `dot`               |
| `corner_dot_color`  | No       | same as `color` | Corner dot fill color as hex               |

#### Gradient Parameters (`styled` only)

| Parameter           | Required | Default   | Description                                       |
|---------------------|----------|-----------|---------------------------------------------------|
| `gradient_type`     | No       | —         | Gradient type: `linear`, `radial`                 |
| `gradient_color1`   | No       | —         | Gradient start color as hex                       |
| `gradient_color2`   | No       | —         | Gradient end color as hex                         |
| `gradient_rotation` | No       | `0`       | Gradient rotation in degrees (linear only)        |

> **Note:** All three gradient parameters (`gradient_type`, `gradient_color1`, `gradient_color2`) must be provided together to apply a gradient.

#### Examples

**Basic QR code:**

```
GET /qr?text=hello-world
```

**QR code with a bottom label:**

```
GET /qr?text=hello-world&label=ScanMe
```

**QR code with custom size and large label on top:**

```
GET /qr?text=hello-world&size=500&label=ScanMe&label_position=top&text_size=lg
```

**QR code with label on the left:**

```
GET /qr?text=hello-world&label=ScanMe&label_position=left
```

**QR code with extra-large label on the right:**

```
GET /qr?text=hello-world&size=600&label=ScanMe&label_position=right&text_size=xl
```

**QR code with custom colors:**

```
GET /qr?text=https://example.com&color=1a1a2e&color_bg=e0e0ff
```

**QR code with embedded icon (basic style):**

```
GET /qr?text=https://example.com&icon_url=https://example.com/logo.png
```

**Styled QR with dot shape:**

```
GET /qr?text=https://example.com&style=styled&dot_type=dots
```

**Styled QR with rounded corners and custom colors:**

```
GET /qr?text=https://example.com&style=styled&dot_type=rounded&corner_square_type=extra-rounded&corner_dot_type=dot&color=3b82f6&corner_square_color=1e40af
```

**Styled QR with gradient:**

```
GET /qr?text=https://example.com&style=styled&dot_type=rounded&gradient_type=linear&gradient_color1=8b5cf6&gradient_color2=ec4899&gradient_rotation=45
```

**Styled QR with embedded icon:**

```
GET /qr?text=https://example.com&style=styled&dot_type=classy&icon_url=https://example.com/logo.png&icon_size=0.3&ec_level=H
```

**Styled QR with label:**

```
GET /qr?text=https://example.com&style=styled&dot_type=dots&label=Scan+Me&label_position=bottom&text_size=lg
```

#### Response

- **Content-Type:** `image/svg+xml`
- **Cache-Control:** `public, max-age=3600`

#### Error Responses

| Status | Description                            |
|--------|----------------------------------------|
| 400    | Missing required `text` parameter or invalid parameter value |
| 500    | Failed to generate QR code             |

## Deploy to Cloudflare Workers

Deploy to Cloudflare Workers:

```bash
bun run cf-deploy
```

This runs `wrangler deploy --minify` which bundles and deploys the worker to your Cloudflare account.

> **Note:** Make sure you are logged in to Cloudflare via `npx wrangler login` before deploying.

## Deploy to AWS Lambda

### Via CDK

Synthesize the CloudFormation template:

```bash
bun run synth
```

Deploy to AWS:

```bash
bun run deploy
```

This uses the AWS CDK to deploy a Lambda function with a public Function URL. The Lambda uses `hono/aws-lambda` to adapt the Hono app for the AWS Lambda runtime.

> **Note:** Make sure your AWS CLI is configured with the desired account and region. The stack uses `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` by default.

### Manual Upload

Build the Lambda bundle with esbuild:

```bash
bunx esbuild lambda/index.ts --bundle --platform=node --target=node22 --format=cjs --outfile=lambda/build/index.js --external:aws-sdk
```

This bundles the Lambda entry point into a single CommonJS file at `lambda/build/index.js`, targeting Node.js 22 and excluding the `aws-sdk` (already available in the Lambda runtime).

Then upload the generated `lambda/build/index.js` file to your Lambda function via the AWS Management Console (Lambda → your function → Upload from).

## Project Structure

```
src/
  index.ts              # Main Hono application
  routes/qr.ts          # QR code endpoint handlers
  utils/qr.ts           # Basic QR code generation (qrcode lib)
  utils/qr-styled.ts    # Styled QR code generation (qr-code-styling lib)
  utils/qr-styling.ts   # DOM polyfill + SVG serializer for qr-code-styling
  utils/svg.ts          # SVG label composition utilities
lambda/
  index.ts              # AWS Lambda entry point (hono/aws-lambda adapter)
bin/qr-stack.ts         # CDK app entry point
lib/qr-stack.ts         # CDK stack definition (Lambda + Function URL)
cdk.json                # CDK configuration
wrangler.jsonc          # Cloudflare Workers configuration
package.json            # Dependencies and scripts
tsconfig.json           # TypeScript configuration
```
