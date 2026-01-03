const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);
  
  // Generate PNG at 256x256
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(__dirname, 'icon.png'));
  
  console.log('icon.png created successfully!');

  // Generate ICO from PNG for Windows exe using dynamic import
  const pngToIco = (await import('png-to-ico')).default;
  const pngBuffer = fs.readFileSync(path.join(__dirname, 'icon.png'));
  const icoBuffer = await pngToIco(pngBuffer);
  fs.writeFileSync(path.join(__dirname, 'icon.ico'), icoBuffer);
  
  console.log('icon.ico created successfully!');
}

generateIcons().catch(console.error);
