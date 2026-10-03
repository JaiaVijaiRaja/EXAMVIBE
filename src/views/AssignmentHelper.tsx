
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { AppProgress } from '../types';
import { QuizModal } from '../components/QuizModal';
import { Loader2, Send, Lightbulb, FileSearch, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// Helper component for collapsible sections
const CollapsibleSection = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-6 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-l-4 border-l-blue-500"
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">{title}</h2>
        {isOpen ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
      </button>
      {isOpen && (
        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
};

// Helper function to parse markdown into sections based on ## headings
const parseMarkdownSections = (markdown: string) => {
  // Unescape common markdown symbols that might be escaped by AI
  const cleanMarkdown = markdown.replace(/\\\*/g, '*').replace(/\\\$/g, '$');
  const lines = cleanMarkdown.split('\n');
  const sections: { title: string; content: string }[] = [];
  let currentTitle = '';
  let currentContent: string[] = [];

  // Find the first ## to start the first section
  let i = 0;
  while (i < lines.length && !lines[i].startsWith('## ')) {
    currentContent.push(lines[i]);
    i++;
  }

  // Only add Overview if it has non-empty content
  if (currentContent.some(line => line.trim() !== '')) {
    sections.push({ title: 'Overview', content: currentContent.join('\n') });
  }

  currentContent = [];

  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.join('\n') });
      }
      currentTitle = line.replace('## ', '').trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentContent.join('\n') });
  }

  // If no sections were found (e.g., AI didn't follow format), return a single section
  if (sections.length === 0) {
    return [{ title: 'Solution', content: markdown }];
  }

  return sections;
};

interface AssignmentHelperProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AssignmentHelper: React.FC<AssignmentHelperProps> = ({ progress, onUpdateProgress, showToast }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);

  const questionKey = question.substring(0, 50);
  const isCompleted = !!(progress.completedAssignments || {})[questionKey];

  const handleSolve = async () => {
    if (!question) return;
    setLoading(true);
    showToast('Analyzing and solving your problem...', 'info');
    try {
      const result = await geminiService.solveAssignment(question);
      setSolution(result);
      showToast('Solution generated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to solve the assignment. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    const newCompleted = { ...(progress.completedAssignments || {}) };
    newCompleted[questionKey] = true;
    onUpdateProgress({ 
      completedAssignments: newCompleted,
      questionsStudied: (progress.questionsStudied || 0) + 5
    });
    setShowQuiz(false);
    showToast('Assignment marked as completed! +5 Questions Studied', 'success');
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Assignment Helper</h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Get structured, conceptual answers for your engineering problems.</p>
      </header>

      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn">
        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Paste your question below</label>
          <textarea 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Derive the Euler's equation of motion..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-base"
          />
          <div className="flex justify-end">
            <button 
              onClick={handleSolve}
              disabled={loading || !question}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 min-h-[44px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Analyze & Solve
            </button>
          </div>
        </div>
      </div>

      {solution && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fadeIn">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 px-5 py-4 border-b border-indigo-100 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm sm:text-base">Structured Answer</h3>
            </div>
            <button 
              onClick={() => !isCompleted && setShowQuiz(true)}
              disabled={isCompleted}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                isCompleted 
                  ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                  : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600 shadow-sm'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : ''}`} />
              {isCompleted ? 'Completed' : 'Mark as Completed'}
            </button>
          </div>
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900">
            <div className="space-y-4">
              {parseMarkdownSections(solution).map((section, index) => (
                <CollapsibleSection key={index} title={section.title}>
                  <div className="prose prose-blue dark:prose-invert max-w-none dark:text-slate-200
                    prose-headings:text-slate-900 dark:prose-headings:text-blue-400
                    prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6
                    prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-slate-700 dark:prose-p:text-slate-200 prose-p:leading-relaxed
                    prose-strong:text-blue-600 dark:prose-strong:text-blue-400 prose-strong:font-bold
                    prose-ul:list-none prose-ul:pl-0
                    prose-li:relative prose-li:pl-6 prose-li:mb-2 dark:prose-li:text-slate-200
                    prose-li:before:content-[''] prose-li:before:absolute prose-li:before:left-1.5 prose-li:before:top-2.5 prose-li:before:w-1.5 prose-li:before:h-1.5 prose-li:before:bg-blue-500 prose-li:before:rounded-full
                    prose-hr:border-slate-200 dark:prose-hr:border-slate-700
                    prose-table:w-full prose-table:border-collapse
                    prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-slate-200 dark:prose-th:border-slate-700
                    prose-td:p-3 prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-700
                  ">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                </CollapsibleSection>
              ))}
            </div>
          </div>
        </div>
      )}

      {showQuiz && (
        <QuizModal 
          topic="Assignment Solution" 
          content={solution} 
          onComplete={handleComplete} 
          onClose={() => setShowQuiz(false)} 
        />
      )}

      {!solution && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 backdrop-blur-md bg-indigo-50/60 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm transition-all hover:shadow-md">
            <h4 className="text-lg font-bold mb-3 flex items-center gap-3 text-indigo-800 dark:text-indigo-300">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg">
                <FileSearch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Multi-Step Solutions
            </h4>
            <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 font-medium leading-relaxed">
              The AI provides logically ordered explanations instead of just answers.
            </p>
          </div>
          <div className="p-6 backdrop-blur-md bg-emerald-50/60 dark:bg-emerald-900/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm transition-all hover:shadow-md">
            <h4 className="text-lg font-bold mb-3 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-lg">
                <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Concept Clarification
            </h4>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80 font-medium leading-relaxed">
              Includes definitions for jargon and complex terminology used in the answer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
