import { Injectable, signal, computed, effect } from '@angular/core';
import { UserProgress, TopicProgress, QuizAttempt } from '../models';

const STORAGE_KEY = 'angular-portal-progress';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private _progress = signal<UserProgress>(this.loadFromStorage());

  readonly progress = this._progress.asReadonly();

  readonly completedTopics = computed(() =>
    Object.values(this._progress().topics).filter(t => t.status === 'completed').length
  );

  readonly inProgressTopics = computed(() =>
    Object.values(this._progress().topics).filter(t => t.status === 'in-progress').length
  );

  private _totalTopics = signal(99); // updated from content index at startup

  readonly completionPercentage = computed(() => {
    const total = this._totalTopics();
    return total > 0 ? Math.round((this.completedTopics() / total) * 100) : 0;
  });

  setTotalTopics(total: number): void {
    this._totalTopics.set(total);
  }

  readonly weakQuestions = computed(() =>
    this._progress().quizAttempts
      .filter(a => a.result === 'didnt-know')
      .filter(a => !a.nextReviewAt || new Date(a.nextReviewAt) <= new Date())
  );

  constructor() {
    effect(() => {
      this.saveToStorage(this._progress());
    });
  }

  markTopicStatus(topicId: string, status: TopicProgress['status']): void {
    this._progress.update(p => ({
      ...p,
      lastActivity: new Date().toISOString(),
      topics: {
        ...p.topics,
        [topicId]: {
          topicId,
          status,
          ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
          lastVisitedAt: new Date().toISOString(),
        },
      },
    }));
  }

  recordQuizAttempt(attempt: QuizAttempt): void {
    const nextReview = this.calculateNextReview(attempt);
    this._progress.update(p => ({
      ...p,
      lastActivity: new Date().toISOString(),
      quizAttempts: [...p.quizAttempts, { ...attempt, nextReviewAt: nextReview }],
    }));
  }

  getTopicProgress(topicId: string): TopicProgress | undefined {
    return this._progress().topics[topicId];
  }

  getBlockCompletion(blockId: number): { completed: number; total: number } {
    const topics = Object.values(this._progress().topics)
      .filter(t => t.topicId.startsWith(`b${blockId}t`));
    return {
      completed: topics.filter(t => t.status === 'completed').length,
      total: topics.length,
    };
  }

  private calculateNextReview(attempt: QuizAttempt): string | undefined {
    if (attempt.result === 'knew-it') return undefined;
    const days = attempt.result === 'partial' ? 3 : 1;
    const next = new Date();
    next.setDate(next.getDate() + days);
    return next.toISOString();
  }

  private loadFromStorage(): UserProgress {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return { topics: {}, quizAttempts: [], lastActivity: new Date().toISOString() };
  }

  private saveToStorage(progress: UserProgress): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}
