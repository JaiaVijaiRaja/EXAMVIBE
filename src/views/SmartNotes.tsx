
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { AppProgress } from '../types';
import { QuizModal } from '../components/QuizModal';
import { Loader2, Book, Copy, Check, FileText, CheckCircle2, Download } from 'lucide-react';
import { exportToMarkdown, exportToPDF, generateNotesMarkdown } from '../lib/exportUtils';

interface SmartNotesProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
}

export const SmartNotes: React.FC<SmartNotesProps> = ({ progress, onUpdateProgress }) => {
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
    try {
      const result = await geminiService.generateNotes(topic, type);
      setNotes(result);
    } catch (error) {
      console.error(error);
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
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Smart Notes Generator</h2>
        <p className="text-slate-600 dark:text-slate-400">Transform complex engineering concepts into clear, structured notes.</p>
      </header>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Engineering Topic</label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Distributed Systems Architecture, Schrodinger Equation"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            {(['short', 'detailed', 'exam-ready'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setType(opt)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
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
            className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Book className="w-5 h-5" />}
            Generate Notes
          </button>
        </div>
      </div>

      {notes && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
            <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="w-5 h-5 text-blue-500" /> Study Notes: {topic}
            </h3>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => !isCompleted && setShowQuiz(true)}
                disabled={isCompleted}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  isCompleted 
                    ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                    : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : ''}`} />
                {isCompleted ? 'Completed' : 'Mark as Completed'}
              </button>
              <div className="relative group/export">
                <button className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
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
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div id="notes-container" className="p-8 prose prose-slate dark:prose-invert max-w-none bg-white dark:bg-slate-800">
            <h2 className="hidden print:block text-2xl font-bold mb-6">Study Notes: {topic}</h2>
            {notes.split('\n').map((line, i) => (
              <p key={i} className="mb-2 text-slate-700 dark:text-slate-300">
                {line}
              </p>
            ))}
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
