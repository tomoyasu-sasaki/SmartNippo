#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Documentation files to check
const docFiles = [
  'README.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  'LICENSE',
  'docs/DEVELOPMENT_GUIDE.md',
  'docs/daily_report_webapp_requirements.md',
  'docs/implementation_plan_checklist.md',
  '.github/pull_request_template.md',
];

console.log('📄 Verifying documentation...\n');

let hasErrors = false;

// Check if all files exist
console.log('1. Checking file existence:');
docFiles.forEach((file) => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) hasErrors = true;
});

// Check for broken internal links
console.log('\n2. Checking internal links:');
const markdownFiles = docFiles.filter((f) => f.endsWith('.md'));
const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

markdownFiles.forEach((file) => {
  const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const matches = [...content.matchAll(linkPattern)];

  matches.forEach((match) => {
    const linkText = match[1];
    const linkPath = match[2];

    // Skip external links and anchors
    if (linkPath.startsWith('http') || linkPath.startsWith('#')) return;

    // Check relative file links
    if (linkPath.endsWith('.md') || linkPath === 'LICENSE') {
      const resolvedPath = path.join(path.dirname(file), linkPath);
      const exists = fs.existsSync(path.join(__dirname, '..', resolvedPath));

      if (!exists) {
        console.log(`   ❌ Broken link in ${file}: [${linkText}](${linkPath})`);
        hasErrors = true;
      }
    }
  });
});

// Check for common terms consistency
console.log('\n3. Checking terminology consistency:');
const terms = {
  SmartNippo: ['smartnippo', 'Smart Nippo', 'smart-nippo'],
  Convex: ['convex'],
  TypeScript: ['typescript', 'Typescript'],
  'Next.js': ['NextJS', 'nextjs', 'Next JS'],
};

markdownFiles.forEach((file) => {
  const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

  Object.entries(terms).forEach(([correct, variants]) => {
    variants.forEach((variant) => {
      const regex = new RegExp(`\\b${variant}\\b`, 'gi');
      if (regex.test(content) && !new RegExp(`\\b${correct}\\b`, 'g').test(content)) {
        console.log(`   ⚠️  Inconsistent term in ${file}: "${variant}" should be "${correct}"`);
      }
    });
  });
});

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Documentation verification failed!');
  process.exit(1);
} else {
  console.log('✅ Documentation verification passed!');
}
