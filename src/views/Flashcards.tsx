
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { AppProgress, Flashcard } from '../types';
import { QuizModal } from '../components/QuizModal';
import { Loader2, Sparkles, Brain, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Download } from 'lucide-react';
import { exportToMarkdown, exportToPDF, generateFlashcardsMarkdown } from '../lib/exportUtils';

interface FlashcardsProps {
  progress: AppProgress;
  onUpdateProgress: (newProgress: Partial<AppProgress>) => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ progress, onUpdateProgress }) => {
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const topicsKey = selectedTopics.sort().join('|');
  const isCompleted = !!(progress.completedFlashcardSets || {})[topicsKey];

  useEffect(() => {
    const topics: string[] = [];
    
    // Extract from Study Planner
    if (progress.savedPlanner) {
      progress.savedPlanner.items.forEach(day => {
        day.tasks.forEach((task, idx) => {
          if (progress.completedTasks[`${day.day}-${idx}`]) {
            topics.push(task);
          }
        });
      });
    }

    // Extract from Roadmap
    if (progress.savedRoadmap) {
      progress.savedRoadmap.items.forEach(item => {
        if (progress.completedRoadmapWeeks[`${progress.savedRoadmap?.skill}-${item.week}`]) {
          topics.push(item.topic);
        }
      });
    }

    // Extract from Challenges
    if (progress.savedChallenge) {
      progress.savedChallenge.items.forEach(item => {
        if (progress.completedChallengeDays[`${progress.savedChallenge?.skill}-${item.day}`]) {
          topics.push(item.goal);
        }
      });
    }

    setCompletedTopics(Array.from(new Set(topics)));
  }, [progress]);

  const handleGenerate = async () => {
    if (selectedTopics.length === 0) return;
    setLoading(true);
    try {
      const result = await geminiService.generateFlashcards(selectedTopics);
      setFlashcards(result);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    const newCompleted = { ...(progress.completedFlashcardSets || {}) };
    newCompleted[topicsKey] = true;
    onUpdateProgress({ 
      completedFlashcardSets: newCompleted,
      questionsStudied: (progress.questionsStudied || 0) + flashcards.length
    });
    setShowQuiz(false);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const reset = () => {
    setFlashcards([]);
    setSelectedTopics([]);
  };

  if (flashcards.length > 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
        <div className="flex items-center justify-between">
          <button 
            onClick={reset}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Selection
          </button>
          <div className="flex items-center gap-4">
            <div className="relative group/export">
              <button className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-10">
                <button 
                  onClick={() => exportToMarkdown(`flashcards-${selectedTopics.join('-').toLowerCase()}`, generateFlashcardsMarkdown(selectedTopics, flashcards))}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Export as Markdown (.md)
                </button>
                <button 
                  onClick={() => exportToPDF('flashcards-list', `flashcards-${selectedTopics.join('-').toLowerCase()}`)}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Export as PDF (.pdf)
                </button>
              </div>
            </div>
            <div className="text-sm font-medium text-slate-500">
              Card {currentIndex + 1} of {flashcards.length}
            </div>
          </div>
        </div>

        <div 
          className="relative h-80 w-full perspective-1000 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-8 text-center">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Question</span>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {flashcards[currentIndex].question}
              </h3>
              <p className="mt-8 text-sm text-slate-400 animate-pulse">Click to flip</p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-blue-50 dark:bg-slate-900 rounded-2xl shadow-xl border border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center p-8 text-center">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">Answer</span>
              <p className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed">
                {flashcards[currentIndex].answer}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-6 py-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={nextCard}
            disabled={currentIndex === flashcards.length - 1}
            className="p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-700 flex justify-center">
          <button 
            onClick={() => !isCompleted && setShowQuiz(true)}
            disabled={isCompleted}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              isCompleted 
                ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'text-emerald-600' : ''}`} />
            {isCompleted ? 'Set Completed' : 'Mark Set as Completed'}
          </button>
        </div>

        {/* Hidden list for PDF export */}
        <div id="flashcards-list" className="sr-only-export p-8 bg-white dark:bg-slate-800">
          <h2 className="text-2xl font-bold mb-6">Flashcards: {selectedTopics.join(', ')}</h2>
          <div className="space-y-6">
            {flashcards.map((card, i) => (
              <div key={i} className="pb-6 border-b border-slate-100 dark:border-slate-700">
                <p className="font-bold text-blue-600 mb-2">Q: {card.question}</p>
                <p className="text-slate-700 dark:text-slate-300">A: {card.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {showQuiz && (
          <QuizModal 
            topic={`Flashcard Revision: ${selectedTopics.join(', ')}`} 
            content={flashcards.map(f => `${f.question}: ${f.answer}`).join('\n')} 
            onComplete={handleComplete} 
            onClose={() => setShowQuiz(false)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <Brain className="text-blue-600" /> Revision Flashcards
        </h2>
        <p className="text-slate-600 dark:text-slate-400">Select completed topics to generate AI-powered revision cards.</p>
      </header>

      {completedTopics.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Completed Topics Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Complete tasks in your Study Planner or Skill Roadmaps to unlock revision flashcards.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">Completed Topics ({completedTopics.length})</h3>
              <button 
                onClick={() => setSelectedTopics(selectedTopics.length === completedTopics.length ? [] : [...completedTopics])}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                {selectedTopics.length === completedTopics.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedTopics.map((topic, idx) => (
                <div 
                  key={idx}
                  onClick={() => toggleTopic(topic)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                    selectedTopics.includes(topic) 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  <span className={`text-sm font-medium ${selectedTopics.includes(topic) ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {topic}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedTopics.includes(topic) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {selectedTopics.includes(topic) && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-8">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Ready to Revise?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                We'll generate 10 targeted questions and answers based on your selected topics to help you lock in your knowledge.
              </p>
              <button 
                onClick={handleGenerate}
                disabled={loading || selectedTopics.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 dark:shadow-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate Flashcards
              </button>
              {selectedTopics.length === 0 && (
                <p className="text-xs text-center text-slate-400 mt-4">Select at least one topic to begin</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};
