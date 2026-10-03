
import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Flame, 
  GraduationCap, 
  CheckCircle2, 
  BookOpen, 
  Target, 
  Calendar, 
  HelpCircle,
  TrendingUp,
  Award,
  Star,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { AppProgress } from '../types';

interface ReportCardViewProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportCardView: React.FC<ReportCardViewProps> = ({ progress, onUpdateProgress, showToast }) => {
  const taskCount = Object.keys(progress.completedTasks || {}).length;
  const roadmapCount = Object.keys(progress.completedRoadmapWeeks || {}).length;
  const challengeCount = Object.keys(progress.completedChallengeDays || {}).length;
  const notesCount = Object.keys(progress.completedNotes || {}).length;
  const examPassedCount = Object.keys(progress.completedExams || {}).length;
  const questionsStudied = progress.questionsStudied || 0;
  const streaks = progress.streaks || 0;
  const cgpa = progress.cgpa || 0;
  const sgpa = progress.sgpa || 0;

  const getPerformanceData = () => {
    if (cgpa === 0) {
      return { name: "Just Started", badge: "—" };
    }

    const levels = [
      { name: "Needs Focus", badge: "D" },      // CGPA < 6.0
      { name: "Steady Climber", badge: "C" },   // CGPA >= 6.0
      { name: "Rising Star", badge: "B" },      // CGPA >= 7.0
      { name: "High Achiever", badge: "A" },    // CGPA >= 8.0
      { name: "Elite", badge: "A+" },           // CGPA >= 8.5
      { name: "Legend", badge: "S" },           // CGPA >= 9.0
    ];

    let levelIndex = 0;
    if (cgpa >= 9.0) levelIndex = 5;
    else if (cgpa >= 8.5) levelIndex = 4;
    else if (cgpa >= 8.0) levelIndex = 3;
    else if (cgpa >= 7.0) levelIndex = 2;
    else if (cgpa >= 6.0) levelIndex = 1;
    else levelIndex = 0;

    // Boost logic: If streak ≥ 7 days AND CGPA >= 8.0, boost one level up
    if (streaks >= 7 && cgpa >= 8.0 && levelIndex < levels.length - 1) {
      levelIndex += 1;
    }

    return levels[levelIndex];
  };

  const { name: performanceLevel, badge: performanceBadge } = getPerformanceData();

  const stats = [
    { label: 'Exams Passed', value: examPassedCount, icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-400/10', desc: 'Total exams successfully cleared' },
    { label: 'Current Streak', value: `${streaks}d`, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10', desc: 'Consecutive study days' },
    { label: 'Cumulative GPA', value: cgpa.toFixed(2), icon: Award, color: 'text-purple-400', bg: 'bg-purple-400/10', desc: 'Overall academic standing' },
    { label: 'Semester GPA', value: sgpa.toFixed(2), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'Current term performance' },
    { label: 'Tasks Completed', value: taskCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', desc: 'Daily study goals achieved' },
    { label: 'Smart Notes', value: notesCount, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-400/10', desc: 'Topics mastered with AI' },
    { label: 'Roadmap Progress', value: roadmapCount, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10', desc: 'Skill milestones reached' },
    { label: '7-Day Challenge', value: `${challengeCount}/7`, icon: Calendar, color: 'text-pink-400', bg: 'bg-pink-400/10', desc: 'Intensive challenge status' },
    { label: 'Questions Studied', value: questionsStudied, icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-400/10', desc: 'Total practice questions' },
  ];

  const [editingStat, setEditingStat] = React.useState<{ key: string, label: string, value: string } | null>(null);

  const handleSaveStat = () => {
    if (!editingStat) return;
    const val = parseFloat(editingStat.value);
    if (!isNaN(val)) {
      onUpdateProgress({ [editingStat.key]: val });
      showToast(`${editingStat.label} updated successfully!`, 'success');
    } else {
      showToast('Please enter a valid number.', 'error');
    }
    setEditingStat(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8 sm:space-y-12">
      {editingStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 animate-fadeIn">
            <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Update {editingStat.label}</h3>
            <input 
              type="number" 
              step="any"
              value={editingStat.value}
              onChange={(e) => setEditingStat({ ...editingStat, value: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white mb-6 focus:ring-2 focus:ring-blue-500 outline-none text-lg min-h-[48px]"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setEditingStat(null)}
                className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveStat}
                className="px-8 py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg shadow-blue-500/20 min-h-[44px]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-blue-500 font-black tracking-widest uppercase text-[10px] sm:text-xs mb-2"
          >
            <Shield className="w-4 h-4" />
            Academic Transcript v2.0
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none"
          >
            REPORT <span className="text-blue-500">CARD</span>
          </motion.h1>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-5 sm:p-6 rounded-3xl flex items-center gap-5 sm:gap-6 shadow-2xl border border-white/10 dark:border-slate-900/10"
        >
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Performance Level</div>
            <div className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-tight">{performanceLevel}</div>
          </div>
          <div className="h-12 w-[1px] bg-white/20 dark:bg-slate-900/20" />
          <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full border-4 border-blue-500 text-2xl sm:text-3xl font-black shrink-0">
            {performanceBadge}
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="group relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 p-6 sm:p-8 hover:border-blue-500/50 transition-all duration-500 shadow-sm hover:shadow-xl"
          >
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${stat.bg} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
            
            <div className="relative z-10">
              <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                <stat.icon className="h-6 w-6" />
              </div>
              
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {stat.value}
                </span>
                <Activity className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                {stat.label}
              </h3>
              
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
                {stat.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-[2.5rem] bg-blue-600 p-8 sm:p-10 text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden"
      >
        <Zap className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
        
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
            <Star className="w-7 h-7 fill-white" />
            Update Records
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => setEditingStat({ key: 'cgpa', label: 'CGPA', value: cgpa.toString() })}
              className="bg-white/10 hover:bg-white/20 border border-white/20 p-5 sm:p-6 rounded-2xl transition-all group text-left min-h-[80px]"
            >
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Update</div>
              <div className="text-xl font-black tracking-tighter">CGPA</div>
            </button>
            
            <button 
              onClick={() => setEditingStat({ key: 'sgpa', label: 'SGPA', value: sgpa.toString() })}
              className="bg-white/10 hover:bg-white/20 border border-white/20 p-5 sm:p-6 rounded-2xl transition-all group text-left min-h-[80px]"
            >
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Update</div>
              <div className="text-xl font-black tracking-tighter">SGPA</div>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
