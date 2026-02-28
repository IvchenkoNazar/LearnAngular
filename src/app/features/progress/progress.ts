import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { ContentService } from '../../shared/services/content.service';
import { ProgressService } from '../../shared/services/progress.service';

@Component({
  selector: 'app-progress',
  imports: [
    RouterLink,
    MatCardModule, MatIconModule, MatProgressBarModule, MatButtonModule,
  ],
  templateUrl: './progress.html',
  styleUrl: './progress.scss',
})
export class Progress {
  private contentService = inject(ContentService);
  private progressService = inject(ProgressService);

  blocks = this.contentService.blocks;
  completedTopics = this.progressService.completedTopics;
  inProgressTopics = this.progressService.inProgressTopics;
  totalTopics = this.contentService.totalTopics;
  completionPercentage = this.progressService.completionPercentage;
  weakQuestions = this.progressService.weakQuestions;

  quizStats = computed(() => {
    const attempts = this.progressService.progress().quizAttempts;
    const total = attempts.length;
    const knew = attempts.filter(a => a.result === 'knew-it').length;
    const partial = attempts.filter(a => a.result === 'partial').length;
    const didnt = attempts.filter(a => a.result === 'didnt-know').length;
    return { total, knew, partial, didnt };
  });

  blockProgress = computed(() => {
    return this.blocks().map(block => {
      const { completed } = this.progressService.getBlockCompletion(block.id);
      const percentage = block.topicCount > 0
        ? Math.round((completed / block.topicCount) * 100)
        : 0;
      return { ...block, completed, percentage };
    });
  });

  dueForReview = computed(() => {
    const now = new Date();
    return this.progressService.progress().quizAttempts
      .filter(a => a.nextReviewAt && new Date(a.nextReviewAt) <= now)
      .length;
  });
}
