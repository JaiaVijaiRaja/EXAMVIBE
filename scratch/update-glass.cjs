const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, '../src/views');

const replacements = [
  {
    regex: /bg-white dark:bg-slate-800/g,
    replacement: 'bg-white dark:bg-white/5 dark:backdrop-blur-md'
  },
  {
    regex: /border-slate-200 dark:border-slate-700/g,
    replacement: 'border-slate-200 dark:border-white/10'
  },
  {
    regex: /bg-slate-50 dark:bg-slate-800/g,
    replacement: 'bg-slate-50 dark:bg-white/5 dark:backdrop-blur-md'
  },
  {
    regex: /bg-white dark:bg-slate-700/g,
    replacement: 'bg-white dark:bg-black/20 dark:backdrop-blur-md'
  },
  {
    regex: /border-slate-200 dark:border-slate-600/g,
    replacement: 'border-slate-200 dark:border-white/10'
  },
  {
    regex: /bg-slate-100 dark:bg-slate-800/g,
    replacement: 'bg-slate-100 dark:bg-white/5 dark:backdrop-blur-md'
  },
  {
    regex: /bg-slate-900 dark:bg-slate-800/g,
    replacement: 'bg-slate-900 dark:bg-black/40 dark:backdrop-blur-md'
  },
  {
    regex: /border-slate-100 dark:border-slate-700/g,
    replacement: 'border-slate-100 dark:border-white/10'
  }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  }
}

processDirectory(viewsDir);
console.log('Done!');
