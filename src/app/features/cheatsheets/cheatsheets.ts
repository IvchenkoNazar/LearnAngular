import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { ContentService } from '../../shared/services/content.service';
import { ContentBlock, TopicContent } from '../../shared/models';

interface CheatsheetBlock {
  block: ContentBlock;
  summaries: { title: string; htmlContent: string }[];
}

@Component({
  selector: 'app-cheatsheets',
  imports: [RouterLink, MatCardModule, MatIconModule, MatExpansionModule],
  templateUrl: './cheatsheets.html',
  styleUrl: './cheatsheets.scss',
})
export class Cheatsheets implements OnInit {
  private contentService = inject(ContentService);

  blocks = this.contentService.blocks;
  cheatsheets = signal<CheatsheetBlock[]>([]);
  loading = signal(true);

  async ngOnInit() {
    try {
      const sheets: CheatsheetBlock[] = [];
      for (const block of this.blocks()) {
        const summaries: { title: string; htmlContent: string }[] = [];
        for (const topic of block.topics) {
          try {
            const content = await this.contentService.loadTopic(block.slug, topic.slug);
            const summary = content.sections.find(s => s.id === 'summary');
            if (summary) {
              summaries.push({ title: topic.title, htmlContent: summary.htmlContent });
            }
          } catch {
            // Topic content not available yet
          }
        }
        if (summaries.length > 0) {
          sheets.push({ block, summaries });
        }
      }
      this.cheatsheets.set(sheets);
    } finally {
      this.loading.set(false);
    }
  }
}
