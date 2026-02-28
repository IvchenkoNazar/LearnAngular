import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ContentService } from '../../shared/services/content.service';
import { ProgressService } from '../../shared/services/progress.service';

@Component({
  selector: 'app-curriculum',
  imports: [
    RouterLink,
    MatCardModule, MatIconModule,
    MatProgressBarModule, MatChipsModule,
  ],
  templateUrl: './curriculum.html',
  styleUrl: './curriculum.scss',
})
export class Curriculum {
  private contentService = inject(ContentService);
  private progressService = inject(ProgressService);

  blocks = this.contentService.blocks;

  blockProgress = computed(() => {
    const map = new Map<number, { completed: number; total: number; percentage: number }>();
    for (const block of this.blocks()) {
      const { completed, total } = this.progressService.getBlockCompletion(block.id);
      const percentage = block.topicCount > 0
        ? Math.round((completed / block.topicCount) * 100)
        : 0;
      map.set(block.id, { completed, total, percentage });
    }
    return map;
  });

  getProgress(blockId: number) {
    return this.blockProgress().get(blockId) ?? { completed: 0, total: 0, percentage: 0 };
  }

  isPriority(blockId: number): boolean {
    return blockId >= 9 && blockId <= 12;
  }
}
