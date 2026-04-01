
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { ChallengeDay, AppProgress } from '../types';
import { Loader2, Trophy, Star, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

interface ChallengeProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
}

export const Challenge: React.FC<ChallengeProps> = ({ progress, onUpdateProgress }) => {
  const [skill, setSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<ChallengeDay[]>([]);

  // Load saved challenge on mount or progress change, handle isolation by clearing if undefined
  useEffect(() => {
    if (progress.savedChallenge) {
      setDays(progress.savedChallenge.items);
      setSkill(progress.savedChallenge.skill);
    } else {
      setDays([]);
      setSkill('');
    }
  }, [progress.savedChallenge]);

  const handleGenerate = async () => {
    if (!skill) return;
    setLoading(true);
    try {
      const result = await geminiService.generateChallenge(skill);
      setDays(result);
      // Save challenge to progress for persistence
      onUpdateProgress({
        savedChallenge: {
          skill,
          items: result
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = (day: number) => {
    const key = `${skill}-${day}`;
    const newCompleted = { ...progress.completedChallengeDays };
    let questionsIncrement = 0;
    if (newCompleted[key]) {
      delete newCompleted[key];
      questionsIncrement = -3;
    } else {
      newCompleted[key] = true;
      questionsIncrement = 3;
    }
    onUpdateProgress({ 
      completedChallengeDays: newCompleted,
      questionsStudied: Math.max(0, (progress.questionsStudied || 0) + questionsIncrement)
    });
  };

  const clearChallenge = () => {
    onUpdateProgress({ savedChallenge: undefined, completedChallengeDays: {} });
  };

  const getCompletedCount = () => {
    return Object.keys(progress.completedChallengeDays).filter(k => k.startsWith(skill + '-')).length;
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">7-Day Skill Challenge</h2>
          <p className="text-slate-600 dark:text-slate-400">Jumpstart a new skill with a micro-learning sprint.</p>
        </div>
        {days.length > 0 && (
          <button 
            onClick={clearChallenge}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reset Challenge
          </button>
        )}
      </header>

      {days.length === 0 ? (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 text-center animate-fadeIn">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6 drop-shadow-lg" />
          <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">Start Your Sprint</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8">What do you want to learn this week?</p>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g. Docker Basics, Python Pandas, LaTeX"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none"
            />
            <button 
              onClick={handleGenerate}
              disabled={loading || !skill}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Go!'}
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">7-Day {skill} Challenge</h4>
            <div className="text-sm font-bold text-slate-500">
              Progress: <span className="text-yellow-600">{getCompletedCount()}/7 Days</span>
            </div>
          </div>

          <div className="space-y-4">
            {days.map((d) => {
              const isDone = !!progress.completedChallengeDays[`${skill}-${d.day}`];
              return (
                <div 
                  key={d.day}
                  className={`
                    group relative flex items-start gap-6 p-6 rounded-2xl border transition-all cursor-pointer
                    ${isDone 
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-yellow-300 dark:hover:border-yellow-800'}
                  `}
                  onClick={() => toggleComplete(d.day)}
                >
                  <div className={`
                    w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-black text-lg transition-colors
                    ${isDone 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-yellow-100 group-hover:text-yellow-600'}
                  `}>
                    {isDone ? <CheckCircle2 className="w-6 h-6" /> : d.day}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className={`font-bold text-slate-900 dark:text-white ${isDone ? 'line-through' : ''}`}>Goal: {d.goal}</h5>
                      {d.day === 1 && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{d.action}</p>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                      Resource: {d.material}
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>

          {getCompletedCount() === 7 && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-8 rounded-2xl text-center text-white shadow-xl animate-bounce">
              <h3 className="text-2xl font-black mb-2">Challenge Complete! 🎉</h3>
              <p>You've successfully finished the 7-day {skill} sprint. Knowledge is power!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
