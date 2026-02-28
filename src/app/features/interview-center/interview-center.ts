import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../shared/services/content.service';
import { ProgressService } from '../../shared/services/progress.service';
import { InterviewQuestion, QuestionLevel } from '../../shared/models';

@Component({
  selector: 'app-interview-center',
  imports: [
    RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatChipsModule, MatTableModule,
  ],
  templateUrl: './interview-center.html',
  styleUrl: './interview-center.scss',
})
export class InterviewCenter {
  private contentService = inject(ContentService);
  private progressService = inject(ProgressService);

  questions = this.contentService.questions;
  blocks = this.contentService.blocks;

  selectedBlock = signal<number | null>(null);
  selectedLevel = signal<QuestionLevel | null>(null);

  filteredQuestions = computed(() => {
    let q = this.questions();
    const block = this.selectedBlock();
    const level = this.selectedLevel();
    if (block !== null) q = q.filter(item => item.block === block);
    if (level !== null) q = q.filter(item => item.level === level);
    return q;
  });

  practicedCount = computed(() => {
    const attempts = this.progressService.progress().quizAttempts;
    const ids = new Set(attempts.map(a => a.questionId));
    return this.questions().filter(q => ids.has(q.id)).length;
  });

  accuracyRate = computed(() => {
    const attempts = this.progressService.progress().quizAttempts;
    if (attempts.length === 0) return 0;
    const knew = attempts.filter(a => a.result === 'knew-it').length;
    return Math.round((knew / attempts.length) * 100);
  });

  levels: QuestionLevel[] = ['junior', 'mid', 'senior', 'staff'];

  getLevelColor(level: QuestionLevel): string {
    const colors: Record<QuestionLevel, string> = {
      junior: 'text-success',
      mid: 'text-cyan',
      senior: 'text-accent',
      staff: 'text-warning',
    };
    return colors[level];
  }
}
