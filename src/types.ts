
export interface Exam {
  id: string;
  subject: string;
  date: string;
}

export interface StudyTask {
  day: string;
  tasks: string[];
}

export interface RoadmapItem {
  week: number;
  topic: string;
  description: string;
  resources: string[];
  project: string;
}

export interface ChallengeDay {
  day: number;
  goal: string;
  action: string;
  material: string;
}

export interface User {
  name: string;
  email: string;
  major: string;
  joinedAt: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface AppProgress {
  completedTasks: Record<string, boolean>; // key: day-taskIdx
  completedRoadmapWeeks: Record<string, boolean>; // key: skill-week
  completedChallengeDays: Record<string, boolean>; // key: skill-day
  completedNotes: Record<string, boolean>; // key: topic
  completedAssignments: Record<string, boolean>; // key: questionSnippet
  completedPredictions: Record<string, boolean>; // key: subject
  completedFlashcardSets: Record<string, boolean>; // key: topicsString
  completedExams: Record<string, boolean>; // key: examId
  cgpa?: number;
  sgpa?: number;
  streaks?: number;
  questionsStudied?: number;
  savedRoadmap?: {
    skill: string;
    level: string;
    goal: string;
    items: RoadmapItem[];
  };
  savedPlanner?: {
    subjects: string;
    examDate: string;
    items: StudyTask[];
  };
  savedChallenge?: {
    skill: string;
    items: ChallengeDay[];
  };
}

export interface Flashcard {
  question: string;
  answer: string;
}

export type ViewType = 'dashboard' | 'planner' | 'notes' | 'assignment' | 'roadmap' | 'predictor' | 'challenge' | 'profile' | 'flashcards' | 'calculator' | 'reportcard';
