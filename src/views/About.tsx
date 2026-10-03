import React from 'react';
import { motion } from 'motion/react';
import { 
  Info, 
  Shield, 
  Zap, 
  Globe, 
  Github, 
  Linkedin, 
  Mail, 
  GraduationCap, 
  User as UserIcon,
  Code2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-12 pb-20 max-w-5xl mx-auto px-4">
      {/* Hero Section */}
      <header className="text-center space-y-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-bold uppercase tracking-widest mb-4"
        >
          <Sparkles className="w-3.5 h-3.5" />
          The Ultimate Study Companion
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none"
        >
          EXAM <span className="text-blue-500">VIBE</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 dark:text-slate-400 font-medium tracking-tight text-base sm:text-lg md:text-xl max-w-2xl mx-auto"
        >
          Master your academic journey with AI-driven precision and effortless organization.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* About Website - Glassy Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="group relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-6 sm:p-8 md:p-10 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-500"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
          
          <div className="relative z-10 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 sm:p-3 bg-blue-500 rounded-xl sm:rounded-2xl shadow-lg shadow-blue-500/20">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">The Platform</h2>
            </div>
            
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              ExamVibe is an all-in-one study platform designed to help students plan, organize, and improve their learning efficiently. It includes features like exam scheduling, smart study planning, roadmap generation, quick revision tools, and AI-powered note creation. 
            </p>
            
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              The platform allows students to manage their exams, generate study plans, and revise effectively without using multiple apps, creating a unified ecosystem for academic excellence.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mb-2" />
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Efficiency</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">AI Optimization</div>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mb-2" />
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Reliability</div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Cloud Sync</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* About Creator - Glassy Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 p-6 sm:p-8 md:p-10 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-500"
        >
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />
          
          <div className="relative z-10 space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 sm:p-3 bg-purple-500 rounded-xl sm:rounded-2xl shadow-lg shadow-purple-500/20">
                <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">The Creator</h2>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">JAIA VIJAI RAJA PE</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                A passionate Computer Science student and aspiring developer who enjoys building impactful projects that solve real-world problems. I focus on creating smart and efficient digital solutions that improve productivity and learning.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg sm:rounded-xl">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic Details</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">B.Tech in CSE Core (2025 – 2029)</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg sm:rounded-xl">
                  <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                </div>
                <div>
                  <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">Focus Area</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Smart Digital Solutions</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
              <a 
                href="https://github.com/JaiaVijaiRaja" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs sm:text-sm hover:scale-[1.02] active:scale-95 transition-all min-h-[44px]"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <a 
                href="https://www.linkedin.com/in/jaia-vijai-raja-pe-17543637a" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-blue-600 text-white font-bold text-xs sm:text-sm hover:scale-[1.02] active:scale-95 transition-all min-h-[44px]"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Contact Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-10 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden text-center"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="relative z-10 space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Let's Build the Future</h2>
          <p className="text-sm sm:text-base text-blue-100 font-medium max-w-xl mx-auto">
            Have questions, feedback, or collaboration ideas? I'm always open to discussing new projects and opportunities.
          </p>
          <a 
            href="mailto:vijaithegamer@gmail.com"
            className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white text-blue-600 font-black uppercase tracking-widest text-xs sm:text-sm hover:bg-blue-50 transition-colors shadow-xl min-h-[48px]"
          >
            <Mail className="w-5 h-5" />
            Get In Touch
          </a>
        </div>
      </motion.div>
    </div>
  );
};

