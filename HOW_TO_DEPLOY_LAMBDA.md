# How to Deploy to AWS Lambda (Manually)

This application has been updated to use `@resvg/resvg-wasm` for fast, local SVG-to-PNG conversions without relying on any external services like Browserless.
Because it uses WebAssembly, we bundle the `.wasm` file inline so that you only ever need to deal with a single `index.js` file for your Lambda function.

## 1. Build the Lambda Bundle

To build the application into a single file for AWS Lambda, run the following command in your terminal:

```bash
bunx esbuild lambda/index.ts \
  --bundle \
  --platform=node \
  --target=node22 \
  --format=cjs \
  --loader:.wasm=base64 \
  --outfile=lambda/build/index.js \
  --external:aws-sdk
```

**Note:** The `--loader:.wasm=base64` flag is crucial. It tells `esbuild` to embed the `resvg` WebAssembly binary directly into the generated `index.js` as a base64 string.

## 2. Deploy via the AWS Console (Drag & Drop)

1. Open the AWS Management Console and navigate to **Lambda**.
2. Select your target Lambda function.
3. Under the **Code** tab, look for the **Code source** section.
4. Click on **Upload from** and select **.zip or .jar file** (if you zipped the file) OR just use the built-in editor if it's small enough.
   * *Wait, `index.js` can be dragged and dropped into the browser's Cloud9 code editor directly if the bundle is smaller than the editor limit (a few megabytes).* 
   * Alternatively, to ensure it uploads cleanly regardless of size:
     1. Zip the file: `cd lambda/build && zip index.zip index.js`
     2. Click **Upload from** > **.zip file** and select the `index.zip` file.
5. Click **Save**.

## 3. Verify Configuration

Ensure your Lambda function's **Runtime** is set to **Node.js 22.x** (or the matching version of your `target`).
Ensure the **Handler** is set to `index.handler`.

That's it! Your QR code generator will now generate PNG files entirely locally inside the AWS Lambda environment.
