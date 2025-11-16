/**
 * Build Standalone HTML
 *
 * Creates a single HTML file with all JS and CSS inlined
 * Perfect for Grist custom widgets (served via raw GitHub URL)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '..', 'dist');
const htmlFile = path.join(distDir, 'index.html');
const standaloneFile = path.join(distDir, 'grist-app-nest.html');

console.log('🔨 Building standalone HTML...');

// Read the built index.html
let html = fs.readFileSync(htmlFile, 'utf-8');

// Store all replacements to do (tag -> marker -> content)
const replacements = [];

// Find all script tags with src
const scriptRegex = /<script[^>]*\ssrc="([^"]*)"[^>]*><\/script>/g;
let match;

while ((match = scriptRegex.exec(html)) !== null) {
  const src = match[1];
  const fullPath = path.join(distDir, src);

  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const marker = `<!--INLINE_SCRIPT_${replacements.length}-->`;
    replacements.push({
      tag: match[0],
      marker: marker,
      replacement: `<script type="module">${content}</script>`
    });
    console.log(`  ✓ Inlined JS: ${src}`);
  }
}

// Find all link tags with rel="stylesheet"
const cssRegex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]*)"[^>]*>/g;

while ((match = cssRegex.exec(html)) !== null) {
  const href = match[1];
  const fullPath = path.join(distDir, href);

  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const marker = `<!--INLINE_STYLE_${replacements.length}-->`;
    replacements.push({
      tag: match[0],
      marker: marker,
      replacement: `<style>${content}</style>`
    });
    console.log(`  ✓ Inlined CSS: ${href}`);
  }
}

// First pass: Replace all tags with markers
// Use function form to avoid special character interpretation
replacements.forEach(({ tag, marker }) => {
  html = html.replace(tag, () => marker);
});

// Second pass: Replace all markers with actual inlined content
// Use function form to avoid special character interpretation ($&, $1, etc.)
replacements.forEach(({ marker, replacement }) => {
  html = html.replace(marker, () => replacement);
});

// Write standalone file
fs.writeFileSync(standaloneFile, html, 'utf-8');

// Also copy to root for raw.githubusercontent.com access
const rootStandaloneFile = path.join(__dirname, '..', 'grist-app-nest.html');
fs.writeFileSync(rootStandaloneFile, html, 'utf-8');

const size = (fs.statSync(standaloneFile).size / 1024).toFixed(2);
console.log(`\n✅ Standalone HTML created!`);
console.log(`   📄 ${standaloneFile}`);
console.log(`   📄 ${rootStandaloneFile}`);
console.log(`   📦 Size: ${size} KB`);
console.log(`\n🌐 GitHub Pages URL:`);
console.log(`   https://nic01asFr.github.io/Grist-App-Nest/grist-app-nest.html`);
console.log(`\n🌐 Raw GitHub URL:`);
console.log(`   https://raw.githubusercontent.com/nic01asFr/Grist-App-Nest/main/grist-app-nest.html`);
