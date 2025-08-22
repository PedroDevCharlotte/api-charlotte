const fs = require('fs');
const path = require('path');

const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) {
  console.log('No tmp directory found.');
  process.exit(0);
}

const items = fs.readdirSync(tmpDir);
for (const item of items) {
  const p = path.join(tmpDir, item);
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log('Removed', p);
  } catch (err) {
    console.error('Failed to remove', p, err.message || err);
  }
}
console.log('tmp cleanup completed.');
