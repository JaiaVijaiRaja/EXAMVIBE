
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToMarkdown = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: window.getComputedStyle(document.body).backgroundColor === 'rgb(15, 23, 42)' ? '#0f172a' : '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(`${filename}.pdf`);
};

export const generateNotesMarkdown = (topic: string, notes: string) => {
  return `# Study Notes: ${topic}\n\n${notes}`;
};

export const generateFlashcardsMarkdown = (topics: string[], flashcards: { question: string, answer: string }[]) => {
  let md = `# Flashcards: ${topics.join(', ')}\n\n`;
  flashcards.forEach((card, i) => {
    md += `## Card ${i + 1}\n**Question:** ${card.question}\n**Answer:** ${card.answer}\n\n---\n\n`;
  });
  return md;
};

export const generateStudyPlanMarkdown = (subjects: string, examDate: string, plan: { day: string, tasks: string[] }[]) => {
  let md = `# Study Plan\n\n**Subjects:** ${subjects}\n**Exam Date:** ${examDate}\n\n`;
  plan.forEach(day => {
    md += `### ${day.day}\n`;
    day.tasks.forEach(task => {
      md += `- [ ] ${task}\n`;
    });
    md += `\n`;
  });
  return md;
};
