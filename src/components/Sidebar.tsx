
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
  Award,
  Info
} from 'lucide-react';
import { ViewType, AppProgress } from '../types';


interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
  userEmail: string;
  isDataLoaded: boolean;
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
  { id: 'about', label: 'About', icon: Info },
] as const;

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, progress, onUpdateProgress, userEmail, isDataLoaded }) => {
  return (
    <div className="h-full flex flex-col py-6">
      <div className="px-6 mb-8 shrink-0">
        <h1 className="text-2xl font-black text-white dark:text-white tracking-tighter">
          EXAMVIBE
        </h1>
        <p className="text-[10px] font-bold text-[#C4F135] dark:text-[#8B5CF6] uppercase tracking-[0.2em] mt-1">
          Study Smarter
        </p>
      </div>
      
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto custom-scrollbar">
        <div className="mb-4 px-2 flex items-center justify-between">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-70">
            Main Menu
          </h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
          </div>
        </div>

        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id as ViewType)}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 min-h-[52px] group relative
                  ${isActive 
                    ? 'bg-[#C4F135] text-[#1E1E2D] shadow-lg shadow-[#C4F135]/20 scale-[1.02] dark:bg-[#8B5CF6] dark:text-white dark:shadow-[#8B5CF6]/25' 
                    : 'text-white/60 hover:bg-white/10 hover:text-white dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'}
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 text-white/50 dark:text-slate-500 group-hover:text-white dark:group-hover:text-white'}`} />
                <span className="truncate tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 w-1.5 h-8 bg-white rounded-r-full -translate-x-1" />
                )}
              </button>
            );
          })}
        </div>


      </nav>

      <div className="px-6 pt-6 mt-4 shrink-0">
        <div className="flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            System Online
          </p>
        </div>
      </div>
    </div>
  );
};
