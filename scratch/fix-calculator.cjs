const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/views/Calculator.tsx');

let content = fs.readFileSync(file, 'utf8');

const replacements = [
  {
    regex: /text-slate-200/g,
    replacement: 'text-slate-900 dark:text-slate-200'
  },
  {
    regex: /text-white flex items-center/g,
    replacement: 'text-slate-900 dark:text-white flex items-center'
  },
  {
    regex: /text-slate-400/g,
    replacement: 'text-slate-600 dark:text-slate-400'
  },
  {
    regex: /bg-\[#111111\] border border-slate-800/g,
    replacement: 'bg-white dark:bg-white/5 dark:backdrop-blur-md border border-slate-200 dark:border-white/10'
  },
  {
    regex: /text-white/g,
    replacement: 'text-slate-900 dark:text-white'
  },
  {
    regex: /text-slate-900 dark:text-slate-900 dark:text-white/g,
    replacement: 'text-slate-900 dark:text-white' // fixing duplicate
  },
  {
    regex: /bg-\[#1a1a1a\] border border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white/g,
    replacement: 'bg-slate-50 dark:bg-black/20 dark:backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white'
  },
  {
    regex: /bg-\[#1a1a1a\] border-slate-700/g,
    replacement: 'bg-slate-50 dark:bg-black/20 dark:backdrop-blur-md border-slate-200 dark:border-white/10'
  },
  {
    regex: /text-slate-500 hover:text-red-400/g,
    replacement: 'text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400'
  }
];

for (const { regex, replacement } of replacements) {
  content = content.replace(regex, replacement);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed Calculator.tsx');
