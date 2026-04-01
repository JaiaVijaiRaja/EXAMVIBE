
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
}

export const ReportCardView: React.FC<ReportCardViewProps> = ({ progress, onUpdateProgress }) => {
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
    // If exams passed = 0, always show “Just Started” regardless of CGPA
    if (examPassedCount === 0 || cgpa === 0) {
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

    // Boost logic: If streak ≥ 7 days AND CGPA ≥ 8.0, boost one level up
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-blue-500 font-bold tracking-widest uppercase text-xs mb-2"
          >
            <Shield className="w-4 h-4" />
            Academic Transcript v2.0
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none"
          >
            REPORT <span className="text-blue-500">CARD</span>
          </motion.h1>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-6 rounded-2xl flex items-center gap-6 shadow-2xl"
        >
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Performance Level</div>
            <div className="text-2xl font-black uppercase tracking-tighter">{performanceLevel}</div>
          </div>
          <div className="h-12 w-[1px] bg-white/20 dark:bg-slate-900/20" />
          <div className="flex items-center justify-center h-16 w-16 rounded-full border-4 border-blue-500 text-3xl font-black">
            {performanceBadge}
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 p-6 hover:border-blue-500/50 transition-all duration-500"
          >
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${stat.bg} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
            
            <div className="relative z-10">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {stat.value}
                </span>
                <Activity className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                {stat.label}
              </h3>
              
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
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
        className="rounded-3xl bg-blue-600 p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden"
      >
        <Zap className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 rotate-12" />
        
        <div className="relative z-10">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
            <Star className="w-6 h-6 fill-white" />
            Update Academic Records
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => {
                const val = prompt('Enter CGPA:', cgpa.toString());
                if (val) onUpdateProgress({ cgpa: parseFloat(val) });
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/20 p-4 rounded-2xl transition-all group text-left"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Update</div>
              <div className="text-lg font-black tracking-tighter">CGPA</div>
            </button>
            
            <button 
              onClick={() => {
                const val = prompt('Enter SGPA:', sgpa.toString());
                if (val) onUpdateProgress({ sgpa: parseFloat(val) });
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/20 p-4 rounded-2xl transition-all group text-left"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Update</div>
              <div className="text-lg font-black tracking-tighter">SGPA</div>
            </button>
            
            <button 
              onClick={() => {
                const val = prompt('Enter Streak:', streaks.toString());
                if (val) onUpdateProgress({ streaks: parseInt(val) });
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/20 p-4 rounded-2xl transition-all group text-left"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Update</div>
              <div className="text-lg font-black tracking-tighter">STREAK</div>
            </button>
            
            <button 
              onClick={() => {
                const val = prompt('Enter Questions Studied:', questionsStudied.toString());
                if (val) onUpdateProgress({ questionsStudied: parseInt(val) });
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/20 p-4 rounded-2xl transition-all group text-left"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Update</div>
              <div className="text-lg font-black tracking-tighter">QUESTIONS</div>
            </button>
          </div>
        </div>
      </motion.div>
      
      <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <div>StudySync AI Verification System</div>
        <div>ID: {Math.random().toString(36).substring(7).toUpperCase()}</div>
      </footer>
    </div>
  );
};
