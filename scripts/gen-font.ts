import * as fs from 'fs';

async function main() {
  const res = await fetch('https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf');
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  fs.writeFileSync('src/generated/font.ts', `export const robotoBase64 = "${base64}";`);
  console.log('Font generated successfully');
}
main();
