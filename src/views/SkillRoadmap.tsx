
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { RoadmapItem, AppProgress } from '../types';
import { QuizModal } from '../components/QuizModal';
import { Loader2, Target, Link, ExternalLink, Box, CheckCircle2, RefreshCw } from 'lucide-react';

interface SkillRoadmapProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
}

export const SkillRoadmap: React.FC<SkillRoadmapProps> = ({ progress, onUpdateProgress }) => {
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
    } catch (error) {
      console.error(error);
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
  };

  const clearRoadmap = () => {
    onUpdateProgress({ savedRoadmap: undefined });
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Skill Development Roadmap</h2>
          <p className="text-slate-600 dark:text-slate-400">Map out your path to mastering high-demand engineering skills.</p>
        </div>
        {roadmap.length > 0 && (
          <button 
            onClick={clearRoadmap}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reset Roadmap
          </button>
        )}
      </header>

      {roadmap.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Skill</label>
              <input 
                type="text" 
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g. AWS Cloud, React, FPGA"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Level</label>
              <select 
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ultimate Goal</label>
              <input 
                type="text" 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Land a job, Build a drone"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={loading || !skill || !goal}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
            Generate Weekly Roadmap
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <Target className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Active Roadmap: {skill}</h3>
              <p className="text-xs text-slate-500">Track your weekly milestones below</p>
            </div>
          </div>
          
          {roadmap.map((item) => {
            const isDone = !!(progress.completedRoadmapWeeks || {})[`${skill}-${item.week}`];
            return (
              <div 
                key={item.week} 
                className={`group relative bg-white dark:bg-slate-800 rounded-xl border overflow-hidden shadow-sm flex flex-col md:flex-row transition-all ${isDone ? 'border-emerald-500/50 opacity-80' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <div 
                  onClick={() => handleToggleClick(item)}
                  className={`md:w-32 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r transition-colors cursor-pointer ${isDone ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Week</span>
                  <span className="text-4xl font-black text-emerald-700 dark:text-emerald-300">{item.week}</span>
                  {isDone && <CheckCircle2 className="w-6 h-6 text-emerald-500 mt-2" />}
                </div>
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`text-xl font-bold text-slate-900 dark:text-white mb-1 ${isDone ? 'line-through' : ''}`}>{item.topic}</h3>
                      <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2">
                        <Link className="w-4 h-4" /> Recommended Resources
                      </h4>
                      <ul className="space-y-1">
                        {item.resources.map((res, i) => (
                          <li key={i} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer">
                            <ExternalLink className="w-3 h-3" /> {res}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-2">
                        <Box className="w-4 h-4" /> Micro Project
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                        {item.project}
                      </p>
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
