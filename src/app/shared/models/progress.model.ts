export interface TopicProgress {
  topicId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt?: string;
  lastVisitedAt?: string;
}

export interface QuizAttempt {
  questionId: string;
  result: 'knew-it' | 'partial' | 'didnt-know';
  attemptedAt: string;
  nextReviewAt?: string;     // spaced repetition
}

export interface UserProgress {
  topics: Record<string, TopicProgress>;
  quizAttempts: QuizAttempt[];
  lastActivity: string;
}
