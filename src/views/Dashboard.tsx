
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
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  exams, 
  progress, 
  onAddExam, 
  onDeleteExam, 
  onMarkExamPassed,
  onViewChange,
  onLogout
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
      setNewExamSubject('');
      setNewExamDate('');
    }
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
      </header>

      {/* Progress Overview */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-xl shadow-blue-200 dark:shadow-none">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6" />
          <h3 className="text-xl font-bold">Your Learning Progress</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-blue-100">Study Tasks</span>
              <span className="text-2xl font-black">{taskCount}</span>
            </div>
            <div className="h-2 bg-blue-400/30 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, taskCount * 10)}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-blue-100">Roadmap Steps</span>
              <span className="text-2xl font-black">{roadmapCount}</span>
            </div>
            <div className="h-2 bg-blue-400/30 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, roadmapCount * 25)}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-blue-100">AI Insights</span>
              <span className="text-2xl font-black">{notesCount + assignmentCount + predictorCount}</span>
            </div>
            <div className="h-2 bg-blue-400/30 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, (notesCount + assignmentCount + predictorCount) * 20)}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-blue-100">Revision</span>
              <span className="text-2xl font-black">{flashcardSetCount}</span>
            </div>
            <div className="h-2 bg-blue-400/30 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, flashcardSetCount * 33)}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onViewChange('planner')}
          className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap className="text-blue-600 dark:text-blue-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Smart Planner</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Generate optimized study schedules.</p>
        </div>

        <div 
          onClick={() => onViewChange('notes')}
          className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Book className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Notes</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Convert topics into structured notes.</p>
        </div>

        <div 
          onClick={() => onViewChange('roadmap')}
          className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Target className="text-emerald-600 dark:text-emerald-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Skill Up</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Step-by-step career roadmaps.</p>
        </div>

        <div 
          onClick={() => onViewChange('flashcards')}
          className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-orange-500 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Brain className="text-orange-600 dark:text-orange-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Revision Cards</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Quick flashcards for completed topics.</p>
        </div>

        <div 
          onClick={() => onViewChange('reportcard')}
          className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BarChart3 className="text-blue-600 dark:text-blue-400 w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Report Card</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Detailed academic performance & stats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exam Countdown */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-blue-900/5 border border-white/80 dark:border-slate-700/50 relative overflow-hidden">
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
              <div className="text-center py-12 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                <p className="text-slate-500 dark:text-slate-400 font-medium">No exams added yet. Start planning!</p>
              </div>
            ) : (
              [...exams].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(exam => {
                const days = getDaysLeft(exam.date);
                const isPassed = progress.completedExams?.[exam.id];
                return (
                  <div key={exam.id} className={`flex items-center justify-between p-5 rounded-2xl group transition-all duration-300 hover:shadow-md ${isPassed ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' : 'bg-white/80 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 hover:border-blue-200'}`}>
                    <div className="flex items-center gap-4">
                      {isPassed ? (
                        <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                      )}
                      <div>
                        <h4 className={`text-lg font-bold ${isPassed ? 'text-emerald-900 dark:text-emerald-100 line-through opacity-70' : 'text-slate-800 dark:text-white'}`}>{exam.subject}</h4>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {!isPassed && (
                        <div className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${days <= 7 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                          {days} Days Left
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onMarkExamPassed(exam.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${isPassed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white hover:shadow-blue-500/20'}`}
                        >
                          {isPassed ? 'Passed' : 'Mark Passed'}
                        </button>
                        <button 
                          onClick={() => onDeleteExam(exam.id)}
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 p-2 rounded-xl"
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
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-blue-900/5 border border-white/80 dark:border-slate-700/50 relative overflow-hidden">
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
                className="w-full px-5 py-3 rounded-xl border border-slate-200/80 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Exam Date</label>
              <input 
                type="date" 
                value={newExamDate}
                onChange={(e) => setNewExamDate(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-slate-200/80 dark:border-slate-600 bg-white/80 dark:bg-slate-700/80 text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={handleAdd}
              disabled={!newExamSubject || !newExamDate}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transform hover:-translate-y-0.5"
            >
              <Plus className="w-6 h-6" /> Add Exam to Countdown
            </button>
          </div>
        </div>
      </div>

      {/* Admin Login Logs */}
      {isAdmin && (
        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
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
                <tr className="border-b border-slate-100 dark:border-slate-700">
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
                      <div className="text-xs text-slate-500">{log.email}</div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{log.major}</td>
                    <td className="py-3 text-slate-500 text-xs">
                      {new Date(log.login_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {loginLogs.length === 0 && !loadingLogs && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 italic">No login logs found.</td>
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
