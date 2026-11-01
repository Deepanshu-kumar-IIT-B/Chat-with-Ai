const fs = require('fs');
const path = require('path');

const replacements = {
  // Slate to Zinc
  'slate': 'zinc',
  // Indigo to Rose
  'indigo': 'rose',
  // Custom intro colors
  '#6D5DFE': '#E11D48', // rose-600
  '#00E5FF': '#FBBF24', // amber-400
  '#FF4D9D': '#BE123C', // rose-700
  '#4F8CFF': '#F59E0B', // amber-500
  '#111827': '#18181B', // zinc-900
  '#090B16': '#09090B', // zinc-950
  
  // Emerald for online status
  'emerald': 'emerald' // keep emerald
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');

files.forEach(file => {
  if(file.includes('node_modules')) return;
  if(file.includes('dist')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  for (const [key, value] of Object.entries(replacements)) {
    // Basic replaceAll for hex codes
    if (key.startsWith('#')) {
      content = content.split(key).join(value);
      content = content.split(key.toLowerCase()).join(value.toLowerCase());
    } else {
      // For color names, we want to replace whole words like "slate-900" or "text-slate"
      // Using regex
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      content = content.replace(regex, value);
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
