import React, { useState, useEffect } from 'react';
import { Flame, Trophy, AlertTriangle } from 'lucide-react';

import { AppProgress } from '../types';

interface DailyStreakWidgetProps {
  onUpdateProgress?: (newProgress: Partial<AppProgress>) => void;
  currentGlobalStreak?: number;
  userEmail: string;
}

export const DailyStreakWidget: React.FC<DailyStreakWidgetProps> = ({ onUpdateProgress, currentGlobalStreak, userEmail }) => {
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkStreak = () => {
      const today = new Date();
      const todayStr = today.toDateString();
      
      const emailKey = userEmail.toLowerCase();
      const lastVisitKey = `last_visit_date_${emailKey}`;
      const currentStreakKey = `current_streak_${emailKey}`;
      const bestStreakKey = `best_streak_${emailKey}`;

      const lastVisit = localStorage.getItem(lastVisitKey);
      const currentStreakStr = localStorage.getItem(currentStreakKey);
      const bestStreakStr = localStorage.getItem(bestStreakKey);
      
      let currentStreak = currentStreakStr ? parseInt(currentStreakStr, 10) : 0;
      let best = bestStreakStr ? parseInt(bestStreakStr, 10) : 0;
      
      // Sync local streak with global streak if global is higher (e.g., manual update)
      if (currentGlobalStreak !== undefined && currentGlobalStreak > currentStreak) {
        currentStreak = currentGlobalStreak;
        localStorage.setItem(currentStreakKey, currentStreak.toString());
        if (currentStreak > best) {
          best = currentStreak;
          localStorage.setItem(bestStreakKey, best.toString());
        }
      }
      
      if (lastVisit === todayStr) {
        // Already visited today
        setShowWarning(false);
        // Sync with global progress if it's different
        if (onUpdateProgress && currentGlobalStreak !== currentStreak) {
          onUpdateProgress({ streaks: currentStreak });
        }
      } else {
        // New visit today
        if (lastVisit) {
          const lastVisitDate = new Date(lastVisit);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastVisitDate.toDateString() === yesterday.toDateString()) {
            currentStreak += 1;
          } else {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        
        if (currentStreak > best) {
          best = currentStreak;
          localStorage.setItem(bestStreakKey, best.toString());
        }
        
        localStorage.setItem(currentStreakKey, currentStreak.toString());
        localStorage.setItem(lastVisitKey, todayStr);
        setShowWarning(false);
        
        // Sync with global progress
        if (onUpdateProgress) {
          onUpdateProgress({ streaks: currentStreak });
        }
      }
      
      setStreak(currentStreak);
      setBestStreak(best);
    };

    checkStreak();

    // Check for warning every minute (in case app is left open)
    const interval = setInterval(() => {
      const today = new Date();
      const todayStr = today.toDateString();
      const emailKey = userEmail.toLowerCase();
      const lastVisit = localStorage.getItem(`last_visit_date_${emailKey}`);
      
      if (lastVisit !== todayStr && today.getHours() >= 21) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 60000);

    // Initial warning check
    const today = new Date();
    const todayStr = today.toDateString();
    const emailKey = userEmail.toLowerCase();
    const lastVisit = localStorage.getItem(`last_visit_date_${emailKey}`);
    if (lastVisit !== todayStr && today.getHours() >= 21) {
      setShowWarning(true);
    }

    return () => clearInterval(interval);
  }, [userEmail, onUpdateProgress, currentGlobalStreak]);

  const getBadge = (days: number) => {
    if (days >= 30) return { label: 'Legend', emoji: '🏆' };
    if (days >= 14) return { label: 'Consistent', emoji: '💪' };
    if (days >= 7) return { label: 'On Fire', emoji: '🔥' };
    if (days >= 3) return { label: 'On a Roll', emoji: '⚡' };
    return { label: 'Beginner', emoji: '🌱' };
  };

  const badge = getBadge(streak);

  return (
    <div className="mt-2 p-3 bg-slate-900/40 border border-white/5 rounded-xl backdrop-blur-md shadow-lg">
      <h3 className="text-[10px] font-black text-white mb-2 flex items-center gap-2 uppercase tracking-tighter">
        <Flame className="w-3 h-3 text-orange-500" />
        Daily Streak
      </h3>
      
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Current</span>
          <span className="text-[10px] font-black text-orange-400 flex items-center gap-1">
            {streak} {streak === 1 ? 'day' : 'days'} 🔥
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Best</span>
          <span className="text-[10px] font-black text-yellow-500 flex items-center gap-1">
            {bestStreak} {bestStreak === 1 ? 'day' : 'days'} 🏆
          </span>
        </div>
        
        <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Status</span>
          <span className="text-[8px] font-black text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
            {badge.label} {badge.emoji}
          </span>
        </div>

        {showWarning && (
          <div className="mt-1.5 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[8px] text-red-300 leading-tight font-bold uppercase tracking-tighter">
              Streak reset warning!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
