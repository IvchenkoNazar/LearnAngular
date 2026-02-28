import { Component, inject, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { ContentService } from '../../../shared/services/content.service';
import { ProgressService } from '../../../shared/services/progress.service';

@Component({
  selector: 'app-block-detail',
  imports: [
    RouterLink,
    MatCardModule, MatIconModule, MatChipsModule, MatButtonModule,
  ],
  templateUrl: './block-detail.html',
  styleUrl: './block-detail.scss',
})
export class BlockDetail {
  private contentService = inject(ContentService);
  private progressService = inject(ProgressService);

  blockSlug = input.required<string>();

  block = computed(() => this.contentService.getBlockBySlug(this.blockSlug()));

  topics = computed(() => this.block()?.topics ?? []);

  getStatusIcon(topicId: string): string {
    const progress = this.progressService.getTopicProgress(topicId);
    if (!progress) return 'radio_button_unchecked';
    if (progress.status === 'completed') return 'check_circle';
    if (progress.status === 'in-progress') return 'pending';
    return 'radio_button_unchecked';
  }

  getStatusClass(topicId: string): string {
    const progress = this.progressService.getTopicProgress(topicId);
    if (!progress) return 'text-gray-600';
    if (progress.status === 'completed') return 'text-success';
    if (progress.status === 'in-progress') return 'text-warning';
    return 'text-gray-600';
  }
}
