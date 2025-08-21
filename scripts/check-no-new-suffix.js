const { execSync } = require('child_process');
try {
  const out = execSync("git ls-files '**/*.new.ts' || true", { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  if (out) {
    console.error('Found .new.ts files:\n' + out);
    process.exit(1);
  } else {
    console.log('No .new.ts files found');
    process.exit(0);
  }
} catch (err) {
  console.error('Error running git ls-files:', err.message);
  process.exit(1);
}
