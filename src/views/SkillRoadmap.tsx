
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { RoadmapItem, AppProgress } from '../types';
import { QuizModal } from '../components/QuizModal';
import { Loader2, Target, Link, ExternalLink, Box, CheckCircle2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

interface SkillRoadmapProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SkillRoadmap: React.FC<SkillRoadmapProps> = ({ progress, onUpdateProgress, showToast }) => {
  const [skill, setSkill] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<{ week: number, topic: string, content: string } | null>(null);

  // Load saved roadmap on mount or progress change, handle isolation by clearing if undefined
  useEffect(() => {
    if (progress.savedRoadmap) {
      setRoadmap(progress.savedRoadmap.items);
      setSkill(progress.savedRoadmap.skill);
      setLevel(progress.savedRoadmap.level);
      setGoal(progress.savedRoadmap.goal);
    } else {
      setRoadmap([]);
      setSkill('');
      setLevel('Beginner');
      setGoal('');
    }
  }, [progress.savedRoadmap]);

  const handleGenerate = async () => {
    if (!skill || !goal) return;
    setLoading(true);
    showToast(`Generating weekly roadmap for ${skill}...`, 'info');
    try {
      const result = await geminiService.generateRoadmap(skill, level, goal);
      setRoadmap(result);
      // Save the generated roadmap with full context to progress
      onUpdateProgress({
        savedRoadmap: {
          skill,
          level,
          goal,
          items: result
        }
      });
      showToast('Roadmap generated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to generate roadmap. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClick = (item: RoadmapItem) => {
    const key = `${skill}-${item.week}`;
    const isDone = !!(progress.completedRoadmapWeeks || {})[key];
    
    if (isDone) {
      // Allow unchecking without quiz
      const newCompleted = { ...(progress.completedRoadmapWeeks || {}) };
      delete newCompleted[key];
      onUpdateProgress({ 
        completedRoadmapWeeks: newCompleted,
        questionsStudied: Math.max(0, (progress.questionsStudied || 0) - 10)
      });
      showToast('Week marked as incomplete.', 'info');
    } else {
      // Trigger quiz for completion
      setActiveQuiz({
        week: item.week,
        topic: item.topic,
        content: `${item.description}\nProject: ${item.project}`
      });
    }
  };

  const handleQuizComplete = () => {
    if (!activeQuiz) return;
    const key = `${skill}-${activeQuiz.week}`;
    const newCompleted = { ...(progress.completedRoadmapWeeks || {}) };
    newCompleted[key] = true;
    onUpdateProgress({ 
      completedRoadmapWeeks: newCompleted,
      questionsStudied: (progress.questionsStudied || 0) + 10
    });
    setActiveQuiz(null);
    showToast('Week completed! +10 Questions Studied', 'success');
  };

  const clearRoadmap = () => {
    onUpdateProgress({ savedRoadmap: undefined });
    showToast('Roadmap reset. You can now start a new one.', 'info');
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Skill Development Roadmap</h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Map out your path to mastering high-demand engineering skills.</p>
        </div>
        {roadmap.length > 0 && (
          <button 
            onClick={clearRoadmap}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors bg-slate-100 dark:bg-slate-800 rounded-lg min-h-[40px]"
          >
            <RefreshCw className="w-4 h-4" /> Reset Roadmap
          </button>
        )}
      </header>

      {roadmap.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div className="md:col-span-1">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Target Skill</label>
              <input 
                type="text" 
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g. AWS Cloud, React, FPGA"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-base min-h-[44px]"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Current Level</label>
              <select 
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-base min-h-[44px] appearance-none"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ultimate Goal</label>
              <input 
                type="text" 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Land a job, Build a drone"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-base min-h-[44px]"
              />
            </div>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading || !skill || !goal}
            className="mt-8 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 min-h-[48px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
            Generate Weekly Roadmap
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4 p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Active Roadmap: {skill}</h3>
              <p className="text-xs text-slate-500 font-medium">Track your weekly milestones below</p>
            </div>
          </div>
          
          {roadmap.map((item) => {
            const isDone = !!(progress.completedRoadmapWeeks || {})[`${skill}-${item.week}`];
            return (
              <div 
                key={item.week} 
                className={`group relative bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden shadow-sm flex flex-col md:flex-row transition-all ${isDone ? 'border-emerald-500/50 opacity-80' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <div 
                  onClick={() => handleToggleClick(item)}
                  className={`md:w-32 p-6 flex flex-row md:flex-col items-center justify-between md:justify-center border-b md:border-b-0 md:border-r transition-colors cursor-pointer min-h-[60px] ${isDone ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Week</span>
                    <span className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-300">{item.week}</span>
                  </div>
                  {isDone ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <div className="w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-600 md:mt-2" />
                  )}
                </div>
                <div className="flex-1 p-5 sm:p-6 space-y-5">
                  <div className="flex justify-between items-start">
                    <div className="w-full">
                      <h3 className={`text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight ${isDone ? 'line-through text-slate-400' : ''}`}>{item.topic}</h3>
                      <div className="prose prose-sm prose-blue dark:prose-invert max-w-none dark:text-slate-200
                        prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed prose-p:m-0
                        prose-strong:text-blue-600 dark:prose-strong:text-blue-400 prose-strong:font-bold
                      ">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeRaw]}
                        >
                          {item.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                        <Link className="w-3.5 h-3.5" /> Resources
                      </h4>
                      <ul className="space-y-2">
                        {item.resources.map((res, i) => (
                          <li key={i} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2 hover:underline cursor-pointer bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg min-h-[36px]">
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" /> 
                            <span className="truncate font-medium">{res}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                        <Box className="w-3.5 h-3.5" /> Micro Project
                      </h4>
                      <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-600 prose prose-sm prose-blue dark:prose-invert max-w-none dark:text-slate-200
                        prose-p:m-0 prose-p:leading-relaxed
                        prose-strong:text-blue-600 dark:prose-strong:text-blue-400 prose-strong:font-bold
                      ">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeRaw]}
                        >
                          {item.project}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeQuiz && (
        <QuizModal 
          topic={`Week ${activeQuiz.week}: ${activeQuiz.topic}`} 
          content={activeQuiz.content} 
          onComplete={handleQuizComplete} 
          onClose={() => setActiveQuiz(null)} 
        />
      )}
    </div>
  );
};
