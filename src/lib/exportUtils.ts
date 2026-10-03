
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

  // Dynamically import html2pdf to avoid SSR issues if any
  const html2pdf = (await import('html2pdf.js')).default;

  const opt = {
    margin:       10,
    filename:     `${filename}.pdf`,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
  };

  // Expand all collapsible sections before exporting
  const buttons = element.querySelectorAll('button');
  const originalStates: boolean[] = [];
  
  buttons.forEach((btn, index) => {
    // Check if it's a collapsible section button (has ChevronDown/Right)
    if (btn.querySelector('svg.lucide-chevron-down') || btn.querySelector('svg.lucide-chevron-right')) {
      const isClosed = !!btn.querySelector('svg.lucide-chevron-right');
      originalStates[index] = isClosed;
      if (isClosed) {
        btn.click(); // Open it
      }
    }
  });

  // Wait for React to render the expanded sections
  await new Promise(resolve => setTimeout(resolve, 300));

  await html2pdf().set(opt).from(element).save();

  // Restore original states
  buttons.forEach((btn, index) => {
    if (originalStates[index]) {
      btn.click(); // Close it back
    }
  });
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
