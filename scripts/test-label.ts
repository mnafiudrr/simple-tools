import { renderPngLocally } from '../src/utils/resvg';
import { generateQrSvg } from '../src/utils/qr';
import { buildLabeledSvg } from '../src/utils/svg';
import * as fs from 'fs';

async function main() {
  const qrSvg = await generateQrSvg('test', 300, 'M');
  const labeledSvg = buildLabeledSvg(qrSvg, {
    label: 'Hello World',
    labelPosition: 'bottom',
    textSizeKey: 'lg',
    paddingSizeKey: 'lg',
    size: 300,
  });
  
  const pngBuffer = await renderPngLocally(labeledSvg, 300);
  fs.writeFileSync('test-label.png', pngBuffer);
  console.log('Labeled PNG rendered successfully, size:', pngBuffer.length);
}
main();
