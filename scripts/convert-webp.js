const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '..', 'public', 'img');

const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.png'));

(async () => {
  for (const file of files) {
    const input = path.join(imgDir, file);
    const output = path.join(imgDir, file.replace('.png', '.webp'));
    const origSize = fs.statSync(input).size;

    // Try quality 75 with effort 6 for better compression
    const info = await sharp(input).webp({ quality: 75, effort: 6 }).toFile(output);
    const saved = ((1 - info.size / origSize) * 100).toFixed(0);

    // If WebP is larger, try even lower quality or remove it
    if (info.size >= origSize) {
      // Try quality 65
      const info2 = await sharp(input).webp({ quality: 65, effort: 6 }).toFile(output);
      const saved2 = ((1 - info2.size / origSize) * 100).toFixed(0);
      if (info2.size >= origSize) {
        // WebP is still larger - delete it, PNG wins
        fs.unlinkSync(output);
        console.log(`${file} → SKIPPED (PNG is already smaller)`);
      } else {
        console.log(`${file} → ${file.replace('.png', '.webp')} | ${(origSize/1024).toFixed(0)} KB → ${(info2.size/1024).toFixed(0)} KB (${saved2}% saved) [q65]`);
      }
    } else {
      console.log(`${file} → ${file.replace('.png', '.webp')} | ${(origSize/1024).toFixed(0)} KB → ${(info.size/1024).toFixed(0)} KB (${saved}% saved)`);
    }
  }

  // Also get dimensions for each image
  console.log('\n--- Image dimensions ---');
  for (const file of files) {
    const input = path.join(imgDir, file);
    const meta = await sharp(input).metadata();
    console.log(`${file}: ${meta.width}x${meta.height}`);
  }

  console.log('\nDone!');
})();
