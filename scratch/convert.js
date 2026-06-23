// @ts-nocheck
const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Backgrounds
      content = content.replace(/\bbg-white\b/g, 'bg-card');
      content = content.replace(/\bbg-gray-50\/50\b/g, 'bg-background');
      content = content.replace(/\bbg-gray-50\b/g, 'bg-background');
      content = content.replace(/\bbg-gray-100\b/g, 'bg-muted');
      
      // Text colors
      content = content.replace(/\btext-gray-900\b/g, 'text-foreground');
      content = content.replace(/\btext-gray-800\b/g, 'text-foreground');
      content = content.replace(/\btext-gray-700\b/g, 'text-muted-foreground');
      content = content.replace(/\btext-gray-600\b/g, 'text-muted-foreground');
      content = content.replace(/\btext-gray-500\b/g, 'text-muted-foreground');
      
      // Borders
      content = content.replace(/\bborder-gray-100\b/g, 'border-border');
      content = content.replace(/\bborder-gray-200\b/g, 'border-border');
      content = content.replace(/\bborder-gray-300\b/g, 'border-border');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir('src/app/(main)');
console.log('Conversion completed.');
