
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { QuizQuestion } from '../types';
import { Loader2, X, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface QuizModalProps {
  topic: string;
  content: string;
  onComplete: () => void;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ topic, content, onComplete, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const result = await geminiService.generateQuiz(topic, content);
        if (result && result.length > 0) {
          setQuestions(result);
        } else {
          setError("Failed to generate quiz questions. Please try again.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while generating the quiz.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [topic, content]);

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
    }
  };

  const handleFinish = () => {
    const passingScore = Math.ceil(questions.length * 0.6); // 60% to pass
    if (score >= passingScore) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white">Topic Quiz: {topic}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Generating your quiz...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-slate-800 dark:text-slate-200">{error}</p>
              <button onClick={onClose} className="px-6 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg font-semibold">Close</button>
            </div>
          ) : showResult ? (
            <div className="py-8 text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto">
                {score >= Math.ceil(questions.length * 0.6) ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-amber-500" />
                )}
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Quiz Complete!</h4>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  You scored <span className="font-bold text-blue-600">{score}</span> out of {questions.length}
                </p>
              </div>
              
              {score >= Math.ceil(questions.length * 0.6) ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                  <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                    Great job! You've passed the quiz and this topic is now marked as completed.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl">
                  <p className="text-amber-700 dark:text-amber-400 text-sm font-medium">
                    You need at least 60% to pass. Review the material and try again later.
                  </p>
                </div>
              )}

              <button 
                onClick={handleFinish}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
              >
                {score >= Math.ceil(questions.length * 0.6) ? 'Finish & Mark Completed' : 'Close'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-blue-600 font-bold">Question {currentIndex + 1}/{questions.length}</span>
                <div className="h-2 w-32 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300" 
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {questions[currentIndex].question}
              </h4>

              <div className="space-y-3">
                {questions[currentIndex].options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = option === questions[currentIndex].correctAnswer;
                  const showFeedback = selectedOption !== null;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      disabled={showFeedback}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center justify-between ${
                        showFeedback
                          ? isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                            : isSelected
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-50'
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
                      }`}
                    >
                      <span className="font-medium">{option}</span>
                      {showFeedback && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>

              {selectedOption && (
                <button 
                  onClick={nextQuestion}
                  className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all animate-slideUp"
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'} <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
