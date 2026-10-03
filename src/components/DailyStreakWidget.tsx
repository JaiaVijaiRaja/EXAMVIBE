import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flame, AlertTriangle, X } from 'lucide-react';

import { AppProgress } from '../types';

interface DailyStreakWidgetProps {
  onUpdateProgress?: (newProgress: Partial<AppProgress> | ((prev: AppProgress) => Partial<AppProgress>)) => void;
  currentGlobalStreak?: number;
  bestStreak?: number;
  userEmail: string;
  isDataLoaded: boolean;
}

export const DailyStreakWidget: React.FC<DailyStreakWidgetProps> = ({ onUpdateProgress, currentGlobalStreak = 0, bestStreak = 0, userEmail, isDataLoaded }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkStreak = () => {
      const today = new Date();
      const todayStr = today.toDateString();
      
      const emailKey = userEmail.toLowerCase();
      const lastVisitKey = `last_visit_date_${emailKey}`;

      const lastVisit = localStorage.getItem(lastVisitKey);
      
      let currentStreak = currentGlobalStreak;
      
      if (lastVisit === todayStr) {
        // Already visited today
        setShowWarning(false);
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
        
        localStorage.setItem(lastVisitKey, todayStr);
        setShowWarning(false);
        
        // Sync with global progress
        if (onUpdateProgress) {
          onUpdateProgress(prev => {
            const newBest = Math.max(prev.bestStreak || 0, currentStreak);
            return { 
              streaks: currentStreak,
              bestStreak: newBest
            };
          });
        }
      }
    };

    if (isDataLoaded) {
      checkStreak();
    }

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
  }, [userEmail, onUpdateProgress, currentGlobalStreak, isDataLoaded]);

  const getBadge = (days: number) => {
    if (days >= 30) return { label: 'Legend', emoji: '🏆' };
    if (days >= 14) return { label: 'Consistent', emoji: '💪' };
    if (days >= 7) return { label: 'On Fire', emoji: '🔥' };
    if (days >= 3) return { label: 'On a Roll', emoji: '⚡' };
    return { label: 'Beginner', emoji: '🌱' };
  };

  const badge = getBadge(currentGlobalStreak);

  const streak = currentGlobalStreak || 0;
  const isMilestone = streak > 0 && streak % 10 === 0;
  const iconColorClass = isMilestone ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]';

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all group shadow-sm"
      >
        <Flame className={`w-5 h-5 animate-pulse ${iconColorClass}`} />
        <span className={`text-sm font-black ${isMilestone ? 'text-blue-600 dark:text-blue-500' : 'text-orange-600 dark:text-orange-500'}`}>
          {streak}
        </span>
      </button>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-[#1E1E2D] w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl border border-slate-200 dark:border-white/10 animate-fadeIn">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isMilestone ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}>
                <Flame className={`w-10 h-10 ${iconColorClass} animate-bounce`} />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Your Daily Streak</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
                Keep visiting every day to maintain your streak and earn new badges!
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Current Streak</span>
                <span className={`text-lg font-black ${isMilestone ? 'text-blue-600 dark:text-blue-500' : 'text-orange-600 dark:text-orange-500'}`}>
                  {streak} {streak === 1 ? 'day' : 'days'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Best Streak</span>
                <span className="text-lg font-black text-yellow-600 dark:text-yellow-500">
                  {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Status</span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  {badge.label} {badge.emoji}
                </span>
              </div>
            </div>

            {showWarning && (
              <div className="mt-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-tighter">
                  Streak reset warning! You haven't checked in yet today.
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
