import { Component, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ContentService } from '../../shared/services/content.service';
import { ProgressService } from '../../shared/services/progress.service';

@Component({
  selector: 'app-sidenav',
  imports: [
    RouterLink, RouterLinkActive,
    MatButtonModule, MatIconModule, MatExpansionModule, MatProgressBarModule,
  ],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
})
export class Sidenav {
  private contentService = inject(ContentService);
  private progressService = inject(ProgressService);

  navigated = output<void>();

  blocks = this.contentService.blocks;
  completedTopics = this.progressService.completedTopics;
  totalTopics = this.contentService.totalTopics;
  completionPercentage = this.progressService.completionPercentage;

  getBlockCompletion(blockId: number): number {
    return this.progressService.getBlockCompletion(blockId).completed;
  }

  getTopicIcon(topicId: string): string {
    const progress = this.progressService.getTopicProgress(topicId);
    if (!progress || progress.status === 'not-started') return 'radio_button_unchecked';
    if (progress.status === 'in-progress') return 'pending';
    return 'check_circle';
  }
}
