
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
import { ViewType, Exam, User, AppProgress } from '@/types';
import { supabase } from '@/lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
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
    questionsStudied: 0
  };

  const [progress, setProgress] = useState<AppProgress>(INITIAL_PROGRESS);

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
      
      // Prepare data for Supabase (stringify objects if the columns are TEXT)
      const supabaseData: any = {};
      if (data.user_info) supabaseData.user_info = typeof data.user_info === 'object' ? JSON.stringify(data.user_info) : data.user_info;
      if (data.exams) supabaseData.exams = typeof data.exams === 'object' ? JSON.stringify(data.exams) : data.exams;
      if (data.progress) supabaseData.progress = typeof data.progress === 'object' ? JSON.stringify(data.progress) : data.progress;
      
      // Try to update first
      const { data: updateData, error: updateError } = await supabase
        .from('user_data')
        .update(supabaseData)
        .eq('email', cleanEmail)
        .select();

      // If no rows were updated, insert
      if (!updateError && (!updateData || updateData.length === 0)) {
        const { error: insertError } = await supabase
          .from('user_data')
          .insert({ 
            email: cleanEmail,
            ...supabaseData
          });
        if (insertError) console.error('Supabase insert error:', insertError);
      } else if (updateError) {
        console.error('Supabase update error:', updateError);
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
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
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
        .single();

      if (data && !error) {
        let remoteExams = [];
        if (data.exams) {
          remoteExams = typeof data.exams === 'string' ? JSON.parse(data.exams) : data.exams;
        }

        let remoteProgress = INITIAL_PROGRESS;
        if (data.progress) {
          remoteProgress = typeof data.progress === 'string' ? JSON.parse(data.progress) : data.progress;
        }

        // Merge strategy: Local data takes precedence over remote data for recent changes
        const mergedExams = [...remoteExams];
        localExams.forEach((le: Exam) => {
          const existingIndex = mergedExams.findIndex(re => re.id === le.id);
          if (existingIndex >= 0) {
            mergedExams[existingIndex] = le;
          } else {
            mergedExams.push(le);
          }
        });

        const mergedProgress: AppProgress = {
          ...INITIAL_PROGRESS,
          ...remoteProgress,
          ...localProgress,
          completedTasks: { ...remoteProgress.completedTasks, ...localProgress.completedTasks },
          completedRoadmapWeeks: { ...remoteProgress.completedRoadmapWeeks, ...localProgress.completedRoadmapWeeks },
          completedChallengeDays: { ...remoteProgress.completedChallengeDays, ...localProgress.completedChallengeDays },
          completedNotes: { ...remoteProgress.completedNotes, ...localProgress.completedNotes },
          completedAssignments: { ...remoteProgress.completedAssignments, ...localProgress.completedAssignments },
          completedPredictions: { ...remoteProgress.completedPredictions, ...localProgress.completedPredictions },
          completedFlashcardSets: { ...remoteProgress.completedFlashcardSets, ...localProgress.completedFlashcardSets },
          completedExams: { ...remoteProgress.completedExams, ...localProgress.completedExams },
          questionsStudied: Math.max(localProgress.questionsStudied || 0, remoteProgress.questionsStudied || 0),
          streaks: Math.max(localProgress.streaks || 0, remoteProgress.streaks || 0),
          cgpa: localProgress.cgpa || remoteProgress.cgpa || 0,
          sgpa: localProgress.sgpa || remoteProgress.sgpa || 0,
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
    }
  };

  const handleLogin = async (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('study_sync_user', JSON.stringify(newUser));
    
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
      
      if (user?.email) {
        syncWithSupabase(user.email, { progress: updated });
      }
      return updated;
    });
  }, [getScopedKey, syncWithSupabase, user?.email]);

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
          />
        );
      case 'planner':
        return <StudyPlanner progress={progress} onUpdateProgress={updateProgress} />;
      case 'notes':
        return <SmartNotes progress={progress} onUpdateProgress={updateProgress} />;
      case 'assignment':
        return <AssignmentHelper progress={progress} onUpdateProgress={updateProgress} />;
      case 'roadmap':
        return <SkillRoadmap progress={progress} onUpdateProgress={updateProgress} />;
      case 'predictor':
        return <Predictor progress={progress} onUpdateProgress={updateProgress} />;
      case 'challenge':
        return <Challenge progress={progress} onUpdateProgress={updateProgress} />;
      case 'flashcards':
        return <Flashcards progress={progress} onUpdateProgress={updateProgress} />;
      case 'calculator':
        return <Calculator />;
      case 'reportcard':
        return <ReportCardView progress={progress} onUpdateProgress={updateProgress} />;
      default:
        return <Dashboard user={user} exams={exams} progress={progress} onAddExam={handleAddExam} onDeleteExam={handleDeleteExam} onViewChange={setCurrentView} onLogout={handleLogout} />;
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
        >
          {renderView()}
        </Layout>
      </div>
    </div>
  );
};

export default App;
