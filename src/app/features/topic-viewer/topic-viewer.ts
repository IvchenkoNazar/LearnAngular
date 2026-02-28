import { Component, inject, signal, computed, input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ContentService } from '../../shared/services/content.service';
import { ProgressService } from '../../shared/services/progress.service';
import { TopicContent, ContentBlock } from '../../shared/models';

@Component({
  selector: 'app-topic-viewer',
  imports: [
    RouterLink,
    MatTabsModule, MatButtonModule, MatIconModule, MatChipsModule,
  ],
  templateUrl: './topic-viewer.html',
  styleUrl: './topic-viewer.scss',
})
export class TopicViewer implements OnInit {
  private contentService = inject(ContentService);
  private progressService = inject(ProgressService);

  blockSlug = input.required<string>();
  topicSlug = input.required<string>();

  topic = signal<TopicContent | null>(null);
  block = signal<ContentBlock | null>(null);
  loading = signal(true);

  isCompleted = computed(() => {
    const t = this.topic();
    if (!t) return false;
    const p = this.progressService.getTopicProgress(t.id);
    return p?.status === 'completed';
  });

  prevTopic = computed(() => {
    const b = this.block();
    const t = this.topic();
    if (!b || !t) return null;
    const idx = b.topics.findIndex(tp => tp.slug === t.slug);
    return idx > 0 ? b.topics[idx - 1] : null;
  });

  nextTopic = computed(() => {
    const b = this.block();
    const t = this.topic();
    if (!b || !t) return null;
    const idx = b.topics.findIndex(tp => tp.slug === t.slug);
    return idx >= 0 && idx < b.topics.length - 1 ? b.topics[idx + 1] : null;
  });

  async ngOnInit() {
    try {
      const [topicData] = await Promise.all([
        this.contentService.loadTopic(this.blockSlug(), this.topicSlug()),
      ]);
      this.topic.set(topicData);
      this.block.set(this.contentService.getBlockBySlug(this.blockSlug()) ?? null);

      // Mark as visited
      this.progressService.markTopicStatus(topicData.id, 'in-progress');
    } finally {
      this.loading.set(false);
    }
  }

  toggleComplete(): void {
    const t = this.topic();
    if (!t) return;
    const newStatus = this.isCompleted() ? 'in-progress' : 'completed';
    this.progressService.markTopicStatus(t.id, newStatus);
  }
}
