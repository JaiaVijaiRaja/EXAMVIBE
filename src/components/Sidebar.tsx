
import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  FileText, 
  Map, 
  AlertCircle, 
  Trophy,
  Brain,
  Cloud,
  Calculator as CalcIcon,
  Award
} from 'lucide-react';
import { ViewType, AppProgress } from '../types';
import { DailyStreakWidget } from './DailyStreakWidget';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
  userEmail: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'planner', label: 'Study Planner', icon: Calendar },
  { id: 'notes', label: 'Smart Notes', icon: BookOpen },
  { id: 'assignment', label: 'Assignment Helper', icon: FileText },
  { id: 'predictor', label: 'Question Predictor', icon: AlertCircle },
  { id: 'roadmap', label: 'Skill Roadmap', icon: Map },
  { id: 'challenge', label: '7-Day Challenge', icon: Trophy },
  { id: 'calculator', label: 'Grade Calculator', icon: CalcIcon },
  { id: 'flashcards', label: 'Revision Cards', icon: Brain },
  { id: 'reportcard', label: 'Report Card', icon: Award },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, progress, onUpdateProgress, userEmail }) => {
  return (
    <div className="h-full flex flex-col py-4">
      <div className="px-6 mb-4 hidden md:block shrink-0">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </h2>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewType)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'}
              `}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <h2 className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Performance
          </h2>
          <DailyStreakWidget onUpdateProgress={onUpdateProgress} currentGlobalStreak={progress.streaks} userEmail={userEmail} />
        </div>
      </nav>

      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 space-y-3 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
          <Cloud className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Supabase Sync Active</span>
        </div>
        <p className="text-xs text-slate-400 text-center">
          &copy; 2024 StudySync AI
        </p>
      </div>
    </div>
  );
};
