# QR Code Generator API

A simple QR code generator API built with [Hono](https://hono.dev/) and deployed on [Cloudflare Workers](https://workers.cloudflare.com/) or [AWS Lambda](https://aws.amazon.com/lambda/).

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

#### Query Parameters

| Parameter         | Required | Default   | Description                                                      |
|-------------------|----------|-----------|------------------------------------------------------------------|
| `text`            | Yes      | —         | The value to encode in the QR code                               |
| `size`            | No       | `300`     | QR code size in pixels (min: 50, max: 2000)                     |
| `label`           | No       | —         | Text label to display alongside the QR code                      |
| `label_position`  | No       | `bottom`  | Position of the label: `top`, `bottom`, `left`, `right`         |
| `text_size`       | No       | `md`      | Label text size preset: `sm`, `md`, `lg`, `xl` (scales with QR size) |
| `padding_size`    | No       | `md`      | Space between text and QR: `sm`, `md`, `lg`, `xl`               |

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
  index.ts          # Main Hono application
  routes/qr.ts      # QR code endpoint handlers
  utils/qr.ts       # QR code generation utilities
  utils/svg.ts      # SVG label composition utilities
lambda/
  index.ts          # AWS Lambda entry point (hono/aws-lambda adapter)
bin/qr-stack.ts     # CDK app entry point
lib/qr-stack.ts     # CDK stack definition (Lambda + Function URL)
cdk.json            # CDK configuration
wrangler.jsonc      # Cloudflare Workers configuration
package.json        # Dependencies and scripts
tsconfig.json       # TypeScript configuration
```
