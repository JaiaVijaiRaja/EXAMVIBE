import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { DailyStreakWidget } from './DailyStreakWidget';
import { ViewType, User, AppProgress } from '../types';
import { Menu, X, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  user: User;
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
  isDataLoaded: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  currentView, 
  onViewChange, 
  isDarkMode, 
  onToggleTheme,
  user,
  progress,
  onUpdateProgress,
  isDataLoaded
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ripple, setRipple] = useState<{x: number, y: number, color: string, isAnimating: boolean, isFadingOut: boolean} | null>(null);

  const handleThemeToggle = (e: React.MouseEvent) => {
    if (ripple) return; // Prevent spam clicking

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const waveColor = !isDarkMode ? '#1A0B2E' : '#F4F5F9';

    setRipple({ x, y, color: waveColor, isAnimating: false, isFadingOut: false });
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRipple(prev => prev ? { ...prev, isAnimating: true } : null);
      });
    });

    setTimeout(() => {
      onToggleTheme();
      setRipple(prev => prev ? { ...prev, isFadingOut: true } : null);
    }, 300);

    setTimeout(() => {
      setRipple(null);
    }, 700);
  };

  return (
    <div 
      className={`flex h-screen overflow-hidden transition-colors duration-500 ${
        !isDarkMode ? 'bg-[#F4F5F9]' : 'bg-gradient-to-br from-[#1A0B2E] via-[#2D1B4E] to-[#120524]'
      }`}
    >
      {/* Theme Transition Ripple */}
      {ripple && (
        <div 
          className="fixed z-[100] pointer-events-none rounded-full transition-all duration-500 ease-in-out"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '2px',
            height: '2px',
            backgroundColor: ripple.color,
            transform: ripple.isAnimating ? 'scale(3000)' : 'scale(1)',
            opacity: ripple.isFadingOut ? 0 : 1
          }}
        />
      )}

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 md:relative md:translate-x-0
        ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]' : 'bg-[#1E1E2D] shadow-xl'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="md:hidden absolute top-4 right-4 z-40">
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className={`p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg transition-colors ${
              isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <Sidebar 
          currentView={currentView} 
          onViewChange={(v) => {
            onViewChange(v);
            setIsSidebarOpen(false);
          }} 
          progress={progress}
          onUpdateProgress={onUpdateProgress}
          userEmail={user.email}
          isDataLoaded={isDataLoaded}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Header */}
        <header className={`h-16 flex items-center justify-between px-4 backdrop-blur-md shrink-0 z-10 border-b ${
          isDarkMode ? 'bg-white/5 border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]' : 'bg-white/80 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <button 
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isDarkMode ? 'text-white hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className={`md:hidden text-xl font-black tracking-tighter ${
              isDarkMode ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
            }`}>
              EXAMVIBE
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <DailyStreakWidget
              onUpdateProgress={onUpdateProgress}
              currentGlobalStreak={progress.streaks}
              bestStreak={progress.bestStreak}
              userEmail={user.email}
              isDataLoaded={isDataLoaded}
            />

            {/* Theme Toggle Button */}
            <button
              onClick={handleThemeToggle}
              className={`p-2 rounded-full transition-all border relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-yellow-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-indigo-900'
              }`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Profile Info */}
            <div className="hidden sm:flex flex-col items-end">
              <span className={`text-sm font-black leading-none tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {user.name}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                {user.major}
              </span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${
              isDarkMode ? 'text-white bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/30' : 'text-[#1E1E2D] bg-[#C4F135] shadow-[#C4F135]/30'
            }`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 custom-scrollbar relative z-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

