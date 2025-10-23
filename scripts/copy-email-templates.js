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

  const srcDir2 = path.join(process.cwd(), 'src', 'Modules', 'Core', 'non-conformities', 'templates');
  const distDir3 = path.join(process.cwd(), 'dist', 'Modules', 'Core', 'non-conformities', 'templates');
  const distDir4 = path.join(process.cwd(), 'dist', 'src', 'Modules', 'Core', 'non-conformities', 'templates');
  console.log('Copying email templates from', srcDir);

  if (!fs.existsSync(srcDir)) {
    console.warn('Source templates directory not found:', srcDir);
    return;
  }

  ensureDir(distDir1);
  ensureDir(distDir2);
  ensureDir(distDir3);
  ensureDir(distDir4);

  const files = fs.readdirSync(srcDir).filter((f) => f.toLowerCase().endsWith('.hbs'));
  const files2 = fs.readdirSync(srcDir2).filter((f) => f.toLowerCase().endsWith('.html'));
  for (const f of files) {
    const src = path.join(srcDir, f);
    const d1 = path.join(distDir1, f);
    const d2 = path.join(distDir2, f);
    fs.copyFileSync(src, d1);
    fs.copyFileSync(src, d2);
    console.log(`Copied ${f} -> ${d1}`);
    console.log(`Copied ${f} -> ${d2}`);
  }
  for (const f of files2) {
    const src = path.join(srcDir2, f);
    const d3 = path.join(distDir3, f);
    const d4 = path.join(distDir4, f);
    fs.copyFileSync(src, d3);
    fs.copyFileSync(src, d4);
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
