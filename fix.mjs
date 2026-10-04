import fs from 'fs';

const file = 'src/views/SkillRoadmap.tsx';
let content = fs.readFileSync(file, 'utf-8');

// The write_to_file tool stripped backticks around template literals. We need to add them back.

content = content.replace(
  /\(progress\.completedRoadmapWeeks \|\| \{\}\)\[\$\{rm\.skill\}-\$\{item\.week\}\]/g,
  '(progress.completedRoadmapWeeks || {})[`${rm.skill}-${item.week}`]'
);

content = content.replace(
  /\(progress\.completedRoadmapWeeks \|\| \{\}\)\[\$\{viewingRoadmap\.skill\}-\$\{item\.week\}\]/g,
  '(progress.completedRoadmapWeeks || {})[`${viewingRoadmap.skill}-${item.week}`]'
);

content = content.replace(
  /className=\{([^`\{]*\$\{[^\}]*\}[^`\}]*)\}/g,
  'className={`$1`}'
);

content = content.replace(
  /style=\{\{\s*width:\s*\$\{progressPct\}%\s*\}\}/g,
  'style={{ width: \\`${progressPct}%\\` }}'
);

content = content.replace(
  /topic=\{Week \$\{activeQuiz\.week\}: \$\{activeQuiz\.topic\}\}/g,
  'topic={`Week ${activeQuiz.week}: ${activeQuiz.topic}`}'
);

fs.writeFileSync(file, content);
console.log("Fixed backticks in SkillRoadmap.tsx");
