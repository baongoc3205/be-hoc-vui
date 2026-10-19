// Script to check that all i18n keys exist in both 'vi' and 'en' locales
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const viDir = path.join(localesDir, 'vi');
const enDir = path.join(localesDir, 'en');

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

let hasError = false;

const viFiles = fs.readdirSync(viDir).filter(f => f.endsWith('.json'));
const enFiles = fs.readdirSync(enDir).filter(f => f.endsWith('.json'));

// Check for missing namespace files
for (const file of viFiles) {
  if (!enFiles.includes(file)) {
    console.error(`❌ Missing English namespace file: en/${file}`);
    hasError = true;
  }
}
for (const file of enFiles) {
  if (!viFiles.includes(file)) {
    console.error(`❌ Missing Vietnamese namespace file: vi/${file}`);
    hasError = true;
  }
}

// Check key differences inside each matching namespace file
for (const file of viFiles) {
  if (!enFiles.includes(file)) continue;

  const viContent = JSON.parse(fs.readFileSync(path.join(viDir, file), 'utf8'));
  const enContent = JSON.parse(fs.readFileSync(path.join(enDir, file), 'utf8'));

  const viKeys = new Set(getKeys(viContent));
  const enKeys = new Set(getKeys(enContent));

  const missingInEn = [...viKeys].filter(k => !enKeys.has(k));
  const missingInVi = [...enKeys].filter(k => !viKeys.has(k));

  if (missingInEn.length > 0) {
    console.error(`❌ Missing in en/${file}:`);
    missingInEn.forEach(k => console.error(`   - ${k}`));
    hasError = true;
  }
  if (missingInVi.length > 0) {
    console.error(`❌ Missing in vi/${file}:`);
    missingInVi.forEach(k => console.error(`   - ${k}`));
    hasError = true;
  }
}

if (hasError) {
  console.error('\n💥 i18n:check failed: Missing translation keys detected.');
  process.exit(1);
} else {
  console.log('✅ i18n:check passed: All Vietnamese and English keys are 100% synchronized!');
  process.exit(0);
}
