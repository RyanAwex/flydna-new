const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\HClar\\Downloads\\Scenes_w.motion';
const destDir = path.join(__dirname, 'public', 'scenes');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    // Sanitize destination folder names: Group_Chat -> group-chat, Home -> home, Ride-Out -> ride-out
    let folderName = entry.name.toLowerCase().replace(/_/g, '-');
    const destPath = entry.isDirectory() ? path.join(dest, folderName) : path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${entry.name} -> ${destPath}`);
    }
  }
}

copyRecursive(srcDir, destDir);
console.log('✅ All scenes copied successfully to public/scenes/');
