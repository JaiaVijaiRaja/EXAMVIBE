
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { AppProgress } from '../types';
import { QuizModal } from '../components/QuizModal';
import { Loader2, Send, Lightbulb, FileSearch, CheckCircle2 } from 'lucide-react';

interface AssignmentHelperProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
}

export const AssignmentHelper: React.FC<AssignmentHelperProps> = ({ progress, onUpdateProgress }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);

  const questionKey = question.substring(0, 50);
  const isCompleted = !!(progress.completedAssignments || {})[questionKey];

  const handleSolve = async () => {
    if (!question) return;
    setLoading(true);
    try {
      const result = await geminiService.solveAssignment(question);
      setSolution(result);
    } catch (error) {
      console.error(error);
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
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Assignment Helper</h2>
        <p className="text-slate-600 dark:text-slate-400">Get structured, conceptual answers for your engineering problems.</p>
      </header>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Paste your question below</label>
          <textarea 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Derive the Euler's equation of motion for a fluid flow and explain each term."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
          <div className="flex justify-end">
            <button 
              onClick={handleSolve}
              disabled={loading || !question}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Analyze & Solve
            </button>
          </div>
        </div>
      </div>

      {solution && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-slideUp">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-4 border-b border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Structured Answer</h3>
            </div>
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
          </div>
          <div className="p-8 prose prose-indigo dark:prose-invert max-w-none">
             {solution.split('\n').map((line, i) => (
                <p key={i} className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {line}
                </p>
              ))}
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
