
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { AppProgress } from '../types';
import { QuizModal } from '../components/QuizModal';
import { Loader2, Book, Copy, Check, FileText, CheckCircle2, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { exportToMarkdown, exportToPDF, generateNotesMarkdown } from '../lib/exportUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

interface SmartNotesProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

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
    return [{ title: 'Notes', content: markdown }];
  }

  return sections;
};

export const SmartNotes: React.FC<SmartNotesProps> = ({ progress, onUpdateProgress, showToast }) => {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'short' | 'detailed' | 'exam-ready'>('detailed');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const isCompleted = !!(progress.completedNotes || {})[topic];

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    showToast(`Generating ${type} notes for ${topic}...`, 'info');
    try {
      const result = await geminiService.generateNotes(topic, type);
      setNotes(result);
      showToast('Notes generated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to generate notes. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    const newCompleted = { ...(progress.completedNotes || {}) };
    newCompleted[topic] = true;
    onUpdateProgress({ 
      completedNotes: newCompleted,
      questionsStudied: (progress.questionsStudied || 0) + 5
    });
    setShowQuiz(false);
    showToast('Topic marked as completed! +5 Questions Studied', 'success');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    showToast('Notes copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Smart Notes Generator</h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Transform complex engineering concepts into clear, structured notes.</p>
      </header>

      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Engineering Topic</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Distributed Systems Architecture"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-base"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {(['short', 'detailed', 'exam-ready'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setType(opt)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all min-h-[36px] ${
                  type === opt 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 min-h-[44px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Book className="w-5 h-5" />}
            Generate Notes
          </button>
        </div>
      </div>

      {notes && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 gap-4">
            <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white text-sm sm:text-base">
              <FileText className="w-5 h-5 text-blue-500 shrink-0" /> Study Notes: {topic}
            </h3>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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
              <div className="flex items-center gap-3">
                <div className="relative group/export">
                  <button className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors min-h-[36px]">
                    <Download className="w-4 h-4" /> Export
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-10">
                    <button 
                      onClick={() => exportToMarkdown(`notes-${topic.replace(/\s+/g, '-').toLowerCase()}`, generateNotesMarkdown(topic, notes))}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Export as Markdown (.md)
                    </button>
                    <button 
                      onClick={() => exportToPDF('notes-container', `notes-${topic.replace(/\s+/g, '-').toLowerCase()}`)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Export as PDF (.pdf)
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors min-h-[36px]"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
          <div id="notes-container" className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900">
            <h2 className="hidden print:block text-2xl font-bold mb-6 text-slate-900 dark:text-white">Study Notes: {topic}</h2>
            
            <div className="space-y-4">
              {parseMarkdownSections(notes).map((section, index) => (
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
          topic={topic} 
          content={notes} 
          onComplete={handleComplete} 
          onClose={() => setShowQuiz(false)} 
        />
      )}
    </div>
  );
};
