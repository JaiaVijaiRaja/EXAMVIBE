
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { StudyTask, AppProgress } from '../types';
import { Loader2, Calendar, Sparkles, CheckSquare, Square, RefreshCw, Download } from 'lucide-react';
import { exportToMarkdown, exportToPDF, generateStudyPlanMarkdown } from '../lib/exportUtils';

interface StudyPlannerProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({ progress, onUpdateProgress }) => {
  const [subjects, setSubjects] = useState('');
  const [examDate, setExamDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<StudyTask[]>([]);

  // Load saved planner on mount or progress change, handle isolation by clearing if undefined
  useEffect(() => {
    if (progress.savedPlanner) {
      setPlan(progress.savedPlanner.items);
      setSubjects(progress.savedPlanner.subjects);
      setExamDate(progress.savedPlanner.examDate);
    } else {
      setPlan([]);
      setSubjects('');
      setExamDate('');
    }
  }, [progress.savedPlanner]);

  const handleGenerate = async () => {
    if (!subjects || !examDate) return;
    setLoading(true);
    try {
      const subjectArray = subjects.split(',').map(s => s.trim());
      const result = await geminiService.generateStudyPlan(subjectArray, examDate);
      setPlan(result);
      // Save full plan context to progress
      onUpdateProgress({
        savedPlanner: {
          subjects,
          examDate,
          items: result
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (day: string, taskIdx: number) => {
    const key = `${day}-${taskIdx}`;
    const newCompleted = { ...progress.completedTasks };
    if (newCompleted[key]) {
      delete newCompleted[key];
    } else {
      newCompleted[key] = true;
    }
    onUpdateProgress({ completedTasks: newCompleted });
  };

  const clearPlan = () => {
    onUpdateProgress({ savedPlanner: undefined, completedTasks: {} });
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">AI Study Planner</h2>
          <p className="text-slate-600 dark:text-slate-400">Personalized engineering study schedules in seconds.</p>
        </div>
        {plan.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative group/export">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-10">
                <button 
                  onClick={() => exportToMarkdown(`study-plan-${subjects.replace(/\s+/g, '-').toLowerCase()}`, generateStudyPlanMarkdown(subjects, examDate, plan))}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Export as Markdown (.md)
                </button>
                <button 
                  onClick={() => exportToPDF('planner-pdf', `study-plan-${subjects.replace(/\s+/g, '-').toLowerCase()}`)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Export as PDF (.pdf)
                </button>
              </div>
            </div>
            <button 
              onClick={clearPlan}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Generate New Plan
            </button>
          </div>
        )}
      </header>

      {plan.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subjects (comma separated)</label>
              <textarea 
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="e.g. Fluid Mechanics, Strength of Materials, Digital Electronics"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Exam Date</label>
                <input 
                  type="date" 
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button 
                onClick={handleGenerate}
                disabled={loading || !subjects || !examDate}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate Optimized Plan
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div id="planner-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {plan.map((day, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 font-bold">
                <Calendar className="w-5 h-5" />
                {day.day}
              </div>
              <ul className="space-y-3">
                {day.tasks.map((task, tidx) => {
                  const isDone = !!progress.completedTasks[`${day.day}-${tidx}`];
                  return (
                    <li 
                      key={tidx} 
                      onClick={() => toggleTask(day.day, tidx)}
                      className={`flex gap-3 text-sm p-2 rounded-lg cursor-pointer transition-colors ${
                        isDone ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {isDone ? <CheckSquare className="w-4 h-4 shrink-0" /> : <Square className="w-4 h-4 shrink-0" />}
                      <span className={isDone ? 'line-through opacity-70' : ''}>{task}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          </div>

          {/* Hidden list for PDF export */}
          <div id="planner-pdf" className="sr-only-export p-8 bg-white dark:bg-slate-800">
            <h2 className="text-2xl font-bold mb-4">AI Study Plan</h2>
            <p className="text-slate-600 mb-8">Subjects: {subjects} | Exam Date: {examDate}</p>
            <div className="space-y-8">
              {plan.map((day, idx) => (
                <div key={idx} className="pb-6 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-blue-600 mb-4">{day.day}</h3>
                  <ul className="space-y-2">
                    {day.tasks.map((task, tidx) => (
                      <li key={tidx} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <span className="w-4 h-4 border border-slate-300 rounded flex-shrink-0 mt-0.5"></span>
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
