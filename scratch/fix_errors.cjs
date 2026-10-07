const fs = require('fs');
const path = require('path');
const viewsPath = path.join(__dirname, '../src/views');

const files = fs.readdirSync(viewsPath).filter(f => f.endsWith('.tsx'));
files.forEach(f => {
  const filePath = path.join(viewsPath, f);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace catch (error) with catch (error: any)
  content = content.replace(/catch\s*\(\s*error\s*\)\s*\{/g, 'catch (error: any) {');
  
  // Improve showToast with error message
  content = content.replace(/console\.error\((err|error)\);\s*showToast\('([^']+)',\s*'error'\);/g, 
    "console.error($1);\n      showToast($1?.message || '$2', 'error');"
  );
  
  fs.writeFileSync(filePath, content);
});
console.log('Fixed error handling in views');
