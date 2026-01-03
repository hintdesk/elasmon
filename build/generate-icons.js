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
}

generateIcons().catch(console.error);
