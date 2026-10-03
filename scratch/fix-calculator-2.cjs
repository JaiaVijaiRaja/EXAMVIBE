const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/views/Calculator.tsx');

let content = fs.readFileSync(file, 'utf8');

const replacements = [
  // Fix button text colors that were incorrectly replaced
  {
    regex: /text-slate-900 dark:text-white font-bold py-4 px-8/g,
    replacement: 'text-white font-bold py-4 px-8'
  },
  {
    regex: /bg-\[#222\] border border-slate-700/g,
    replacement: 'bg-white dark:bg-black/20 dark:backdrop-blur-md border border-slate-200 dark:border-white/10'
  },
  {
    regex: /bg-\[#1a1a1a\] border border-slate-700/g,
    replacement: 'bg-white dark:bg-black/20 dark:backdrop-blur-md border border-slate-200 dark:border-white/10'
  },
  {
    regex: /border-t border-slate-800/g,
    replacement: 'border-t border-slate-200 dark:border-white/10'
  },
  {
    regex: /bg-transparent border-none text-slate-900 dark:text-white/g,
    replacement: 'bg-transparent border-none text-slate-900 dark:text-white' // Actually this is fine
  },
  {
    regex: /text-slate-900 dark:text-slate-200/g, // Top level wrapper text color
    replacement: 'text-slate-900 dark:text-slate-200' // this is fine
  }
];

for (const { regex, replacement } of replacements) {
  content = content.replace(regex, replacement);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed Calculator.tsx again');
