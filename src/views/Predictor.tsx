
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { AppProgress } from '../types';
import { QuizModal } from '../components/QuizModal';
import { Loader2, AlertTriangle, ListChecks, HelpCircle, CheckCircle2 } from 'lucide-react';

interface PredictorProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
}

export const Predictor: React.FC<PredictorProps> = ({ progress, onUpdateProgress }) => {
  const [subject, setSubject] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);

  const isCompleted = !!(progress.completedPredictions || {})[subject];

  const handlePredict = async () => {
    if (!subject || !syllabus) return;
    setLoading(true);
    try {
      const result = await geminiService.predictQuestions(subject, syllabus);
      setPredictions(result);
    } catch (error) {
      console.error(error);
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
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Exam Question Predictor</h2>
        <p className="text-slate-600 dark:text-slate-400">AI analysis of your syllabus to pinpoint high-probability exam topics.</p>
      </header>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Signal Processing"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Syllabus Snippet (or key topics)</label>
            <textarea 
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              placeholder="Paste the key modules or chapters from your syllabus..."
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
            />
          </div>
          <button 
            onClick={handlePredict}
            disabled={loading || !subject || !syllabus}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
            Analyze Patterns & Predict
          </button>
        </div>
      </div>

      {predictions && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-amber-100 dark:border-amber-900/30 shadow-xl overflow-hidden animate-slideUp">
          <div className="bg-amber-50 dark:bg-amber-900/20 px-8 py-6 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-3 text-amber-800 dark:text-amber-400">
              <HelpCircle className="w-6 h-6" /> Likely Questions for {subject}
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
              <span className="px-3 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-full text-xs font-bold uppercase">AI Forecast</span>
            </div>
          </div>
          <div className="p-8 prose prose-amber dark:prose-invert max-w-none">
            {predictions.split('\n').map((line, i) => (
                <p key={i} className="mb-2 text-slate-700 dark:text-slate-300">
                  {line}
                </p>
              ))}
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
