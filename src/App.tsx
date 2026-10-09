
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Login } from '@/components/Login';
import { Dashboard } from '@/views/Dashboard';
import { StudyPlanner } from '@/views/StudyPlanner';
import { SmartNotes } from '@/views/SmartNotes';
import { AssignmentHelper } from '@/views/AssignmentHelper';
import { SkillRoadmap } from '@/views/SkillRoadmap';
import { Predictor } from '@/views/Predictor';
import { Challenge } from '@/views/Challenge';
import { Flashcards } from '@/views/Flashcards';
import { Calculator } from '@/views/Calculator';
import { ReportCardView } from '@/views/ReportCardView';
import { About } from '@/views/About';
import { ViewType, Exam, User, AppProgress } from '@/types';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const INITIAL_PROGRESS: AppProgress = {
    completedTasks: {},
    completedRoadmapWeeks: {},
    completedChallengeDays: {},
    completedNotes: {},
    completedAssignments: {},
    completedPredictions: {},
    completedFlashcardSets: {},
    completedExams: {},
    cgpa: 0,
    sgpa: 0,
    streaks: 0,
    bestStreak: 0,
    questionsStudied: 0
  };

  const [progress, setProgress] = useState<AppProgress>(INITIAL_PROGRESS);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Helper to get user-specific storage keys
  const getScopedKey = useCallback((baseKey: string, email?: string) => {
    const activeEmail = email || user?.email;
    return activeEmail ? `user_${activeEmail.toLowerCase()}_${baseKey}` : null;
  }, [user]);

  // Sync data with Supabase
  const syncWithSupabase = useCallback(async (email: string, data: { user_info?: User, exams?: Exam[], progress?: AppProgress }) => {
    if (!supabase.auth) return; // Basic check if supabase is initialized
    
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      // 1. Sync Profile Data to 'profiles' table
      if (data.user_info) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            { 
              email: cleanEmail, 
              name: data.user_info.name,
              major: data.user_info.major || '',
              updated_at: new Date().toISOString()
            },
            { onConflict: 'email' }
          );
        if (profileError) console.error('Supabase profile sync error:', profileError);
      }

      // 2. Sync Exams and Progress to 'user_data' table
      if (data.exams || data.progress) {
        const supabaseData: any = {};
        
        if (data.exams) {
          supabaseData.exams = typeof data.exams === 'object' ? JSON.stringify(data.exams) : data.exams;
        }

        if (data.progress) {
          const p = data.progress;
          // Full object dump for strict React state recreation
          supabaseData.progress = typeof p === 'object' ? JSON.stringify(p) : p;

          // Compute XP and Level
          const taskCount = Object.keys(p.completedTasks || {}).length;
          const roadmapCount = Object.keys(p.completedRoadmapWeeks || {}).length;
          const challengeCount = Object.keys(p.completedChallengeDays || {}).length;
          const notesCount = Object.keys(p.completedNotes || {}).length;
          const examPassedCount = Object.keys(p.completedExams || {}).length;
          const questionsStudied = p.questionsStudied || 0;
          const streaks = p.streaks || 0;

          const xp = 
            (taskCount * 10) + 
            (roadmapCount * 50) + 
            (challengeCount * 20) + 
            (notesCount * 5) + 
            (examPassedCount * 100) + 
            (questionsStudied * 2) + 
            (streaks * 15) + 
            (p.manualXpOffset || 0);

          let level = "F-Rank";
          if (xp >= 4000) level = "S-Rank";
          else if (xp >= 2000) level = "A-Rank";
          else if (xp >= 1000) level = "B-Rank";
          else if (xp >= 600) level = "C-Rank";
          else if (xp >= 300) level = "D-Rank";
          else if (xp >= 100) level = "E-Rank";

          // Explode the data into separate columns for Supabase visibility
          supabaseData.planner = p.savedPlanner ? JSON.stringify(p.savedPlanner) : null;
          supabaseData.roadmaps = p.savedRoadmaps ? JSON.stringify(p.savedRoadmaps) : null;
          supabaseData.notes = p.completedNotes ? JSON.stringify(p.completedNotes) : null;
          supabaseData.flashcards = p.completedFlashcardSets ? JSON.stringify(p.completedFlashcardSets) : null;
          supabaseData.challenge = p.savedChallenge ? JSON.stringify(p.savedChallenge) : null;
          supabaseData.assignments = p.completedAssignments ? JSON.stringify(p.completedAssignments) : null;
          supabaseData.cgpa = p.cgpa || 0;
          supabaseData.sgpa = p.sgpa || 0;
          supabaseData.streaks = streaks;
          supabaseData.best_streak = p.bestStreak || 0;
          supabaseData.questions_studied = questionsStudied;
          supabaseData.xp = xp;
          supabaseData.level = level;
        }
        
        const { data: upsertData, error: upsertError } = await supabase
          .from('user_data')
          .upsert(
            { email: cleanEmail, ...supabaseData },
            { onConflict: 'email' }
          )
          .select();

        if (upsertError) {
          console.error('Supabase UPSERT error on user_data:', upsertError);
        }
      }
    } catch (err) {
      console.error('Failed to sync with Supabase:', err);
    }
  }, []);

  // Load User and Global Theme initially
  useEffect(() => {
    const savedUser = localStorage.getItem('study_sync_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      loadUserData(parsedUser.email);
    }
    
    const theme = localStorage.getItem('theme');
    if (theme !== 'light') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load data for a specific user
  const loadUserData = async (email: string) => {
    const emailLower = email.toLowerCase();
    const examKey = `user_${emailLower}_exams`;
    const progressKey = `user_${emailLower}_progress`;

    // Load from localStorage first for immediate UI update
    const savedExams = localStorage.getItem(examKey);
    const localExams = savedExams ? JSON.parse(savedExams) : [];
    setExams(localExams);

    const savedProgress = localStorage.getItem(progressKey);
    const localProgress = savedProgress ? { ...INITIAL_PROGRESS, ...JSON.parse(savedProgress) } : INITIAL_PROGRESS;
    setProgress(localProgress);

    // 1. Try to load from Supabase and merge
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('*')
        .eq('email', emailLower)
        .maybeSingle();

      if (data && !error) {
        let remoteExams = [];
        if (data.exams) {
          remoteExams = typeof data.exams === 'string' ? JSON.parse(data.exams) : data.exams;
        }

        let remoteProgress = INITIAL_PROGRESS;
        if (data.progress) {
          remoteProgress = typeof data.progress === 'string' ? JSON.parse(data.progress) : data.progress;
        }

        const baseRemoteXp = 
          (Object.keys(remoteProgress.completedTasks || {}).length * 10) + 
          (Object.keys(remoteProgress.completedRoadmapWeeks || {}).length * 50) + 
          (Object.keys(remoteProgress.completedChallengeDays || {}).length * 20) + 
          (Object.keys(remoteProgress.completedNotes || {}).length * 5) + 
          (Object.keys(remoteProgress.completedExams || {}).length * 100) + 
          ((remoteProgress.questionsStudied || 0) * 2) + 
          ((remoteProgress.streaks || 0) * 15);

        const manualXpOffset = (data.xp !== undefined && data.xp !== null) ? (data.xp - baseRemoteXp) : (remoteProgress.manualXpOffset || 0);

        // Merge strategy: 
        // 1. If local data is empty/default, use remote data.
        // 2. If both exist, merge them (remote takes precedence for base fields, but we merge collections).
        
        const mergedExams = [...remoteExams];
        if (savedExams) {
          localExams.forEach((le: Exam) => {
            if (!mergedExams.find(re => re.id === le.id)) {
              mergedExams.push(le);
            }
          });
        }

        let finalStreaks = Math.max(localProgress.streaks || 0, remoteProgress.streaks || 0);
        if (data.streaks !== undefined && data.streaks !== (remoteProgress.streaks || 0)) {
          finalStreaks = data.streaks;
        }

        let finalBestStreak = Math.max(localProgress.bestStreak || 0, remoteProgress.bestStreak || 0);
        if (data.best_streak !== undefined && data.best_streak !== (remoteProgress.bestStreak || 0)) {
          finalBestStreak = data.best_streak;
        }

        let finalCgpa = localProgress.cgpa || remoteProgress.cgpa || 0;
        if (data.cgpa !== undefined && data.cgpa !== (remoteProgress.cgpa || 0)) {
          finalCgpa = data.cgpa;
        }

        let finalSgpa = localProgress.sgpa || remoteProgress.sgpa || 0;
        if (data.sgpa !== undefined && data.sgpa !== (remoteProgress.sgpa || 0)) {
          finalSgpa = data.sgpa;
        }

        let finalQuestionsStudied = Math.max(localProgress.questionsStudied || 0, remoteProgress.questionsStudied || 0);
        if (data.questions_studied !== undefined && data.questions_studied !== (remoteProgress.questionsStudied || 0)) {
          finalQuestionsStudied = data.questions_studied;
        }

        const mergedProgress: AppProgress = {
          ...INITIAL_PROGRESS,
          ...remoteProgress,
          ...(savedProgress ? JSON.parse(savedProgress) : {}),
          completedTasks: { ...remoteProgress.completedTasks, ...localProgress.completedTasks },
          completedRoadmapWeeks: { ...remoteProgress.completedRoadmapWeeks, ...localProgress.completedRoadmapWeeks },
          completedChallengeDays: { ...remoteProgress.completedChallengeDays, ...localProgress.completedChallengeDays },
          completedNotes: { ...remoteProgress.completedNotes, ...localProgress.completedNotes },
          completedAssignments: { ...remoteProgress.completedAssignments, ...localProgress.completedAssignments },
          completedPredictions: { ...remoteProgress.completedPredictions, ...localProgress.completedPredictions },
          completedFlashcardSets: { ...remoteProgress.completedFlashcardSets, ...localProgress.completedFlashcardSets },
          completedExams: { ...remoteProgress.completedExams, ...localProgress.completedExams },
          questionsStudied: finalQuestionsStudied,
          streaks: finalStreaks,
          bestStreak: finalBestStreak,
          cgpa: finalCgpa,
          sgpa: finalSgpa,
          manualXpOffset: manualXpOffset,
        };

        setExams(mergedExams);
        setProgress(mergedProgress);
        
        // Update local storage with merged data
        localStorage.setItem(examKey, JSON.stringify(mergedExams));
        localStorage.setItem(progressKey, JSON.stringify(mergedProgress));
        
        // If there were changes from merging, sync back to Supabase
        syncWithSupabase(emailLower, { exams: mergedExams, progress: mergedProgress });
      }
    } catch (err) {
      console.warn('Supabase sync failed:', err);
    } finally {
      setIsDataLoaded(true);
    }
  };

  const handleLogin = async (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('study_sync_user', JSON.stringify(newUser));
    showToast(`Welcome back, ${newUser.name}!`, 'success');
    
    // 1. Log the login event in Supabase
    try {
      await supabase
        .from('login_history')
        .insert({
          email: newUser.email.toLowerCase(),
          name: newUser.name,
          major: newUser.major,
          login_at: new Date().toISOString()
        });
    } catch (err) {
      console.error('Failed to log login:', err);
    }

    // 2. Initial sync on login
    await syncWithSupabase(newUser.email, { user_info: newUser });
    await loadUserData(newUser.email);
  };

  const handleLogout = () => {
    localStorage.removeItem('study_sync_user');
    setUser(null);
    setExams([]);
    setProgress(INITIAL_PROGRESS);
    setCurrentView('dashboard');
    showToast('Logged out successfully.', 'info');
  };

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleAddExam = (exam: Exam) => {
    const newExams = [...exams, exam];
    setExams(newExams);
    const key = getScopedKey('exams');
    if (key) localStorage.setItem(key, JSON.stringify(newExams));
    
    if (user?.email) {
      syncWithSupabase(user.email, { exams: newExams });
    }
  };

  const handleDeleteExam = (id: string) => {
    const newExams = exams.filter(e => e.id !== id);
    setExams(newExams);
    const key = getScopedKey('exams');
    if (key) localStorage.setItem(key, JSON.stringify(newExams));

    if (user?.email) {
      syncWithSupabase(user.email, { exams: newExams });
    }
  };

  const updateProgress = useCallback((newProgress: Partial<AppProgress> | ((prev: AppProgress) => Partial<AppProgress>)) => {
    setProgress(prev => {
      const patch = typeof newProgress === 'function' ? newProgress(prev) : newProgress;
      const updated = { ...prev, ...patch };
      const key = getScopedKey('progress');
      if (key) {
        localStorage.setItem(key, JSON.stringify(updated));
      }
      
      // CRITICAL: Only sync to Supabase if data has been loaded/merged
      // This prevents overwriting remote data with local defaults on a fresh login
      if (user?.email && isDataLoaded) {
        syncWithSupabase(user.email, { progress: updated });
      }
      return updated;
    });
  }, [getScopedKey, syncWithSupabase, user?.email, isDataLoaded]);

  const handleMarkExamPassed = (id: string) => {
    updateProgress(prev => {
      const currentCompleted = prev.completedExams || {};
      return {
        completedExams: {
          ...currentCompleted,
          [id]: !currentCompleted[id]
        }
      };
    });
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            exams={exams} 
            progress={progress}
            onAddExam={handleAddExam} 
            onDeleteExam={handleDeleteExam} 
            onMarkExamPassed={handleMarkExamPassed}
            onUpdateProgress={updateProgress}
            onViewChange={setCurrentView}
            onLogout={handleLogout}
            showToast={showToast}
          />
        );
      case 'planner':
        return <StudyPlanner progress={progress} onUpdateProgress={updateProgress} showToast={showToast} />;
      case 'notes':
        return <SmartNotes progress={progress} onUpdateProgress={updateProgress} showToast={showToast} />;
      case 'assignment':
        return <AssignmentHelper progress={progress} onUpdateProgress={updateProgress} showToast={showToast} />;
      case 'roadmap':
        return <SkillRoadmap progress={progress} onUpdateProgress={updateProgress} showToast={showToast} />;
      case 'predictor':
        return <Predictor progress={progress} onUpdateProgress={updateProgress} showToast={showToast} />;
      case 'challenge':
        return <Challenge progress={progress} onUpdateProgress={updateProgress} showToast={showToast} />;
      case 'flashcards':
        return <Flashcards progress={progress} onUpdateProgress={updateProgress} showToast={showToast} />;
      case 'calculator':
        return <Calculator progress={progress} onUpdateProgress={updateProgress} showToast={showToast} />;
      case 'reportcard':
        return <ReportCardView progress={progress} onUpdateProgress={updateProgress} showToast={showToast} />;
      case 'about':
        return <About />;
      default:
        return (
          <Dashboard 
            user={user} 
            exams={exams} 
            progress={progress}
            onAddExam={handleAddExam} 
            onDeleteExam={handleDeleteExam} 
            onMarkExamPassed={handleMarkExamPassed}
            onUpdateProgress={updateProgress}
            onViewChange={setCurrentView}
            onLogout={handleLogout}
            showToast={showToast}
          />
        );
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        <Layout 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          isDarkMode={isDarkMode} 
          onToggleTheme={toggleTheme}
          user={user}
          progress={progress}
          onUpdateProgress={updateProgress}
          isDataLoaded={isDataLoaded}
        >
          {renderView()}
        </Layout>

        {/* Global Toast Notifications */}
        <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[100] flex flex-col gap-2 sm:gap-3 pointer-events-none">
          <AnimatePresence mode="popLayout">
            {toasts.map(toast => (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`
                  pointer-events-auto flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl border backdrop-blur-xl w-full sm:min-w-[320px]
                  ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : ''}
                  ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' : ''}
                  ${toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : ''}
                `}
              >
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
                
                <p className="text-xs sm:text-sm font-bold tracking-tight flex-1">{toast.message}</p>
                
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <X className="w-4 h-4 opacity-50" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default App;
