import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { RoadmapItem, AppProgress } from '../types';
import { QuizModal } from '../components/QuizModal';
import { Loader2, Target, Link as LinkIcon, ExternalLink, Box, CheckCircle2, ArrowLeft, Plus, Map as MapIcon, Trash2 } from 'lucide-react';
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
  const [skillError, setSkillError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [activeQuiz, setActiveQuiz] = useState<{ week: number, topic: string, content: string, skillKey: string } | null>(null);
  const [viewingRoadmapId, setViewingRoadmapId] = useState<string | null>(null);

  // Normalize saved roadmaps
  const savedRoadmaps = progress.savedRoadmaps || (progress.savedRoadmap ? [{ id: 'legacy-1', ...progress.savedRoadmap }] : []);
  const viewingRoadmap = savedRoadmaps.find(rm => rm.id === viewingRoadmapId) || null;

  const handleGenerate = async () => {
    if (skill.trim().length < 3) {
      setSkillError('Please enter a full, valid topic (at least 3 characters).');
      return;
    }
    setSkillError('');
    if (!skill || !goal) return;
    
    setLoading(true);
    showToast(`Generating weekly roadmap for ${skill}...`, 'info');
    try {
      const result = await geminiService.generateRoadmap(skill, level, goal);
      const newId = Math.random().toString(36).substring(7);
      
      onUpdateProgress({
        savedRoadmaps: [...savedRoadmaps, {
          id: newId,
          skill,
          level,
          goal,
          items: result
        }],
        savedRoadmap: undefined // migrate away from legacy
      });
      
      setSkill('');
      setGoal('');
      setViewingRoadmapId(newId);
      showToast('Roadmap generated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to generate roadmap. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoadmap = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = savedRoadmaps.filter(rm => rm.id !== id);
    onUpdateProgress({ savedRoadmaps: updated, savedRoadmap: undefined });
    if (viewingRoadmapId === id) setViewingRoadmapId(null);
    showToast('Roadmap deleted.', 'info');
  };

  const handleToggleClick = (item: RoadmapItem, currentSkill: string) => {
    const key = `${currentSkill}-${item.week}`;
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
        content: `${item.description}\nProject: ${item.project}`,
        skillKey: currentSkill
      });
    }
  };

  const handleQuizComplete = () => {
    if (!activeQuiz) return;
    const key = `${activeQuiz.skillKey}-${activeQuiz.week}`;
    const newCompleted = { ...(progress.completedRoadmapWeeks || {}) };
    newCompleted[key] = true;
    onUpdateProgress({ 
      completedRoadmapWeeks: newCompleted,
      questionsStudied: (progress.questionsStudied || 0) + 10
    });
    setActiveQuiz(null);
    showToast('Week completed! +10 Questions Studied', 'success');
  };

  const parseResourceLink = (res: string, fallbackTopic: string) => {
    const match = res.match(/\[(.*?)\]\((.*?)\)/);
    if (match) {
      return { title: match[1], url: match[2] };
    }
    return { 
      title: res, 
      url: `https://www.google.com/search?q=${encodeURIComponent(fallbackTopic + ' ' + res)}`
    };
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            {viewingRoadmap ? (
              <button 
                onClick={() => setViewingRoadmapId(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Back to roadmaps"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            ) : null}
            Skill Development Roadmap
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">Map out your path to mastering high-demand engineering skills.</p>
        </div>
      </header>

      {!viewingRoadmap ? (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Saved Roadmaps Grid */}
          {savedRoadmaps.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-emerald-500" /> Your Active Roadmaps
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {savedRoadmaps.map((rm) => {
                  const completedWeeks = rm.items.filter(item => (progress.completedRoadmapWeeks || {})[`${rm.skill}-${item.week}`]).length;
                  const progressPct = (completedWeeks / rm.items.length) * 100;
                  
                  return (
                    <div 
                      key={rm.id}
                      onClick={() => setViewingRoadmapId(rm.id!)}
                      className="group bg-white dark:bg-white/5 dark:backdrop-blur-md p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-emerald-500/50 cursor-pointer transition-all relative overflow-hidden"
                    >
                      <button 
                        onClick={(e) => handleDeleteRoadmap(e, rm.id!)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1 truncate pr-8">{rm.skill}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 truncate">Goal: {rm.goal}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                          <span>{completedWeeks} / {rm.items.length} Weeks</span>
                          <span>{Math.round(progressPct)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create New Roadmap */}
          <div className="bg-white dark:bg-white/5 dark:backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" /> Create New Roadmap
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              <div className="md:col-span-1">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Target Skill</label>
                <input 
                  type="text" 
                  value={skill}
                  onChange={(e) => {
                    setSkill(e.target.value);
                    if (skillError) setSkillError('');
                  }}
                  placeholder="e.g. Next.js, Embedded C"
                  className={`w-full px-4 py-3 rounded-xl border ${skillError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500'} bg-white dark:bg-black/20 dark:backdrop-blur-md text-slate-900 dark:text-white focus:ring-2 outline-none text-base min-h-[44px] transition-colors`}
                />
                {skillError && <p className="text-red-500 text-xs font-bold mt-2">{skillError}</p>}
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Current Level</label>
                <select 
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 dark:backdrop-blur-md text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-base min-h-[44px] appearance-none"
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
                  placeholder="e.g. Build an app, Pass exam"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 dark:backdrop-blur-md text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-base min-h-[44px]"
                />
              </div>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={loading || !skill || !goal}
              className="mt-8 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 min-h-[48px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
              Generate Roadmap
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-4 p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Active Roadmap: {viewingRoadmap.skill}</h3>
              <p className="text-xs text-slate-500 font-medium">Track your weekly milestones below</p>
            </div>
          </div>
          
          {viewingRoadmap.items.map((item) => {
            const isDone = !!(progress.completedRoadmapWeeks || {})[`${viewingRoadmap.skill}-${item.week}`];
            return (
              <div 
                key={item.week} 
                className={`group relative bg-white dark:bg-white/5 dark:backdrop-blur-md rounded-2xl border overflow-hidden shadow-sm flex flex-col md:flex-row transition-all ${isDone ? 'border-emerald-500/50 opacity-80' : 'border-slate-200 dark:border-white/10'}`}
              >
                <div 
                  onClick={() => handleToggleClick(item, viewingRoadmap.skill)}
                  className={`md:w-32 p-6 flex flex-row md:flex-col items-center justify-between md:justify-center border-b md:border-b-0 md:border-r transition-colors cursor-pointer min-h-[60px] ${isDone ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-white/10'}`}
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
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-white/10">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                        <LinkIcon className="w-3.5 h-3.5" /> Resources
                      </h4>
                      <ul className="space-y-2">
                        {item.resources.map((res, i) => {
                          const { title, url } = parseResourceLink(res, viewingRoadmap.skill);
                          return (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2 hover:underline cursor-pointer bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-lg min-h-[36px] transition-colors">
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" /> 
                              <span className="truncate font-medium">{title}</span>
                            </a>
                          );
                        })}
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
          topic={`${activeQuiz.skillKey} - Week ${activeQuiz.week}: ${activeQuiz.topic}`} 
          content={activeQuiz.content} 
          onComplete={handleQuizComplete} 
          onClose={() => setActiveQuiz(null)} 
        />
      )}
    </div>
  );
};
