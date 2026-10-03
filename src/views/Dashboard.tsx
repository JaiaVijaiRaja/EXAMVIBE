
import React, { useState, useEffect } from 'react';
import { Exam, ViewType, User, AppProgress } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Zap, 
  Book, 
  Target, 
  LogOut, 
  BarChart3,
  CheckCircle,
  Brain,
  History,
  ShieldCheck
} from 'lucide-react';

interface DashboardProps {
  user: User;
  exams: Exam[];
  progress: AppProgress;
  onAddExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
  onMarkExamPassed: (id: string) => void;
  onUpdateProgress: (newProgress: Partial<AppProgress> | ((prev: AppProgress) => Partial<AppProgress>)) => void;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  exams, 
  progress, 
  onAddExam, 
  onDeleteExam, 
  onMarkExamPassed,
  onUpdateProgress,
  onViewChange,
  onLogout,
  showToast
}) => {
  const [newExamSubject, setNewExamSubject] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const isAdmin = user.email.toLowerCase() === 'vijaithegamer@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .order('login_at', { ascending: false })
        .limit(10);
      
      if (data && !error) {
        setLoginLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleAdd = () => {
    if (newExamSubject && newExamDate) {
      onAddExam({
        id: Math.random().toString(36).substr(2, 9),
        subject: newExamSubject,
        date: newExamDate
      });
      showToast(`${newExamSubject} exam added to countdown!`, 'success');
      setNewExamSubject('');
      setNewExamDate('');
    }
  };

  const handleDelete = (id: string, subject: string) => {
    onDeleteExam(id);
    showToast(`${subject} exam removed.`, 'info');
  };

  const handlePassed = (id: string, subject: string) => {
    onMarkExamPassed(id);
    const isPassed = !progress.completedExams?.[id];
    showToast(isPassed ? `Congratulations on passing ${subject}!` : `${subject} status updated.`, isPassed ? 'success' : 'info');
  };

  const getDaysLeft = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const taskCount = Object.keys(progress.completedTasks || {}).length;
  const roadmapCount = Object.keys(progress.completedRoadmapWeeks || {}).length;
  const challengeCount = Object.keys(progress.completedChallengeDays || {}).length;
  const notesCount = Object.keys(progress.completedNotes || {}).length;
  const assignmentCount = Object.keys(progress.completedAssignments || {}).length;
  const predictorCount = Object.keys(progress.completedPredictions || {}).length;
  const flashcardSetCount = Object.keys(progress.completedFlashcardSets || {}).length;
  const examPassedCount = Object.keys(progress.completedExams || {}).length;

  const totalCompleted = taskCount + roadmapCount + challengeCount + notesCount + assignmentCount + predictorCount + flashcardSetCount + examPassedCount;

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome, {user.name}!</h2>
          <p className="text-slate-600 dark:text-slate-400">Pursuing {user.major} • {totalCompleted} Milestones Achieved</p>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>      {/* Progress Overview */}
      <section className="bg-white dark:bg-transparent dark:from-white/10 dark:to-white/5 dark:backdrop-blur-xl dark:border dark:border-white/20 p-5 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] animate-fadeIn relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6" />
          <h3 className="text-xl font-bold">Your Learning Progress</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-blue-100">Study Tasks</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{taskCount}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-blue-400/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#1E1E2D] dark:bg-white transition-all duration-1000" style={{ width: `${Math.min(100, taskCount * 10)}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-blue-100">Roadmap Steps</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{roadmapCount}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-blue-400/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#C4F135] dark:bg-white transition-all duration-1000" style={{ width: `${Math.min(100, roadmapCount * 25)}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-blue-100">AI Insights</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{notesCount + assignmentCount + predictorCount}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-blue-400/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#1E1E2D] dark:bg-white transition-all duration-1000" style={{ width: `${Math.min(100, (notesCount + assignmentCount + predictorCount) * 20)}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-blue-100">Revision</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{flashcardSetCount}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-blue-400/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#C4F135] dark:bg-white transition-all duration-1000" style={{ width: `${Math.min(100, flashcardSetCount * 33)}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <div 
          onClick={() => onViewChange('planner')}
          className="p-5 sm:p-6 bg-white dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20 border border-transparent dark:hover:bg-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:border-[#C4F135] dark:hover:border-blue-500 rounded-3xl transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap className="text-blue-600 dark:text-blue-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Smart Planner</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Generate optimized study schedules.</p>
        </div>

        <div 
          onClick={() => onViewChange('notes')}
          className="p-5 sm:p-6 bg-white dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20 border border-transparent dark:hover:bg-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:border-[#C4F135] dark:hover:border-indigo-500 rounded-3xl transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Book className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Notes</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Convert topics into structured notes.</p>
        </div>

        <div 
          onClick={() => onViewChange('roadmap')}
          className="p-5 sm:p-6 bg-white dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20 border border-transparent dark:hover:bg-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:border-[#C4F135] dark:hover:border-emerald-500 rounded-3xl transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Target className="text-emerald-600 dark:text-emerald-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Skill Up</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Step-by-step career roadmaps.</p>
        </div>

        <div 
          onClick={() => onViewChange('flashcards')}
          className="p-5 sm:p-6 bg-white dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20 border border-transparent dark:hover:bg-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:border-[#C4F135] dark:hover:border-orange-500 rounded-3xl transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Brain className="text-orange-600 dark:text-orange-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Revision Cards</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Quick flashcards for completed topics.</p>
        </div>

        <div 
          onClick={() => onViewChange('reportcard')}
          className="p-5 sm:p-6 bg-white dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20 border border-transparent dark:hover:bg-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:border-[#C4F135] dark:hover:border-blue-500 rounded-3xl transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BarChart3 className="text-blue-600 dark:text-blue-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Report Card</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Detailed academic performance & stats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
        {/* Exam Countdown */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl p-5 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-2xl dark:shadow-blue-900/5 border border-transparent dark:border-white/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-2xl font-extrabold flex items-center gap-3 text-slate-800 dark:text-white tracking-tight">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Clock className="text-orange-600 dark:text-orange-400 w-6 h-6" />
              </div>
              Exam Countdown
            </h3>
          </div>

          <div className="space-y-4 relative z-10">
            {exams.length === 0 ? (
              <div className="text-center py-12 bg-white/50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/20">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No exams added yet. Start planning!</p>
              </div>
            ) : (
              [...exams].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(exam => {
                const days = getDaysLeft(exam.date);
                const isPassed = progress.completedExams?.[exam.id];
                return (
                  <div key={exam.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl group transition-all duration-300 hover:shadow-md gap-4 ${isPassed ? 'bg-[#C4F135]/20 dark:bg-emerald-500/10 border border-[#C4F135]/50 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 dark:hover:border-white/20 dark:hover:bg-white/10 hover:border-[#C4F135]'} `}>
                    <div className="flex items-center gap-4">
                      {isPassed ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                      )}
                      <div className="min-w-0">
                        <h4 className={`text-lg font-bold truncate ${isPassed ? 'text-emerald-900 dark:text-emerald-100 line-through opacity-70' : 'text-slate-800 dark:text-white'}`}>{exam.subject}</h4>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      {!isPassed && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap ${days <= 7 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                          {days} Days Left
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handlePassed(exam.id, exam.subject)}
                          className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm whitespace-nowrap ${isPassed ? 'bg-[#C4F135] text-[#1E1E2D]' : 'bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-[#C4F135] hover:text-[#1E1E2D] hover:shadow-[#C4F135]/20'}`}
                        >
                          {isPassed ? 'Passed' : 'Mark Passed'}
                        </button>
                        <button 
                          onClick={() => handleDelete(exam.id, exam.subject)}
                          className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors sm:opacity-0 sm:group-hover:opacity-100 p-2 rounded-xl"
                          aria-label="Delete exam"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Add Exam Form */}
        <div className="bg-white dark:bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-2xl dark:shadow-blue-900/5 border border-transparent dark:border-white/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
          
          <h3 className="text-2xl font-extrabold mb-8 text-slate-800 dark:text-white tracking-tight flex items-center gap-3 relative z-10">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Plus className="text-blue-600 dark:text-blue-400 w-6 h-6" />
            </div>
            Add New Exam
          </h3>
          
          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Subject Name</label>
              <input 
                type="text" 
                value={newExamSubject}
                onChange={(e) => setNewExamSubject(e.target.value)}
                placeholder="e.g. Thermodynamics"
                className="w-full px-5 py-3 rounded-xl border border-slate-200/80 dark:border-white/20 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-white/20 dark:focus:border-white/40 outline-none transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Exam Date</label>
              <input 
                type="date" 
                value={newExamDate}
                onChange={(e) => setNewExamDate(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-slate-200/80 dark:border-white/20 bg-white/80 dark:bg-white/5 text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:ring-white/20 dark:focus:border-white/40 outline-none transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={handleAdd}
              disabled={!newExamSubject || !newExamDate}
              className="w-full bg-[#1E1E2D] hover:bg-[#C4F135] text-white hover:text-[#1E1E2D] font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#1E1E2D]/20 disabled:opacity-50 disabled:shadow-none transform hover:-translate-y-0.5 dark:bg-gradient-to-r dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 dark:text-white dark:hover:text-white dark:shadow-purple-500/30"
            >
              <Plus className="w-6 h-6" /> Add Exam to Countdown
            </button>
          </div>
        </div>
      </div>

      {/* Admin Login Logs */}
      {isAdmin && (
        <section className="bg-white dark:bg-white/10 dark:backdrop-blur-md p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent dark:border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <ShieldCheck className="text-emerald-500" /> Admin: Recent Login History
            </h3>
            <button 
              onClick={fetchLogs}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <History className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10">
                  <th className="pb-3 font-semibold text-slate-600 dark:text-slate-400">User</th>
                  <th className="pb-3 font-semibold text-slate-600 dark:text-slate-400">Major</th>
                  <th className="pb-3 font-semibold text-slate-600 dark:text-slate-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {loginLogs.map((log, i) => (
                  <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{log.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{log.email}</div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{log.major}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {new Date(log.login_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {loginLogs.length === 0 && !loadingLogs && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 dark:text-slate-500 italic">No login logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
