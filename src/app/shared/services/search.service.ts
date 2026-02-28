import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import lunr from 'lunr';
import { TopicMeta } from '../models';

export interface SearchResult {
  topicId: string;
  topicSlug: string;
  blockSlug: string;
  title: string;
  blockTitle: string;
  score: number;
  matchedTerms: string[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private idx: lunr.Index | null = null;
  private topicMap = new Map<string, { topic: TopicMeta; blockSlug: string; blockTitle: string }>();

  readonly isLoaded = signal(false);

  async loadIndex(): Promise<void> {
    const serialized = await firstValueFrom(
      this.http.get<object>('assets/search-index.json')
    );
    this.idx = lunr.Index.load(serialized);

    const index = await firstValueFrom(
      this.http.get<any>('assets/content-index.json')
    );
    for (const block of index.blocks) {
      for (const topic of block.topics) {
        this.topicMap.set(topic.id, {
          topic,
          blockSlug: block.slug,
          blockTitle: block.title,
        });
      }
    }
    this.isLoaded.set(true);
  }

  search(query: string): SearchResult[] {
    if (!this.idx || !query.trim()) return [];

    return this.idx.search(query).map(result => {
      const entry = this.topicMap.get(result.ref);
      return {
        topicId: result.ref,
        topicSlug: entry?.topic.slug ?? '',
        blockSlug: entry?.blockSlug ?? '',
        title: entry?.topic.title ?? '',
        blockTitle: entry?.blockTitle ?? '',
        score: result.score,
        matchedTerms: Object.keys(result.matchData.metadata),
      };
    });
  }
}
