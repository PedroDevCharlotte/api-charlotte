// Simple test to verify email template resolution logic
const path = require('path');
const fs = require('fs');

const candidates = [
  path.join(__dirname, '..', 'src', 'Modules', 'Core', 'email', 'templates', 'ticket-cancelled.hbs'),
  path.join(process.cwd(), 'dist', 'src', 'Modules', 'Core', 'email', 'templates', 'ticket-cancelled.hbs'),
  path.join(process.cwd(), 'src', 'Modules', 'Core', 'email', 'templates', 'ticket-cancelled.hbs'),
  path.join(process.cwd(), 'dist', 'Modules', 'Core', 'email', 'templates', 'ticket-cancelled.hbs'),
  path.join(process.cwd(), 'src', 'modules', 'core', 'email', 'templates', 'ticket-cancelled.hbs'),
];

console.log('Checking candidate paths for ticket-cancelled.hbs');
for (const c of candidates) {
  try {
    console.log(c, fs.existsSync(c));
  } catch (err) {
    console.log('error checking', c, err.message || err);
  }
}

// Try to read the first existing candidate
const found = candidates.find((c) => fs.existsSync(c));
if (found) {
  console.log('Found template at:', found);
  const raw = fs.readFileSync(found, 'utf8');
  console.log('First 200 chars:\n', raw.substring(0, 200));
} else {
  console.error('Template not found in any candidate');
  process.exit(2);
}
