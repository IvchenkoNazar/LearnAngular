import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ContentService } from '../../shared/services/content.service';
import { ProgressService } from '../../shared/services/progress.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatChipsModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private contentService = inject(ContentService);
  private progressService = inject(ProgressService);

  blocks = this.contentService.blocks;
  totalTopics = this.contentService.totalTopics;
  totalQuestions = this.contentService.totalQuestions;
  completedTopics = this.progressService.completedTopics;
  inProgressTopics = this.progressService.inProgressTopics;
  completionPercentage = this.progressService.completionPercentage;
  weakQuestions = this.progressService.weakQuestions;

  recentTopics = computed(() => {
    const topics = Object.values(this.progressService.progress().topics);
    return topics
      .filter(t => t.lastVisitedAt)
      .sort((a, b) => new Date(b.lastVisitedAt!).getTime() - new Date(a.lastVisitedAt!).getTime())
      .slice(0, 5);
  });

  quizAttempts = computed(() => this.progressService.progress().quizAttempts.length);

  strongAnswers = computed(() =>
    this.progressService.progress().quizAttempts.filter(a => a.result === 'knew-it').length
  );
}
