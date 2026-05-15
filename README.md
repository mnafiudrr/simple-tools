# QR Code Generator API

A simple QR code generator API built with [Hono](https://hono.dev/) and deployed on [Cloudflare Workers](https://workers.cloudflare.com/).

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [Node.js](https://nodejs.org/) (for wrangler CLI compatibility)
- A [Cloudflare](https://www.cloudflare.com/) account (for deployment)

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

#### Query Parameters

| Parameter         | Required | Default   | Description                                                      |
|-------------------|----------|-----------|------------------------------------------------------------------|
| `text`            | Yes      | —         | The value to encode in the QR code                               |
| `size`            | No       | `300`     | QR code size in pixels (min: 50, max: 2000)                     |
| `label`           | No       | —         | Text label to display alongside the QR code                      |
| `label_position`  | No       | `bottom`  | Position of the label: `top`, `bottom`, `left`, `right`         |
| `text_size`       | No       | `md`      | Label text size preset: `sm`, `md`, `lg`, `xl` (scales with QR size) |

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

#### Response

- **Content-Type:** `image/svg+xml`
- **Cache-Control:** `public, max-age=3600`

#### Error Responses

| Status | Description                            |
|--------|----------------------------------------|
| 400    | Missing required `text` parameter      |
| 500    | Failed to generate QR code             |

## Deploy to Cloudflare Workers

Deploy to Cloudflare Workers:

```bash
bun run deploy
```

This runs `wrangler deploy --minify` which bundles and deploys the worker to your Cloudflare account.

> **Note:** Make sure you are logged in to Cloudflare via `npx wrangler login` before deploying.

## Project Structure

```
src/
  index.ts       # Main application with /qr endpoint
wrangler.jsonc   # Cloudflare Workers configuration
package.json     # Dependencies and scripts
tsconfig.json    # TypeScript configuration
```
