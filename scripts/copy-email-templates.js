const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyTemplates() {
  const srcDir = path.join(process.cwd(), 'src', 'Modules', 'Core', 'email', 'templates');
  const distDir1 = path.join(process.cwd(), 'dist', 'Modules', 'Core', 'email', 'templates');
  const distDir2 = path.join(process.cwd(), 'dist', 'src', 'Modules', 'Core', 'email', 'templates');

  console.log('Copying email templates from', srcDir);

  if (!fs.existsSync(srcDir)) {
    console.warn('Source templates directory not found:', srcDir);
    return;
  }

  ensureDir(distDir1);
  ensureDir(distDir2);

  const files = fs.readdirSync(srcDir).filter((f) => f.toLowerCase().endsWith('.hbs'));
  for (const f of files) {
    const src = path.join(srcDir, f);
    const d1 = path.join(distDir1, f);
    const d2 = path.join(distDir2, f);
    fs.copyFileSync(src, d1);
    fs.copyFileSync(src, d2);
    console.log(`Copied ${f} -> ${d1}`);
    console.log(`Copied ${f} -> ${d2}`);
  }
  console.log('Email templates copy completed.');
}

if (require.main === module) {
  try {
    copyTemplates();
  } catch (err) {
    console.error('Error copying templates:', err.message || err);
    process.exit(2);
  }
}

module.exports = { copyTemplates };
