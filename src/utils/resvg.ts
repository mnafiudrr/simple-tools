import { initWasm, Resvg } from '@resvg/resvg-wasm';
import wasmBase64 from '@resvg/resvg-wasm/index_bg.wasm';
import { robotoBase64 } from '../generated/font';

let wasmInitialized = false;
let fontBuffer: Uint8Array;

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64.replace(/\s+/g, ''));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function renderPngLocally(svg: string, width: number): Promise<Uint8Array> {
  if (!wasmInitialized) {
    if (typeof wasmBase64 === 'string') {
      const wasmBuffer = base64ToUint8Array(wasmBase64);
      await initWasm(wasmBuffer);
    } else {
      // In Wrangler (Cloudflare Workers), .wasm imports are parsed directly as WebAssembly.Module
      await initWasm(wasmBase64 as any);
    }
    fontBuffer = base64ToUint8Array(robotoBase64);
    wasmInitialized = true;
  }
  
  const resvg = new Resvg(svg, {
    background: 'rgba(255, 255, 255, 0)',
    fitTo: { mode: 'width', value: width },
    font: {
      fontBuffers: [fontBuffer],
      defaultFontFamily: 'Roboto',
      sansSerifFamily: 'Roboto',
    }
  });
  
  const pngData = resvg.render();
  return pngData.asPng();
}
