const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\HClar\\Downloads\\Scenes_w.motion';
const dest = path.join(__dirname, 'public', 'scenes');

function copyFiles(dir, sub = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fullSrc = path.join(dir, e.name);
    if (e.isDirectory()) {
      copyFiles(fullSrc, path.join(sub, e.name));
    } else {
      const targetDir = path.join(dest, sub);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      fs.copyFileSync(fullSrc, path.join(targetDir, e.name));
      // Also copy flat to dest/ for direct path fallback
      fs.copyFileSync(fullSrc, path.join(dest, e.name));
      console.log(`Copied ${e.name}`);
    }
  }
}

copyFiles(src);
console.log('Done copying scene videos.');
