import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ContentIndex, ContentBlock, TopicContent, InterviewQuestion } from '../models';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);

  private _index = signal<ContentIndex | null>(null);
  private _questions = signal<InterviewQuestion[]>([]);
  private _topicCache = new Map<string, TopicContent>();

  readonly index = this._index.asReadonly();
  readonly blocks = computed(() => this._index()?.blocks ?? []);
  readonly questions = this._questions.asReadonly();
  readonly totalTopics = computed(() => this._index()?.totalTopics ?? 0);
  readonly totalQuestions = computed(() => this._index()?.totalQuestions ?? 0);

  async loadIndex(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<ContentIndex>('assets/content-index.json')
    );
    this._index.set(data);
  }

  async loadQuestions(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<InterviewQuestion[]>('assets/interview-questions.json')
    );
    this._questions.set(data);
  }

  async loadTopic(blockSlug: string, topicSlug: string): Promise<TopicContent> {
    const cacheKey = `${blockSlug}/${topicSlug}`;
    if (this._topicCache.has(cacheKey)) {
      return this._topicCache.get(cacheKey)!;
    }
    const data = await firstValueFrom(
      this.http.get<TopicContent>(`assets/content/${blockSlug}/${topicSlug}.json`)
    );
    this._topicCache.set(cacheKey, data);
    return data;
  }

  getBlock(blockId: number): ContentBlock | undefined {
    return this.blocks().find(b => b.id === blockId);
  }

  getQuestionsByBlock(blockId: number): InterviewQuestion[] {
    return this.questions().filter(q => q.block === blockId);
  }

  getQuestionsByLevel(level: string): InterviewQuestion[] {
    return this.questions().filter(q => q.level === level);
  }
}
