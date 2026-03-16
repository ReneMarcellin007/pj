const fs = require('fs');
const path = require('path');

function minifyCSS(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove newlines
    .replace(/\n/g, '')
    // Remove carriage returns
    .replace(/\r/g, '')
    // Remove spaces around { } : ; ,
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*,\s*/g, ',')
    // Remove last semicolon before }
    .replace(/;}/g, '}')
    // Collapse multiple spaces
    .replace(/\s{2,}/g, ' ')
    // Trim
    .trim();
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  if (!styleMatch) {
    console.log(`No <style> found in ${filePath}`);
    return;
  }
  const original = styleMatch[1];
  const minified = minifyCSS(original);
  html = html.replace(styleMatch[0], `<style>${minified}</style>`);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`${path.basename(path.dirname(filePath))}/${path.basename(filePath)}: ${original.length} → ${minified.length} chars (${((1 - minified.length/original.length)*100).toFixed(0)}% reduced)`);
}

const root = path.join(__dirname, '..');
processFile(path.join(root, 'public', 'index.html'));
processFile(path.join(root, 'public', 'fr', 'index.html'));
