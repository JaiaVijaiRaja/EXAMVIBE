
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { AppProgress } from '../types';
import { QuizModal } from '../components/QuizModal';
import { Loader2, AlertTriangle, ListChecks, HelpCircle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
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
    return [{ title: 'Predictions', content: markdown }];
  }

  return sections;
};

interface PredictorProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Predictor: React.FC<PredictorProps> = ({ progress, onUpdateProgress, showToast }) => {
  const [subject, setSubject] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);

  const isCompleted = !!(progress.completedPredictions || {})[subject];

  const handlePredict = async () => {
    if (!subject || !syllabus) return;
    setLoading(true);
    showToast(`Analyzing syllabus for ${subject}...`, 'info');
    try {
      const result = await geminiService.predictQuestions(subject, syllabus);
      setPredictions(result);
      showToast('Exam predictions generated!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to generate predictions. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    const newCompleted = { ...(progress.completedPredictions || {}) };
    newCompleted[subject] = true;
    onUpdateProgress({ 
      completedPredictions: newCompleted,
      questionsStudied: (progress.questionsStudied || 0) + 5
    });
    setShowQuiz(false);
    showToast('Topic marked as completed! +5 Questions Studied', 'success');
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Exam Question Predictor</h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">AI analysis of your syllabus to pinpoint high-probability exam topics.</p>
      </header>

      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Subject</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Signal Processing"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Syllabus Snippet (or key topics)</label>
            <textarea 
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              placeholder="Paste the key modules or chapters from your syllabus..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none text-base"
            />
          </div>
          <button 
            onClick={handlePredict}
            disabled={loading || !subject || !syllabus}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20 min-h-[44px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
            Analyze Patterns & Predict
          </button>
        </div>
      </div>

      {predictions && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-amber-100 dark:border-amber-900/30 shadow-xl overflow-hidden animate-fadeIn">
          <div className="bg-amber-50 dark:bg-amber-900/20 px-5 sm:px-8 py-4 sm:py-6 border-b border-amber-100 dark:border-amber-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-amber-800 dark:text-amber-400">
              <HelpCircle className="w-6 h-6 shrink-0" /> Likely Questions for {subject}
            </h3>
            <div className="flex items-center justify-between sm:justify-end gap-4">
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
              <span className="px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-full text-[10px] font-black uppercase tracking-wider">AI Forecast</span>
            </div>
          </div>
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900">
            <div className="space-y-4">
              {parseMarkdownSections(predictions).map((section, index) => (
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
          topic={`Exam Prediction: ${subject}`} 
          content={predictions} 
          onComplete={handleComplete} 
          onClose={() => setShowQuiz(false)} 
        />
      )}

      <div className="flex items-start gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 text-sm italic">
        <ListChecks className="w-5 h-5 shrink-0 mt-1" />
        Note: Predictions are based on syllabus structure and common engineering education patterns. Use this as a supplemental study guide alongside thorough preparation.
      </div>
    </div>
  );
};
