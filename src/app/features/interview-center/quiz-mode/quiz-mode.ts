import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ContentService } from '../../../shared/services/content.service';
import { ProgressService } from '../../../shared/services/progress.service';
import { InterviewQuestion, QuestionLevel } from '../../../shared/models';

type QuizResult = 'knew-it' | 'partial' | 'didnt-know';

@Component({
  selector: 'app-quiz-mode',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './quiz-mode.html',
  styleUrl: './quiz-mode.scss',
})
export class QuizMode implements OnInit {
  private contentService = inject(ContentService);
  private progressService = inject(ProgressService);

  private allQuestions = this.contentService.questions;

  queue = signal<InterviewQuestion[]>([]);
  currentIndex = signal(0);
  answerRevealed = signal(false);
  sessionStats = signal({ knew: 0, partial: 0, didnt: 0 });
  finished = signal(false);
  selectedLevel = signal<QuestionLevel>('mid');

  current = computed(() => this.queue()[this.currentIndex()] ?? null);
  progress = computed(() => {
    const total = this.queue().length;
    return total > 0 ? Math.round((this.currentIndex() / total) * 100) : 0;
  });

  levels: QuestionLevel[] = ['junior', 'mid', 'senior', 'staff'];

  ngOnInit() {
    this.buildQueue();
  }

  buildQueue() {
    const weak = this.progressService.weakQuestions();
    const weakIds = new Set(weak.map(a => a.questionId));
    const all = this.allQuestions();
    const weakQs = all.filter(q => weakIds.has(q.id));
    const others = all.filter(q => !weakIds.has(q.id));
    this.queue.set([...weakQs, ...this.shuffle(others)]);
    this.currentIndex.set(0);
    this.finished.set(false);
    this.answerRevealed.set(false);
    this.sessionStats.set({ knew: 0, partial: 0, didnt: 0 });
  }

  revealAnswer() {
    this.answerRevealed.set(true);
  }

  grade(result: QuizResult) {
    const q = this.current();
    if (!q) return;

    this.progressService.recordQuizAttempt({
      questionId: q.id,
      result,
      attemptedAt: new Date().toISOString(),
    });

    this.sessionStats.update(s => ({
      knew: s.knew + (result === 'knew-it' ? 1 : 0),
      partial: s.partial + (result === 'partial' ? 1 : 0),
      didnt: s.didnt + (result === 'didnt-know' ? 1 : 0),
    }));

    const nextIndex = this.currentIndex() + 1;
    if (nextIndex >= this.queue().length) {
      this.finished.set(true);
    } else {
      this.currentIndex.set(nextIndex);
      this.answerRevealed.set(false);
    }
  }

  getAnswerForLevel(q: InterviewQuestion): string {
    return q.referenceAnswers[this.selectedLevel()] ?? q.referenceAnswers['mid'];
  }

  private shuffle<T>(arr: T[]): T[] {
    return [...arr].sort(() => Math.random() - 0.5);
  }
}
